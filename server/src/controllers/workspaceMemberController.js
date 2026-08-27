import mongoose from "mongoose";
import {
  INVITATION_STATUS,
  MEMBER_TYPES,
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
  getDatabaseProjectAccess,
} from "../utils/databaseProjectAccess.js";
import {
  removeDatabaseUserFromTaskAssignments,
} from "../utils/databaseTaskAssignee.js";
import {
  getDatabaseWorkspaceAccess,
  getDatabaseWorkspaceMembership,
  hasDatabaseWorkspacePermission,
} from "../utils/databaseWorkspaceAccess.js";

const workspaceRoleOrder = new Map([
  [WORKSPACE_ROLES.OWNER, 0],
  [WORKSPACE_ROLES.ADMIN, 1],
  [WORKSPACE_ROLES.MEMBER, 2],
  [WORKSPACE_ROLES.GUEST, 3],
]);

const editableWorkspaceRoles = new Set([
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.MEMBER,
  WORKSPACE_ROLES.GUEST,
]);

const editableProjectRoles = new Set([
  PROJECT_ROLES.CONTRIBUTOR,
  PROJECT_ROLES.REVIEWER,
]);

async function findWorkspace(
  workspaceId,
) {
  return Workspace.findById(
    workspaceId,
  );
}

async function findWorkspaceProject(
  workspaceId,
  projectId,
) {
  return Project.findOne({
    _id: projectId,
    workspaceId,
  });
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

function presentProjectSummary(project) {
  return {
    projectId: project.id,
    projectKey: project.projectKey,
    name: project.name,
  };
}

async function presentPendingWorkspaceInvitation(
  invitation,
) {
  const project = await Project.findOne({
    _id: invitation.projectId,
    workspaceId:
      invitation.workspaceId,
  });

  const invitedBy = await User.findById(
    invitation.invitedById,
  );

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    memberType:
      invitation.memberType,
    status: invitation.status,
    createdAt:
      invitation.createdAt,

    project: project
      ? {
          projectId: project.id,
          projectKey:
            project.projectKey,
          name: project.name,
          visibility:
            project.visibility,
        }
      : null,

    invitedBy: invitedBy
      ? {
          userId: invitedBy.id,
          name: invitedBy.name,
          email: invitedBy.email,
        }
      : null,
  };
}

async function presentProjectAccess(
  project,
  userId,
) {
  const access =
    await getDatabaseProjectAccess(
      project,
      userId,
    );

  const isProjectMember =
    access?.isMember ?? false;

  return {
    projectId: project.id,
    projectKey: project.projectKey,
    name: project.name,
    visibility: project.visibility,

    hasAccess: Boolean(access),

    accessSource: access
      ? (
          isProjectMember
            ? "EXPLICIT"
            : "INHERITED"
        )
      : null,

    projectRole:
      access?.role ?? null,

    permissions:
      access?.permissions ?? [],

    isProjectMember,

    isProjectOwner:
      project.ownerId === userId,
  };
}

async function getInheritedProjects(
  projects,
  userId,
) {
  const inheritedProjects = [];

  for (const project of projects) {
    const access =
      await getDatabaseProjectAccess(
        project,
        userId,
      );

    if (
      access &&
      access.isMember === false
    ) {
      inheritedProjects.push(project);
    }
  }

  return inheritedProjects;
}

