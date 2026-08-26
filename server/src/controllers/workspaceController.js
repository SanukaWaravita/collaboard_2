import mongoose from "mongoose";
import {
  WORKSPACE_PERMISSIONS,
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
  getWorkspacePermissions,
} from "../utils/workspaceAccess.js";
import {
  generateWorkspaceSlug,
  normalizeWorkspaceSlug,
  validateWorkspaceSlug,
  workspaceSlugExists,
} from "../utils/workspaceSlug.js";

function hasPermission(
  membership,
  permission,
) {
  return getWorkspacePermissions(
    membership?.role,
  ).includes(permission);
}

async function presentWorkspace(
  workspace,
  membership,
) {
  const [
    memberCount,
    projectCount,
  ] = await Promise.all([
    WorkspaceMember.countDocuments({
      workspaceId: workspace.id,
    }),

    Project.countDocuments({
      workspaceId: workspace.id,
    }),
  ]);

  return {
    ...workspace.toJSON(),

    memberCount,
    projectCount,

    currentUserRole:
      membership?.role ?? null,

    permissions:
      getWorkspacePermissions(
        membership?.role,
      ),
  };
}

export async function getWorkspaces(
  request,
  response,
) {
  const memberships =
    await WorkspaceMember.find({
      userId: request.user.id,
    }).sort({
      joinedAt: 1,
    });

  const workspaceIds =
    memberships.map(
      (membership) =>
        membership.workspaceId,
    );

  const workspaces =
    await Workspace.find({
      _id: {
        $in: workspaceIds,
      },
    }).sort({
      createdAt: 1,
    });

  const membershipsByWorkspaceId =
    new Map(
      memberships.map((membership) => [
        membership.workspaceId,
        membership,
      ]),
    );

  const presentedWorkspaces =
    await Promise.all(
      workspaces.map((workspace) =>
        presentWorkspace(
          workspace,
          membershipsByWorkspaceId.get(
            workspace.id,
          ),
        ),
      ),
    );

  return response.status(200).json({
    workspaces: presentedWorkspaces,
  });
}

export async function createWorkspace(
  request,
  response,
) {
  const {
    name,
    slug: requestedSlug,
  } = request.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return response.status(400).json({
      message:
        "Workspace name is required",
    });
  }

  const slug = requestedSlug
    ? normalizeWorkspaceSlug(
        requestedSlug,
      )
    : await generateWorkspaceSlug(
        name,
      );

  if (!validateWorkspaceSlug(slug)) {
    return response.status(400).json({
      message:
        "Workspace slug must contain 2–50 lowercase letters, numbers, or hyphens",
    });
  }

  if (
    await workspaceSlugExists(slug)
  ) {
    return response.status(409).json({
      message:
        "That workspace slug is already in use",
    });
  }

  const session =
    await mongoose.startSession();

  let workspace;
  let membership;

  try {
    await session.withTransaction(
      async () => {
        workspace = new Workspace({
          name: name.trim(),
          slug,
          ownerId: request.user.id,
        });

        await workspace.save({
          session,
        });

        membership =
          new WorkspaceMember({
            workspaceId: workspace.id,
            userId: request.user.id,
            role:
              WORKSPACE_ROLES.OWNER,
          });

        await membership.save({
          session,
        });
      },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message:
          "That workspace slug is already in use",
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return response.status(201).json({
    workspace:
      await presentWorkspace(
        workspace,
        membership,
      ),
  });
}

export async function getWorkspace(
  request,
  response,
) {
  const [
    workspace,
    membership,
  ] = await Promise.all([
    Workspace.findById(
      request.params.workspaceId,
    ),

    WorkspaceMember.findOne({
      workspaceId:
        request.params.workspaceId,

      userId: request.user.id,
    }),
  ]);

  if (
    !workspace ||
    !hasPermission(
      membership,
      WORKSPACE_PERMISSIONS.READ_WORKSPACE,
    )
  ) {
    return response.status(404).json({
      message:
        "Workspace not found",
    });
  }

  return response.status(200).json({
    workspace:
      await presentWorkspace(
        workspace,
        membership,
      ),
  });
}

export async function updateWorkspace(
  request,
  response,
) {
  const workspace =
    await Workspace.findById(
      request.params.workspaceId,
    );

  if (!workspace) {
    return response.status(404).json({
      message:
        "Workspace not found",
    });
  }

  const membership =
    await WorkspaceMember.findOne({
      workspaceId: workspace.id,
      userId: request.user.id,
    });

  if (
    !hasPermission(
      membership,
      WORKSPACE_PERMISSIONS.UPDATE_WORKSPACE,
    )
  ) {
    return response.status(403).json({
      message:
        "You cannot update this workspace",
    });
  }

  const {
    name,
  } = request.body ?? {};

  if (name === undefined) {
    return response.status(400).json({
      message:
        "Provide a workspace name to update",
    });
  }

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return response.status(400).json({
      message:
        "Workspace name cannot be empty",
    });
  }

  workspace.name = name.trim();

  await workspace.save();

  return response.status(200).json({
    workspace:
      await presentWorkspace(
        workspace,
        membership,
      ),
  });
}

export async function deleteWorkspace(
  request,
  response,
) {
  const workspace =
    await Workspace.findById(
      request.params.workspaceId,
    );

  if (!workspace) {
    return response.status(404).json({
      message:
        "Workspace not found",
    });
  }

  const membership =
    await WorkspaceMember.findOne({
      workspaceId: workspace.id,
      userId: request.user.id,
    });

  if (
    !hasPermission(
      membership,
      WORKSPACE_PERMISSIONS.DELETE_WORKSPACE,
    )
  ) {
    return response.status(403).json({
      message:
        "Only the workspace owner can delete this workspace",
    });
  }

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const projects =
          await Project.find({
            workspaceId: workspace.id,
          })
            .select("_id")
            .session(session);

        const projectIds =
          projects.map(
            (project) => project.id,
          );

        await Task.deleteMany(
          {
            projectId: {
              $in: projectIds,
            },
          },
          {
            session,
          },
        );

        await ProjectMember.deleteMany(
          {
            projectId: {
              $in: projectIds,
            },
          },
          {
            session,
          },
        );

        await ProjectInvitation.deleteMany(
          {
            workspaceId: workspace.id,
          },
          {
            session,
          },
        );

        await Project.deleteMany(
          {
            workspaceId: workspace.id,
          },
          {
            session,
          },
        );

        await WorkspaceMember.deleteMany(
          {
            workspaceId: workspace.id,
          },
          {
            session,
          },
        );

        await Workspace.deleteOne(
          {
            _id: workspace.id,
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