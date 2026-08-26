import mongoose from "mongoose";
import {
  MEMBER_TYPES,
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  Project,
  ProjectMember,
  User,
  WorkspaceMember,
} from "../models/index.js";
import {
  getDatabaseProjectAccess,
  hasDatabaseProjectPermission,
} from "../utils/databaseProjectAccess.js";
import {
  removeDatabaseUserFromTaskAssignments,
} from "../utils/databaseTaskAssignee.js";
import {
  isAssignableProjectRole,
} from "../utils/taskAssignee.js";

const editableProjectRoles = new Set([
  PROJECT_ROLES.CONTRIBUTOR,
  PROJECT_ROLES.REVIEWER,
]);

async function findProject(projectId) {
  return Project.findById(projectId);
}

async function findProjectMembership(
  projectId,
  userId,
) {
  return ProjectMember.findOne({
    projectId,
    userId,
  });
}

async function findWorkspaceMembership(
  workspaceId,
  userId,
) {
  return WorkspaceMember.findOne({
    workspaceId,
    userId,
  });
}

async function canManageProjectMembers(
  userId,
  project,
) {
  if (project.ownerId === userId) {
    return true;
  }

  const canManageThroughProject =
    await hasDatabaseProjectPermission(
      project,
      userId,
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    );

  if (canManageThroughProject) {
    return true;
  }

  const workspaceMembership =
    await findWorkspaceMembership(
      project.workspaceId,
      userId,
    );

  return (
    workspaceMembership?.role ===
      WORKSPACE_ROLES.OWNER ||
    workspaceMembership?.role ===
      WORKSPACE_ROLES.ADMIN
  );
}

async function presentProjectMember(
  membership,
  project,
) {
  const user = await User.findById(
    membership.userId,
  );

  const workspaceMembership =
    await findWorkspaceMembership(
      project.workspaceId,
      membership.userId,
    );

  return {
    userId: membership.userId,
    name:
      user?.name ??
      "Unknown user",
    email:
      user?.email ??
      null,
    projectRole: membership.role,

    canBeAssigned:
      isAssignableProjectRole(
        membership.role,
      ),

    workspaceRole:
      workspaceMembership?.role ??
      null,

    memberType:
      workspaceMembership?.role ===
      WORKSPACE_ROLES.GUEST
        ? MEMBER_TYPES.GUEST
        : MEMBER_TYPES.INTERNAL,

    joinedAt:
      membership.joinedAt ??
      membership.createdAt ??
      null,
  };
}

async function removeUnusedGuestWorkspaceMembership(
  workspaceId,
  userId,
  session,
) {
  const workspaceMembership =
    await WorkspaceMember.findOne({
      workspaceId,
      userId,
      role: WORKSPACE_ROLES.GUEST,
    }).session(session);

  if (!workspaceMembership) {
    return false;
  }

  const remainingMemberships =
    await ProjectMember.find({
      userId,
    })
      .session(session)
      .select("projectId");

  const projectIds =
    remainingMemberships.map(
      (membership) =>
        membership.projectId,
    );

  let hasAnotherProject = false;

  if (projectIds.length > 0) {
    hasAnotherProject = Boolean(
      await Project.exists({
        _id: {
          $in: projectIds,
        },
        workspaceId,
      }).session(session),
    );
  }

  if (hasAnotherProject) {
    return false;
  }

  await WorkspaceMember.deleteOne(
    {
      _id: workspaceMembership.id,
    },
    {
      session,
    },
  );

  return true;
}

