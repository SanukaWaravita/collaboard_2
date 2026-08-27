import mongoose from "mongoose";
import {
  INVITATION_STATUS,
  MEMBER_TYPES,
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  Project,
  ProjectInvitation,
  ProjectMember,
  User,
  Workspace,
  WorkspaceMember,
} from "../models/index.js";
import {
  hasDatabaseProjectPermission,
} from "../utils/databaseProjectAccess.js";
import {
  getDatabaseWorkspaceMembership,
  hasDatabaseWorkspacePermission,
} from "../utils/databaseWorkspaceAccess.js";

const allowedInvitationRoles =
  new Set([
    PROJECT_ROLES.CONTRIBUTOR,
    PROJECT_ROLES.REVIEWER,
  ]);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
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

async function presentInvitation(
  invitation,
) {
  const project = await Project.findById(
    invitation.projectId,
  );

  const workspace =
    await Workspace.findById(
      invitation.workspaceId,
    );

  const inviter = await User.findById(
    invitation.invitedById,
  );

  const plainInvitation =
    typeof invitation.toJSON ===
    "function"
      ? invitation.toJSON()
      : {
          ...invitation,
        };

  return {
    ...plainInvitation,

    project: project
      ? {
          id: project.id,
          projectKey:
            project.projectKey,
          name: project.name,
          visibility:
            project.visibility,
        }
      : null,

    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        }
      : null,

    invitedBy: inviter
      ? {
          id: inviter.id,
          name: inviter.name,
          email: inviter.email,
        }
      : null,
  };
}

export async function inviteProjectMember(
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
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    ))
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can invite members",
    });
  }

  const workspace =
    await Workspace.findById(
      project.workspaceId,
    );

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  const {
    email,
    role = PROJECT_ROLES.REVIEWER,
    memberType =
      MEMBER_TYPES.INTERNAL,
  } = request.body ?? {};

  const normalizedEmail =
    String(email ?? "")
      .trim()
      .toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return response.status(400).json({
      message:
        "A valid email address is required",
    });
  }

  if (
    normalizedEmail ===
    request.user.email
  ) {
    return response.status(400).json({
      message:
        "You are already the project owner",
    });
  }

  if (
    !allowedInvitationRoles.has(role)
  ) {
    return response.status(400).json({
      message:
        "Role must be CONTRIBUTOR or REVIEWER",
    });
  }

  if (
    !Object.values(
      MEMBER_TYPES,
    ).includes(memberType)
  ) {
    return response.status(400).json({
      message:
        "Member type must be INTERNAL or GUEST",
    });
  }

  const invitedUser =
    await User.findOne({
      email: normalizedEmail,
    });

  const existingWorkspaceMembership =
    invitedUser
      ? await getDatabaseWorkspaceMembership(
          workspace.id,
          invitedUser.id,
        )
      : null;

  const existingProjectMembership =
    invitedUser
      ? await findProjectMembership(
          project.id,
          invitedUser.id,
        )
      : null;

  if (existingProjectMembership) {
    return response.status(409).json({
      message:
        "This user is already a project member",
    });
  }

  const requiresWorkspaceManagement =
    !existingWorkspaceMembership ||
    (
      existingWorkspaceMembership.role ===
        WORKSPACE_ROLES.GUEST &&
      memberType ===
        MEMBER_TYPES.INTERNAL
    );

  if (
    requiresWorkspaceManagement &&
    !(await hasDatabaseWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    ))
  ) {
    return response.status(403).json({
      message:
        "Workspace administration permission is required to invite this user",
    });
  }

  let effectiveMemberType =
    memberType;

  if (
    existingWorkspaceMembership &&
    existingWorkspaceMembership.role !==
      WORKSPACE_ROLES.GUEST
  ) {
    effectiveMemberType =
      MEMBER_TYPES.INTERNAL;
  }

  const existingInvitation =
    await ProjectInvitation.findOne({
      projectId: project.id,
      email: normalizedEmail,
      status:
        INVITATION_STATUS.PENDING,
    });

  if (existingInvitation) {
    return response.status(409).json({
      message:
        "A pending invitation already exists",
    });
  }

  const invitation =
    new ProjectInvitation({
      workspaceId: workspace.id,
      projectId: project.id,
      email: normalizedEmail,
      role,
      memberType:
        effectiveMemberType,
      status:
        INVITATION_STATUS.PENDING,
      invitedById:
        request.user.id,
      respondedAt: null,
    });

  try {
    await invitation.save();
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message:
          "A pending invitation already exists",
      });
    }

    throw error;
  }

  return response.status(201).json({
    invitation:
      await presentInvitation(
        invitation,
      ),
  });
}