async function presentWorkspaceMember(
  membership,
  workspace,
  projects,
) {
  const user = await User.findById(
    membership.userId,
  );

  const workspaceAccess =
    await getDatabaseWorkspaceAccess(
      workspace,
      membership.userId,
    );

  const projectAccess =
    await Promise.all(
      projects.map((project) =>
        presentProjectAccess(
          project,
          membership.userId,
        ),
      ),
    );

  const accessibleProjectCount =
    projectAccess.filter(
      (access) => access.hasAccess,
    ).length;

  const explicitProjectCount =
    projectAccess.filter(
      (access) =>
        access.accessSource ===
        "EXPLICIT",
    ).length;

  const inheritedProjectCount =
    projectAccess.filter(
      (access) =>
        access.accessSource ===
        "INHERITED",
    ).length;

  const isWorkspaceOwner =
    workspace.ownerId ===
      membership.userId ||
    membership.role ===
      WORKSPACE_ROLES.OWNER;

  return {
    userId: membership.userId,
    name:
      user?.name ??
      "Unknown user",
    email:
      user?.email ??
      null,

    workspaceRole:
      membership.role,

    memberType:
      membership.role ===
      WORKSPACE_ROLES.GUEST
        ? MEMBER_TYPES.GUEST
        : MEMBER_TYPES.INTERNAL,

    workspacePermissions:
      workspaceAccess?.permissions ??
      [],

    isWorkspaceOwner,

    canChangeWorkspaceRole:
      !isWorkspaceOwner,

    canRemoveFromWorkspace:
      !isWorkspaceOwner,

    joinedAt:
      membership.joinedAt ??
      membership.createdAt ??
      null,

    projectAccess,

    accessSummary: {
      totalProjects:
        projects.length,
      accessibleProjectCount,
      explicitProjectCount,
      inheritedProjectCount,
    },
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

  const projectMemberships =
    await ProjectMember.find({
      userId,
    })
      .session(session)
      .select("projectId");

  const projectIds =
    projectMemberships.map(
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
      _id:
        workspaceMembership.id,
    },
    {
      session,
    },
  );

  return true;
}

export async function getWorkspaceMembers(
  request,
  response,
) {
  const workspace =
    await findWorkspace(
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
        "You cannot manage members in this workspace",
    });
  }

  const projects = await Project.find({
    workspaceId: workspace.id,
  });

  const memberships =
    await WorkspaceMember.find({
      workspaceId: workspace.id,
    });

  const members = await Promise.all(
    memberships.map(
      (membership) =>
        presentWorkspaceMember(
          membership,
          workspace,
          projects,
        ),
    ),
  );

  members.sort(
    (
      firstMember,
      secondMember,
    ) => {
      const firstRolePosition =
        workspaceRoleOrder.get(
          firstMember.workspaceRole,
        ) ?? 99;

      const secondRolePosition =
        workspaceRoleOrder.get(
          secondMember.workspaceRole,
        ) ?? 99;

      if (
        firstRolePosition !==
        secondRolePosition
      ) {
        return (
          firstRolePosition -
          secondRolePosition
        );
      }

      return firstMember.name.localeCompare(
        secondMember.name,
      );
    },
  );

  const invitations =
    await ProjectInvitation.find({
      workspaceId: workspace.id,
      status:
        INVITATION_STATUS.PENDING,
    }).sort({
      createdAt: -1,
    });

  const pendingInvitations =
    await Promise.all(
      invitations.map(
        presentPendingWorkspaceInvitation,
      ),
    );

  return response.status(200).json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
    },

    members,

    projects: projects.map(
      (project) => ({
        id: project.id,
        projectKey:
          project.projectKey,
        name: project.name,
        visibility:
          project.visibility,
      }),
    ),

    pendingInvitations,
    currentUserId: request.user.id,
    canManageMembers: true,
  });
}