export async function getProjectMembers(
  request,
  response,
) {
  const project = await findProject(
    request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  const projectAccess =
    await getDatabaseProjectAccess(
      project,
      request.user.id,
    );

  const canManage =
    await canManageProjectMembers(
      request.user.id,
      project,
    );

  if (!projectAccess && !canManage) {
    return response.status(403).json({
      message:
        "You do not have access to this project",
    });
  }

  const memberships =
    await ProjectMember.find({
      projectId: project.id,
    });

  const members = await Promise.all(
    memberships.map(
      (membership) =>
        presentProjectMember(
          membership,
          project,
        ),
    ),
  );

  members.sort(
    (
      firstMember,
      secondMember,
    ) => {
      if (
        firstMember.projectRole ===
        PROJECT_ROLES.OWNER
      ) {
        return -1;
      }

      if (
        secondMember.projectRole ===
        PROJECT_ROLES.OWNER
      ) {
        return 1;
      }

      return firstMember.name.localeCompare(
        secondMember.name,
      );
    },
  );

  return response.status(200).json({
    members,
    canManageMembers: canManage,
  });
}

export async function updateProjectMember(
  request,
  response,
) {
  const project = await findProject(
    request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !(await canManageProjectMembers(
      request.user.id,
      project,
    ))
  ) {
    return response.status(403).json({
      message:
        "You do not have permission to manage project members",
    });
  }

  const {
    role,
  } = request.body ?? {};

  if (
    !editableProjectRoles.has(role)
  ) {
    return response.status(400).json({
      message:
        "Project role must be CONTRIBUTOR or REVIEWER",
    });
  }

  const membership =
    await findProjectMembership(
      project.id,
      request.params.userId,
    );

  if (!membership) {
    return response.status(404).json({
      message:
        "Project member not found",
    });
  }

  if (
    membership.role ===
      PROJECT_ROLES.OWNER ||
    membership.userId ===
      project.ownerId
  ) {
    return response.status(409).json({
      message:
        "Transfer project ownership before changing the owner's role",
    });
  }

  const session =
    await mongoose.startSession();

  let updatedMembership;
  let unassignedTaskCount = 0;

  try {
    await session.withTransaction(
      async () => {
        updatedMembership =
          await ProjectMember.findById(
            membership.id,
          ).session(session);

        updatedMembership.role = role;

        await updatedMembership.save({
          session,
        });

        if (
          !isAssignableProjectRole(
            role,
          )
        ) {
          unassignedTaskCount =
            await removeDatabaseUserFromTaskAssignments(
              project.id,
              membership.userId,
              {
                session,
              },
            );
        }

        await Project.updateOne(
          {
            _id: project.id,
          },
          {
            $set: {
              updatedAt: new Date(),
            },
          },
          {
            session,
            timestamps: false,
          },
        );
      },
    );
  } finally {
    await session.endSession();
  }

  return response.status(200).json({
    member:
      await presentProjectMember(
        updatedMembership,
        project,
      ),

    unassignedTaskCount,
  });
}

export async function removeProjectMember(
  request,
  response,
) {
  const project = await findProject(
    request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !(await canManageProjectMembers(
      request.user.id,
      project,
    ))
  ) {
    return response.status(403).json({
      message:
        "You do not have permission to manage project members",
    });
  }

  const membership =
    await findProjectMembership(
      project.id,
      request.params.userId,
    );

  if (!membership) {
    return response.status(404).json({
      message:
        "Project member not found",
    });
  }

  if (
    membership.role ===
      PROJECT_ROLES.OWNER ||
    membership.userId ===
      project.ownerId
  ) {
    return response.status(409).json({
      message:
        "Project owners cannot be removed. Transfer ownership first.",
    });
  }

  const session =
    await mongoose.startSession();

  let unassignedTaskCount = 0;
  let workspaceGuestRemoved = false;

  try {
    await session.withTransaction(
      async () => {
        await ProjectMember.deleteOne(
          {
            _id: membership.id,
          },
          {
            session,
          },
        );

        unassignedTaskCount =
          await removeDatabaseUserFromTaskAssignments(
            project.id,
            membership.userId,
            {
              session,
            },
          );

        workspaceGuestRemoved =
          await removeUnusedGuestWorkspaceMembership(
            project.workspaceId,
            membership.userId,
            session,
          );

        await Project.updateOne(
          {
            _id: project.id,
          },
          {
            $set: {
              updatedAt: new Date(),
            },
          },
          {
            session,
            timestamps: false,
          },
        );
      },
    );
  } finally {
    await session.endSession();
  }

  return response.status(200).json({
    message:
      "Project member removed",
    userId: membership.userId,
    unassignedTaskCount,
    workspaceGuestRemoved,
  });
}

export async function transferProjectOwnership(
  request,
  response,
) {
  const project = await findProject(
    request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    project.ownerId !==
    request.user.id
  ) {
    return response.status(403).json({
      message:
        "Only the current project owner can transfer ownership",
    });
  }

  const {
    userId,
  } = request.body ?? {};

  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return response.status(400).json({
      message:
        "The new owner's userId is required",
    });
  }

  const normalizedUserId =
    userId.trim();

  if (
    normalizedUserId ===
    request.user.id
  ) {
    return response.status(400).json({
      message:
        "This user already owns the project",
    });
  }

  const newOwnerMembership =
    await findProjectMembership(
      project.id,
      normalizedUserId,
    );

  if (!newOwnerMembership) {
    return response.status(400).json({
      message:
        "The new owner must already be a project member",
    });
  }

  const newOwnerWorkspaceMembership =
    await findWorkspaceMembership(
      project.workspaceId,
      normalizedUserId,
    );

  if (!newOwnerWorkspaceMembership) {
    return response.status(400).json({
      message:
        "The new owner must belong to the workspace",
    });
  }

  if (
    newOwnerWorkspaceMembership.role ===
    WORKSPACE_ROLES.GUEST
  ) {
    return response.status(400).json({
      message:
        "Guest users cannot own projects",
    });
  }

  const previousOwnerId =
    request.user.id;

  const timestamp = new Date();

  const session =
    await mongoose.startSession();

  let updatedProject;

  try {
    await session.withTransaction(
      async () => {
        await ProjectMember.updateMany(
          {
            projectId: project.id,
            role: PROJECT_ROLES.OWNER,
          },
          {
            $set: {
              role:
                PROJECT_ROLES.CONTRIBUTOR,
              updatedAt: timestamp,
            },
          },
          {
            session,
            timestamps: false,
          },
        );

        await ProjectMember.findOneAndUpdate(
          {
            projectId: project.id,
            userId: previousOwnerId,
          },
          {
            $set: {
              role:
                PROJECT_ROLES.CONTRIBUTOR,
              updatedAt: timestamp,
            },

            $setOnInsert: {
              joinedAt: timestamp,
            },
          },
          {
            session,
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            timestamps: false,
          },
        );

        await ProjectMember.updateOne(
          {
            _id: newOwnerMembership.id,
          },
          {
            $set: {
              role: PROJECT_ROLES.OWNER,
              updatedAt: timestamp,
            },
          },
          {
            session,
            timestamps: false,
          },
        );

        updatedProject =
          await Project.findOneAndUpdate(
            {
              _id: project.id,
              ownerId: previousOwnerId,
            },
            {
              $set: {
                ownerId:
                  normalizedUserId,
                updatedAt: timestamp,
              },
            },
            {
              session,
              new: true,
              timestamps: false,
            },
          );

        if (!updatedProject) {
          throw new Error(
            "Project ownership changed during transfer",
          );
        }
      },
    );
  } finally {
    await session.endSession();
  }

  const previousOwnerMembership =
    await findProjectMembership(
      project.id,
      previousOwnerId,
    );

  const currentOwnerMembership =
    await findProjectMembership(
      project.id,
      normalizedUserId,
    );

  return response.status(200).json({
    message:
      "Project ownership transferred",

    project:
      updatedProject.toJSON(),

    previousOwner:
      await presentProjectMember(
        previousOwnerMembership,
        updatedProject,
      ),

    newOwner:
      await presentProjectMember(
        currentOwnerMembership,
        updatedProject,
      ),
  });
}