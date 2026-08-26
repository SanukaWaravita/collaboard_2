import mongoose from "mongoose";
import {
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  PROJECT_VISIBILITY,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  Project,
  ProjectInvitation,
  ProjectMember,
  Task,
  Workspace,
  WorkspaceMember,
} from "../models/index.js";
import {
  getDatabaseProjectAccess,
  hasDatabaseProjectPermission,
} from "../utils/databaseProjectAccess.js";
import {
  generateProjectKey,
  normalizeProjectKey,
  projectKeyExists,
  validateProjectKey,
} from "../utils/projectKey.js";
import { presentTask } from "../utils/taskReporter.js";
import {
  createDefaultWorkflowStatuses,
} from "../utils/workflowStatuses.js";

async function presentProject(
  project,
  userId,
  knownAccess = null,
) {
  const access =
    knownAccess ??
    (await getDatabaseProjectAccess(
      project,
      userId,
    ));

  const taskCount = await Task.countDocuments({
    projectId: project.id,
  });

  return {
    ...project.toJSON(),
    taskCount,
    currentUserRole: access?.role ?? null,
    isMember: access?.isMember ?? false,
    permissions: access?.permissions ?? [],
  };
}

async function findWorkspaceMembershipForCreation(
  userId,
  requestedWorkspaceId,
) {
  if (requestedWorkspaceId) {
    const membership =
      await WorkspaceMember.findOne({
        workspaceId: requestedWorkspaceId,
        userId,
      });

    return {
      membership,
      eligibleMembershipCount: null,
    };
  }

  const eligibleMemberships =
    await WorkspaceMember.find({
      userId,
      role: {
        $ne: WORKSPACE_ROLES.GUEST,
      },
    }).limit(2);

  return {
    membership:
      eligibleMemberships.length === 1
        ? eligibleMemberships[0]
        : null,
    eligibleMembershipCount:
      eligibleMemberships.length,
  };
}

export async function getProjects(
  request,
  response,
) {
  const requestedWorkspaceId =
    request.params.workspaceId ??
    request.query.workspaceId;

  const filter = requestedWorkspaceId
    ? {
        workspaceId: requestedWorkspaceId,
      }
    : {};

  const projects = await Project.find(
    filter,
  ).sort({
    createdAt: 1,
  });

  const accessibleProjects = [];

  for (const project of projects) {
    const access =
      await getDatabaseProjectAccess(
        project,
        request.user.id,
      );

    if (!access) {
      continue;
    }

    accessibleProjects.push(
      await presentProject(
        project,
        request.user.id,
        access,
      ),
    );
  }

  return response.status(200).json({
    projects: accessibleProjects,
  });
}