export async function updateWorkspaceMemberRole(
  request,
  response,
) {
  const workspace =
    await findWorkspace(
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
        "You cannot manage members in this workspace",
    });
  }

  const {
    role,
  } = request.body ?? {};

  if (
    !editableWorkspaceRoles.has(role)
  ) {
    return response.status(400).json({
      message:
        "Workspace role must be ADMIN, MEMBER, or GUEST",
    });
  }

  const membership =
    await getDatabaseWorkspaceMembership(
      workspace.id,
      request.params.userId,
    );

  if (!membership) {
    return response.status(404).json({
      message:
        "Workspace member not found",
    });
  }

  const isWorkspaceOwner =
    workspace.ownerId ===
      membership.userId ||
    membership.role ===
      WORKSPACE_ROLES.OWNER;

  if (isWorkspaceOwner) {
    return response.status(409).json({
      message:
        "Transfer Workspace ownership before changing the owner's role",
    });
  }

  if (
    membership.userId ===
    request.user.id
  ) {
    return response.status(409).json({
      message:
        "You cannot change your own Workspace role",
    });
  }

  const requesterIsWorkspaceOwner =
    workspace.ownerId ===
    request.user.id;

  if (
    !requesterIsWorkspaceOwner &&
    (
      membership.role ===
        WORKSPACE_ROLES.ADMIN ||
      role === WORKSPACE_ROLES.ADMIN
    )
  ) {
    return response.status(403).json({
      message:
        "Only the Workspace owner can manage Admin roles",
    });
  }

  const projects = await Project.find({
    workspaceId: workspace.id,
  });

  const ownedProjects =
    projects.filter(
      (project) =>
        project.ownerId ===
        membership.userId,
    );

  if (
    role === WORKSPACE_ROLES.GUEST &&
    ownedProjects.length > 0
  ) {
    return response.status(409).json({
      message:
        "Transfer Project ownership before converting this member into a guest",

      ownedProjects:
        ownedProjects.map(
          presentProjectSummary,
        ),
    });
  }

  const inheritedProjectsBefore =
    await getInheritedProjects(
      projects,
      membership.userId,
    );

  const previousRole =
    membership.role;

  const session =
    await mongoose.startSession();

  let updatedMembership;

  try {
    await session.withTransaction(
      async () => {
        updatedMembership =
          await WorkspaceMember.findById(
            membership.id,
          ).session(session);

        updatedMembership.role = role;

        await updatedMembership.save({
          session,
        });

        await Workspace.updateOne(
          {
            _id: workspace.id,
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

  const inheritedProjectsAfter =
    await getInheritedProjects(
      projects,
      membership.userId,
    );

  const previousInheritedIds =
    new Set(
      inheritedProjectsBefore.map(
        (project) => project.id,
      ),
    );

  const currentInheritedIds =
    new Set(
      inheritedProjectsAfter.map(
        (project) => project.id,
      ),
    );

  const gainedInheritedAccess =
    inheritedProjectsAfter
      .filter(
        (project) =>
          !previousInheritedIds.has(
            project.id,
          ),
      )
      .map(presentProjectSummary);

  const lostInheritedAccess =
    inheritedProjectsBefore
      .filter(
        (project) =>
          !currentInheritedIds.has(
            project.id,
          ),
      )
      .map(presentProjectSummary);

  return response.status(200).json({
    member:
      await presentWorkspaceMember(
        updatedMembership,
        workspace,
        projects,
      ),

    previousRole,

    accessChanges: {
      gainedInheritedAccess,
      lostInheritedAccess,
    },
  });
}

export async function setWorkspaceMemberProjectAccess(
  request,
  response,
) {
  const workspace =
    await findWorkspace(
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
        "You cannot manage members in this workspace",
    });
  }

  const workspaceMembership =
    await getDatabaseWorkspaceMembership(
      workspace.id,
      request.params.userId,
    );

  if (!workspaceMembership) {
    return response.status(404).json({
      message:
        "Workspace member not found",
    });
  }

  const project =
    await findWorkspaceProject(
      workspace.id,
      request.params.projectId,
    );

  if (!project) {
    return response.status(404).json({
      message:
        "Project not found in this workspace",
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

  const existingMembership =
    await findProjectMembership(
      project.id,
      workspaceMembership.userId,
    );

  const isProjectOwner =
    project.ownerId ===
      workspaceMembership.userId ||
    existingMembership?.role ===
      PROJECT_ROLES.OWNER;

  if (isProjectOwner) {
    return response.status(409).json({
      message:
        "Transfer Project ownership before changing the owner's access",
    });
  }

  const previousRole =
    existingMembership?.role ??
    null;

  const session =
    await mongoose.startSession();

  let projectMembership;
  let action;
  let responseStatus;
  let unassignedTaskCount = 0;

  try {
    await session.withTransaction(
      async () => {
        if (existingMembership) {
          projectMembership =
            await ProjectMember.findById(
              existingMembership.id,
            ).session(session);

          projectMembership.role = role;

          await projectMembership.save({
            session,
          });

          action = "UPDATED";
          responseStatus = 200;

          if (
            previousRole ===
              PROJECT_ROLES.CONTRIBUTOR &&
            role ===
              PROJECT_ROLES.REVIEWER
          ) {
            unassignedTaskCount =
              await removeDatabaseUserFromTaskAssignments(
                project.id,
                workspaceMembership.userId,
                {
                  session,
                },
              );
          }
        } else {
          [projectMembership] =
            await ProjectMember.create(
              [
                {
                  projectId:
                    project.id,
                  userId:
                    workspaceMembership.userId,
                  role,
                  joinedAt:
                    new Date(),
                },
              ],
              {
                session,
              },
            );

          action = "GRANTED";
          responseStatus = 201;
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

  return response
    .status(responseStatus)
    .json({
      action,
      previousRole,

      projectAccess:
        await presentProjectAccess(
          project,
          workspaceMembership.userId,
        ),

      unassignedTaskCount,
    });
}

export async function removeWorkspaceMemberProjectAccess(
  request,
  response,
) {
  const workspace =
    await findWorkspace(
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
        "You cannot manage members in this workspace",
    });
  }

  const workspaceMembership =
    await getDatabaseWorkspaceMembership(
      workspace.id,
      request.params.userId,
    );

  if (!workspaceMembership) {
    return response.status(404).json({
      message:
        "Workspace member not found",
    });
  }

  const project =
    await findWorkspaceProject(
      workspace.id,
      request.params.projectId,
    );

  if (!project) {
    return response.status(404).json({
      message:
        "Project not found in this workspace",
    });
  }

  const projectMembership =
    await findProjectMembership(
      project.id,
      workspaceMembership.userId,
    );

  if (!projectMembership) {
    const currentAccess =
      await getDatabaseProjectAccess(
        project,
        workspaceMembership.userId,
      );

    if (
      currentAccess &&
      currentAccess.isMember === false
    ) {
      return response.status(409).json({
        message:
          "This access is inherited from the open Project and cannot be removed individually",
      });
    }

    return response.status(404).json({
      message:
        "Explicit Project membership not found",
    });
  }

  if (
    project.ownerId ===
      workspaceMembership.userId ||
    projectMembership.role ===
      PROJECT_ROLES.OWNER
  ) {
    return response.status(409).json({
      message:
        "Transfer Project ownership before removing the owner's access",
    });
  }

  const session =
    await mongoose.startSession();

  let unassignedTaskCount = 0;
  let workspaceMembershipRemoved = false;

  try {
    await session.withTransaction(
      async () => {
        await ProjectMember.deleteOne(
          {
            _id:
              projectMembership.id,
          },
          {
            session,
          },
        );

        unassignedTaskCount =
          await removeDatabaseUserFromTaskAssignments(
            project.id,
            workspaceMembership.userId,
            {
              session,
            },
          );

        workspaceMembershipRemoved =
          await removeUnusedGuestWorkspaceMembership(
            workspace.id,
            workspaceMembership.userId,
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
      "Explicit Project access removed",

    removedRole:
      projectMembership.role,

    unassignedTaskCount,
    workspaceMembershipRemoved,

    remainingProjectAccess:
      await presentProjectAccess(
        project,
        workspaceMembership.userId,
      ),
  });
}

export async function removeWorkspaceMember(
  request,
  response,
) {
  const workspace =
    await findWorkspace(
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
        "You cannot manage members in this workspace",
    });
  }

  const membership =
    await getDatabaseWorkspaceMembership(
      workspace.id,
      request.params.userId,
    );

  if (!membership) {
    return response.status(404).json({
      message:
        "Workspace member not found",
    });
  }

  const isWorkspaceOwner =
    workspace.ownerId ===
      membership.userId ||
    membership.role ===
      WORKSPACE_ROLES.OWNER;

  if (isWorkspaceOwner) {
    return response.status(409).json({
      message:
        "Transfer Workspace ownership before removing the owner",
    });
  }

  if (
    membership.userId ===
    request.user.id
  ) {
    return response.status(409).json({
      message:
        "You cannot remove yourself from the Workspace through member management",
    });
  }

  const requesterIsWorkspaceOwner =
    workspace.ownerId ===
    request.user.id;

  if (
    membership.role ===
      WORKSPACE_ROLES.ADMIN &&
    !requesterIsWorkspaceOwner
  ) {
    return response.status(403).json({
      message:
        "Only the Workspace owner can remove an Admin",
    });
  }

  const projects = await Project.find({
    workspaceId: workspace.id,
  });

  const projectIds =
    projects.map(
      (project) => project.id,
    );

  const ownerMemberships =
    await ProjectMember.find({
      projectId: {
        $in: projectIds,
      },
      userId: membership.userId,
      role: PROJECT_ROLES.OWNER,
    });

  const ownerMembershipProjectIds =
    new Set(
      ownerMemberships.map(
        (projectMembership) =>
          projectMembership.projectId,
      ),
    );

  const ownedProjects =
    projects.filter(
      (project) =>
        project.ownerId ===
          membership.userId ||
        ownerMembershipProjectIds.has(
          project.id,
        ),
    );

  if (ownedProjects.length > 0) {
    return response.status(409).json({
      message:
        "Transfer Project ownership before removing this Workspace member",

      ownedProjects:
        ownedProjects.map(
          presentProjectSummary,
        ),
    });
  }

  const user = await User.findById(
    membership.userId,
  );

  const projectMemberships =
    await ProjectMember.find({
      projectId: {
        $in: projectIds,
      },
      userId: membership.userId,
    });

  const session =
    await mongoose.startSession();

  const removedProjectMemberships = [];
  let totalUnassignedTaskCount = 0;
  let cancelledInvitationCount = 0;

  try {
    await session.withTransaction(
      async () => {
        for (
          const projectMembership of
          projectMemberships
        ) {
          const project =
            projects.find(
              (currentProject) =>
                currentProject.id ===
                projectMembership.projectId,
            );

          const unassignedTaskCount =
            await removeDatabaseUserFromTaskAssignments(
              projectMembership.projectId,
              membership.userId,
              {
                session,
              },
            );

          totalUnassignedTaskCount +=
            unassignedTaskCount;

          removedProjectMemberships.push({
            projectId:
              projectMembership.projectId,

            projectKey:
              project?.projectKey ??
              null,

            name:
              project?.name ??
              "Unknown Project",

            removedRole:
              projectMembership.role,

            unassignedTaskCount,
          });
        }

        await ProjectMember.deleteMany(
          {
            projectId: {
              $in: projectIds,
            },
            userId: membership.userId,
          },
          {
            session,
          },
        );

        if (user?.email) {
          const invitationResult =
            await ProjectInvitation.updateMany(
              {
                workspaceId:
                  workspace.id,
                email: user.email,
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
                session,
              },
            );

          cancelledInvitationCount =
            invitationResult.modifiedCount;
        }

        await WorkspaceMember.deleteOne(
          {
            _id: membership.id,
          },
          {
            session,
          },
        );

        await Project.updateMany(
          {
            workspaceId:
              workspace.id,
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

        await Workspace.updateOne(
          {
            _id: workspace.id,
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
      "Workspace member removed",

    removedMember: {
      userId: membership.userId,
      name:
        user?.name ??
        "Unknown user",
      email:
        user?.email ??
        null,
      workspaceRole:
        membership.role,
    },

    removedProjectMemberships,
    totalUnassignedTaskCount,
    cancelledInvitationCount,
  });
}