export async function getProjectInvitations(
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
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    ))
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can view invitations",
    });
  }

  const invitationDocuments =
    await ProjectInvitation.find({
      projectId: project.id,
    }).sort({
      createdAt: -1,
    });

  const invitations =
    await Promise.all(
      invitationDocuments.map(
        presentInvitation,
      ),
    );

  return response.status(200).json({
    invitations,
  });
}

export async function cancelProjectInvitation(
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
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    ))
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can cancel invitations",
    });
  }

  const invitation =
    await ProjectInvitation.findOneAndUpdate(
      {
        _id:
          request.params.invitationId,
        projectId: project.id,
        status:
          INVITATION_STATUS.PENDING,
      },
      {
        $set: {
          status:
            INVITATION_STATUS.CANCELLED,
          respondedAt:
            new Date(),
        },
      },
      {
        new: true,
      },
    );

  if (!invitation) {
    return response.status(404).json({
      message:
        "Pending invitation not found",
    });
  }

  return response.status(200).json({
    invitation:
      await presentInvitation(
        invitation,
      ),
  });
}

export async function getMyInvitations(
  request,
  response,
) {
  const invitationDocuments =
    await ProjectInvitation.find({
      email: request.user.email,
      status:
        INVITATION_STATUS.PENDING,
    }).sort({
      createdAt: -1,
    });

  const invitations =
    await Promise.all(
      invitationDocuments.map(
        presentInvitation,
      ),
    );

  return response.status(200).json({
    invitations,
  });
}

export async function acceptInvitation(
  request,
  response,
) {
  const invitation =
    await ProjectInvitation.findOne({
      _id:
        request.params.invitationId,
      status:
        INVITATION_STATUS.PENDING,
      email: request.user.email,
    });

  if (!invitation) {
    return response.status(404).json({
      message:
        "Invitation not found",
    });
  }

  const project = await Project.findById(
    invitation.projectId,
  );

  const workspace =
    await Workspace.findById(
      invitation.workspaceId,
    );

  if (!project || !workspace) {
    return response.status(404).json({
      message:
        "The invited project or workspace no longer exists",
    });
  }

  const existingProjectMembership =
    await findProjectMembership(
      project.id,
      request.user.id,
    );

  if (existingProjectMembership) {
    return response.status(409).json({
      message:
        "You are already a member of this project",
    });
  }

  const session =
    await mongoose.startSession();

  let workspaceMembership;
  let projectMembership;
  let transactionError = null;

  try {
    await session.withTransaction(
      async () => {
        const currentInvitation =
          await ProjectInvitation.findOne({
            _id: invitation.id,
            status:
              INVITATION_STATUS.PENDING,
            email:
              request.user.email,
          }).session(session);

        if (!currentInvitation) {
          const error = new Error(
            "Invitation is no longer available",
          );

          error.code =
            "INVITATION_UNAVAILABLE";

          throw error;
        }

        const currentProjectMembership =
          await ProjectMember.findOne({
            projectId:
              project.id,
            userId:
              request.user.id,
          }).session(session);

        if (currentProjectMembership) {
          const error = new Error(
            "User is already a project member",
          );

          error.code =
            "ALREADY_PROJECT_MEMBER";

          throw error;
        }

        workspaceMembership =
          await WorkspaceMember.findOne({
            workspaceId:
              workspace.id,
            userId:
              request.user.id,
          }).session(session);

        if (!workspaceMembership) {
          [workspaceMembership] =
            await WorkspaceMember.create(
              [
                {
                  workspaceId:
                    workspace.id,
                  userId:
                    request.user.id,

                  role:
                    currentInvitation.memberType ===
                    MEMBER_TYPES.GUEST
                      ? WORKSPACE_ROLES.GUEST
                      : WORKSPACE_ROLES.MEMBER,

                  joinedAt:
                    new Date(),
                },
              ],
              {
                session,
              },
            );
        } else if (
          workspaceMembership.role ===
            WORKSPACE_ROLES.GUEST &&
          currentInvitation.memberType ===
            MEMBER_TYPES.INTERNAL
        ) {
          workspaceMembership.role =
            WORKSPACE_ROLES.MEMBER;

          await workspaceMembership.save({
            session,
          });
        }

        [projectMembership] =
          await ProjectMember.create(
            [
              {
                projectId:
                  project.id,
                userId:
                  request.user.id,
                role:
                  currentInvitation.role,
                joinedAt:
                  new Date(),
              },
            ],
            {
              session,
            },
          );

        currentInvitation.status =
          INVITATION_STATUS.ACCEPTED;

        currentInvitation.respondedAt =
          new Date();

        await currentInvitation.save({
          session,
        });
      },
    );
  } catch (error) {
    transactionError = error;
  } finally {
    await session.endSession();
  }

  if (transactionError) {
    if (
      transactionError.code ===
      "INVITATION_UNAVAILABLE"
    ) {
      return response.status(404).json({
        message:
          "Invitation not found",
      });
    }

    if (
      transactionError.code ===
        "ALREADY_PROJECT_MEMBER" ||
      transactionError.code === 11000
    ) {
      return response.status(409).json({
        message:
          "You are already a member of this project",
      });
    }

    throw transactionError;
  }

  return response.status(200).json({
    projectMembership:
      projectMembership.toJSON(),

    workspaceMembership:
      workspaceMembership.toJSON(),
  });
}