export async function createProject(
  request,
  response,
) {
  const {
    workspaceId: bodyWorkspaceId,
    name,
    description = "",
    projectKey,
    visibility =
      PROJECT_VISIBILITY.PRIVATE,
  } = request.body ?? {};

  const workspaceId =
    request.params.workspaceId ??
    bodyWorkspaceId;

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return response.status(400).json({
      message: "Project name is required",
    });
  }

  if (typeof description !== "string") {
    return response.status(400).json({
      message:
        "Project description must be text",
    });
  }

  if (
    !Object.values(
      PROJECT_VISIBILITY,
    ).includes(visibility)
  ) {
    return response.status(400).json({
      message:
        "Visibility must be open or private",
    });
  }

  const {
    membership: workspaceMembership,
    eligibleMembershipCount,
  } =
    await findWorkspaceMembershipForCreation(
      request.user.id,
      workspaceId,
    );

  if (!workspaceMembership) {
    if (
      !workspaceId &&
      eligibleMembershipCount > 1
    ) {
      return response.status(400).json({
        message:
          "workspaceId is required when you belong to multiple workspaces",
      });
    }

    return response.status(403).json({
      message:
        "You cannot create projects in this workspace",
    });
  }

  if (
    workspaceMembership.role ===
    WORKSPACE_ROLES.GUEST
  ) {
    return response.status(403).json({
      message:
        "Guest users cannot create projects",
    });
  }

  const workspace =
    await Workspace.findById(
      workspaceMembership.workspaceId,
    );

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  const normalizedKey = projectKey
    ? normalizeProjectKey(projectKey)
    : await generateProjectKey(
        workspace.id,
        name,
      );

  if (!validateProjectKey(normalizedKey)) {
    return response.status(400).json({
      message:
        "Project key must contain 2–10 uppercase letters or numbers",
    });
  }

  if (
    await projectKeyExists(
      workspace.id,
      normalizedKey,
    )
  ) {
    return response.status(409).json({
      message:
        "That project key is already used in this workspace",
    });
  }

  const session =
    await mongoose.startSession();

  let project;

  try {
    await session.withTransaction(
      async () => {
        project = new Project({
          workspaceId: workspace.id,
          projectKey: normalizedKey,
          name: name.trim(),
          description:
            description.trim(),
          visibility,
          ownerId: request.user.id,
          workflowStatuses:
            createDefaultWorkflowStatuses(),
        });

        await project.save({
          session,
        });

        await ProjectMember.create(
          [
            {
              projectId: project.id,
              userId: request.user.id,
              role: PROJECT_ROLES.OWNER,
              joinedAt: new Date(),
            },
          ],
          {
            session,
          },
        );
      },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message:
          "That project key is already used in this workspace",
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return response.status(201).json({
    project: await presentProject(
      project,
      request.user.id,
    ),
  });
}

export async function getProject(
  request,
  response,
) {
  const project = await Project.findById(
    request.params.projectId,
  );

  if (
    !project ||
    !(await hasDatabaseProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.READ_PROJECT,
    ))
  ) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  const taskDocuments = await Task.find({
    projectId: project.id,
  }).sort({
    createdAt: 1,
  });

  const tasks = taskDocuments.map(
    (task) =>
      presentTask(
        task.toJSON(),
        request.user.id,
      ),
  );

  return response.status(200).json({
    project: await presentProject(
      project,
      request.user.id,
    ),
    tasks,
  });
}

export async function updateProject(
  request,
  response,
) {
  const project = await Project.findById(
    request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !(await hasDatabaseProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.UPDATE_PROJECT,
    ))
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can update this project",
    });
  }

  const {
    name,
    description,
    visibility,
  } = request.body ?? {};

  const containsUpdate =
    name !== undefined ||
    description !== undefined ||
    visibility !== undefined;

  if (!containsUpdate) {
    return response.status(400).json({
      message:
        "Provide a name, description, or visibility to update",
    });
  }

  if (
    name !== undefined &&
    (typeof name !== "string" ||
      !name.trim())
  ) {
    return response.status(400).json({
      message:
        "Project name cannot be empty",
    });
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return response.status(400).json({
      message:
        "Project description must be text",
    });
  }

  if (
    visibility !== undefined &&
    !Object.values(
      PROJECT_VISIBILITY,
    ).includes(visibility)
  ) {
    return response.status(400).json({
      message:
        "Visibility must be open or private",
    });
  }

  if (name !== undefined) {
    project.name = name.trim();
  }

  if (description !== undefined) {
    project.description =
      description.trim();
  }

  if (visibility !== undefined) {
    project.visibility = visibility;
  }

  await project.save();

  return response.status(200).json({
    project: await presentProject(
      project,
      request.user.id,
    ),
  });
}

export async function deleteProject(
  request,
  response,
) {
  const project = await Project.findById(
    request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !(await hasDatabaseProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.DELETE_PROJECT,
    ))
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can delete this project",
    });
  }

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        await Task.deleteMany(
  {
    projectId: project.id,
  },
  {
    session,
  },
);

await ProjectMember.deleteMany(
  {
    projectId: project.id,
  },
  {
    session,
  },
);

await ProjectInvitation.deleteMany(
  {
    projectId: project.id,
  },
  {
    session,
  },
);

        await Project.deleteOne(
          {
            _id: project.id,
          },
          {
            session,
          },
        );
      },
    );
  } finally {
    await session.endSession();
  }

  return response.status(204).send();
}