export async function declineInvitation(
  request,
  response,
) {
  const invitation =
    await ProjectInvitation.findOneAndUpdate(
      {
        _id:
          request.params.invitationId,
        status:
          INVITATION_STATUS.PENDING,
        email: request.user.email,
      },
      {
        $set: {
          status:
            INVITATION_STATUS.DECLINED,
          respondedAt:
            new Date(),
        },
      },
      {
        new: true,
      },
    );

  if (!invitation) {
    return response.status(404).json({
      message:
        "Invitation not found",
    });
  }

  return response.status(200).json({
    invitation:
      await presentInvitation(
        invitation,
      ),
  });
}

export async function inviteWorkspaceProjectMembers(
  request,
  response,
) {
  const workspace =
    await Workspace.findById(
      request.params.workspaceId,
    );

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !(await hasDatabaseWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    ))
  ) {
    return response.status(403).json({
      message:
        "Workspace member management permission is required",
    });
  }

  const {
    email,
    memberType =
      MEMBER_TYPES.INTERNAL,
    projects = [],
  } = request.body ?? {};

  const normalizedEmail =
    String(email ?? "")
      .trim()
      .toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return response.status(400).json({
      message:
        "A valid email address is required",
    });
  }

  if (
    normalizedEmail ===
    request.user.email
  ) {
    return response.status(400).json({
      message:
        "You cannot invite yourself",
    });
  }

  if (
    !Object.values(
      MEMBER_TYPES,
    ).includes(memberType)
  ) {
    return response.status(400).json({
      message:
        "Member type must be INTERNAL or GUEST",
    });
  }

  if (
    !Array.isArray(projects) ||
    projects.length === 0
  ) {
    return response.status(400).json({
      message:
        "At least one Project must be selected",
    });
  }

  const normalizedSelections =
    projects.map((selection) => ({
      projectId:
        String(
          selection?.projectId ??
            "",
        ).trim(),

      role:
        String(
          selection?.role ??
            PROJECT_ROLES.REVIEWER,
        ).trim(),
    }));

  const selectedProjectIds =
    new Set();

  for (
    const selection of
    normalizedSelections
  ) {
    if (!selection.projectId) {
      return response.status(400).json({
        message:
          "Every Project selection requires a projectId",
      });
    }

    if (
      !allowedInvitationRoles.has(
        selection.role,
      )
    ) {
      return response.status(400).json({
        message:
          "Every Project role must be CONTRIBUTOR or REVIEWER",
      });
    }

    if (
      selectedProjectIds.has(
        selection.projectId,
      )
    ) {
      return response.status(400).json({
        message:
          "A Project cannot be selected more than once",
      });
    }

    selectedProjectIds.add(
      selection.projectId,
    );
  }

  const projectDocuments =
    await Project.find({
      _id: {
        $in: [
          ...selectedProjectIds,
        ],
      },
      workspaceId: workspace.id,
    });

  const projectsById = new Map(
    projectDocuments.map(
      (project) => [
        project.id,
        project,
      ],
    ),
  );

  const selectedProjects =
    normalizedSelections.map(
      (selection) => ({
        ...selection,
        project:
          projectsById.get(
            selection.projectId,
          ) ?? null,
      }),
    );

  if (
    selectedProjects.some(
      (selection) =>
        !selection.project,
    )
  ) {
    return response.status(400).json({
      message:
        "Every selected Project must belong to this Workspace",
    });
  }

  const invitedUser =
    await User.findOne({
      email: normalizedEmail,
    });

  const existingWorkspaceMembership =
    invitedUser
      ? await getDatabaseWorkspaceMembership(
          workspace.id,
          invitedUser.id,
        )
      : null;

  let effectiveMemberType =
    memberType;

  if (
    existingWorkspaceMembership &&
    existingWorkspaceMembership.role !==
      WORKSPACE_ROLES.GUEST
  ) {
    effectiveMemberType =
      MEMBER_TYPES.INTERNAL;
  }

  const invitationDefinitions = [];
  const skippedProjects = [];

  for (
    const selection of
    selectedProjects
  ) {
    const {
      project,
      role,
    } = selection;

    const existingProjectMembership =
      invitedUser
        ? await findProjectMembership(
            project.id,
            invitedUser.id,
          )
        : null;

    if (existingProjectMembership) {
      skippedProjects.push({
        projectId: project.id,
        projectKey:
          project.projectKey,
        projectName:
          project.name,
        reason: "ALREADY_MEMBER",
        message:
          "The user is already a member of this Project",
      });

      continue;
    }

    const existingInvitation =
      await ProjectInvitation.findOne({
        projectId: project.id,
        email: normalizedEmail,
        status:
          INVITATION_STATUS.PENDING,
      });

    if (existingInvitation) {
      skippedProjects.push({
        projectId: project.id,
        projectKey:
          project.projectKey,
        projectName:
          project.name,
        reason:
          "PENDING_INVITATION_EXISTS",
        message:
          "A pending invitation already exists",
      });

      continue;
    }

    invitationDefinitions.push({
      workspaceId: workspace.id,
      projectId: project.id,
      email: normalizedEmail,
      role,
      memberType:
        effectiveMemberType,
      status:
        INVITATION_STATUS.PENDING,
      invitedById:
        request.user.id,
      respondedAt: null,
    });
  }

  if (
    invitationDefinitions.length === 0
  ) {
    return response.status(409).json({
      message:
        "No invitations were created because every selected Project was skipped",
      invitations: [],
      skippedProjects,
    });
  }

  const session =
    await mongoose.startSession();

  let createdInvitations;

  try {
    await session.withTransaction(
      async () => {
        createdInvitations =
          await ProjectInvitation.create(
            invitationDefinitions,
            {
              session,
            },
          );
      },
    );
  } finally {
    await session.endSession();
  }

  const invitations =
    await Promise.all(
      createdInvitations.map(
        presentInvitation,
      ),
    );

  return response.status(201).json({
    message:
      `${createdInvitations.length} ` +
      `${
        createdInvitations.length === 1
          ? "invitation"
          : "invitations"
      } created`,

    invitations,
    skippedProjects,
  });
}

export async function cancelWorkspaceInvitation(
  request,
  response,
) {
  const workspace =
    await Workspace.findById(
      request.params.workspaceId,
    );

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !(await hasDatabaseWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    ))
  ) {
    return response.status(403).json({
      message:
        "Workspace member management permission is required",
    });
  }

  const invitation =
    await ProjectInvitation.findOneAndUpdate(
      {
        _id:
          request.params.invitationId,
        workspaceId: workspace.id,
        status:
          INVITATION_STATUS.PENDING,
      },
      {
        $set: {
          status:
            INVITATION_STATUS.CANCELLED,
          respondedAt:
            new Date(),
        },
      },
      {
        new: true,
      },
    );

  if (!invitation) {
    return response.status(404).json({
      message:
        "Pending Workspace invitation not found",
    });
  }

  return response.status(200).json({
    invitation:
      await presentInvitation(
        invitation,
      ),
  });
}