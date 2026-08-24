import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";
import {
  INVITATION_STATUS,
  MEMBER_TYPES,
  PROJECT_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import { getProjectAccess } from "../utils/projectAccess.js";
import {
  getWorkspaceAccess,
  hasWorkspacePermission,
} from "../utils/workspaceAccess.js";
import { removeUserFromTaskAssignments } from "../utils/taskAssignee.js";

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

function findWorkspace(workspaceId) {
  return store.workspaces.find((workspace) => workspace.id === workspaceId);
}

function findWorkspaceMembership(workspaceId, userId) {
  return store.workspaceMembers.find(
    (membership) =>
      membership.workspaceId === workspaceId && membership.userId === userId,
  );
}

function findWorkspaceProject(workspaceId, projectId) {
  return store.projects.find(
    (project) =>
      project.id === projectId && project.workspaceId === workspaceId,
  );
}

function findProjectMembership(projectId, userId) {
  return store.projectMembers.find(
    (membership) =>
      membership.projectId === projectId && membership.userId === userId,
  );
}

function removeUnusedGuestWorkspaceMembership(workspaceId, userId) {
  const workspaceMembershipIndex = store.workspaceMembers.findIndex(
    (membership) =>
      membership.workspaceId === workspaceId &&
      membership.userId === userId &&
      membership.role === WORKSPACE_ROLES.GUEST,
  );

  if (workspaceMembershipIndex === -1) {
    return false;
  }

  const hasAnotherProjectMembership = store.projectMembers.some(
    (membership) => {
      if (membership.userId !== userId) {
        return false;
      }

      const project = store.projects.find(
        (currentProject) =>
          currentProject.id === membership.projectId &&
          currentProject.workspaceId === workspaceId,
      );

      return Boolean(project);
    },
  );

  if (hasAnotherProjectMembership) {
    return false;
  }

  store.workspaceMembers.splice(workspaceMembershipIndex, 1);

  return true;
}

function presentProjectSummary(project) {
  return {
    projectId: project.id,
    projectKey: project.projectKey,
    name: project.name,
  };
}

function presentPendingWorkspaceInvitation(
  invitation,
) {
  const project = store.projects.find(
    (currentProject) =>
      currentProject.id ===
        invitation.projectId &&
      currentProject.workspaceId ===
        invitation.workspaceId,
  );

  const invitedBy = store.users.find(
    (user) =>
      user.id === invitation.invitedById,
  );

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    memberType: invitation.memberType,
    status: invitation.status,
    createdAt: invitation.createdAt,

    project: project
      ? {
          projectId: project.id,
          projectKey: project.projectKey,
          name: project.name,
          visibility: project.visibility,
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

function getInheritedProjects(projects, userId) {
  return projects.filter((project) => {
    const access = getProjectAccess(project, userId);

    return access && access.isMember === false;
  });
}

function presentProjectAccess(project, userId) {
  const access = getProjectAccess(project, userId);

  const isProjectMember = access?.isMember ?? false;

  return {
    projectId: project.id,
    projectKey: project.projectKey,
    name: project.name,
    visibility: project.visibility,

    hasAccess: Boolean(access),

    accessSource: access ? (isProjectMember ? "EXPLICIT" : "INHERITED") : null,

    projectRole: access?.role ?? null,
    permissions: access?.permissions ?? [],
    isProjectMember,
    isProjectOwner: project.ownerId === userId,
  };
}

function presentWorkspaceMember(membership, workspace, projects) {
  const user = store.users.find(
    (currentUser) => currentUser.id === membership.userId,
  );

  const workspaceAccess = getWorkspaceAccess(workspace, membership.userId);

  const projectAccess = projects.map((project) =>
    presentProjectAccess(project, membership.userId),
  );

  const accessibleProjectCount = projectAccess.filter(
    (access) => access.hasAccess,
  ).length;

  const explicitProjectCount = projectAccess.filter(
    (access) => access.accessSource === "EXPLICIT",
  ).length;

  const inheritedProjectCount = projectAccess.filter(
    (access) => access.accessSource === "INHERITED",
  ).length;

  const isWorkspaceOwner =
    workspace.ownerId === membership.userId ||
    membership.role === WORKSPACE_ROLES.OWNER;

  return {
    userId: membership.userId,
    name: user?.name ?? "Unknown user",
    email: user?.email ?? null,

    workspaceRole: membership.role,

    memberType:
      membership.role === WORKSPACE_ROLES.GUEST
        ? MEMBER_TYPES.GUEST
        : MEMBER_TYPES.INTERNAL,

    workspacePermissions: workspaceAccess?.permissions ?? [],

    isWorkspaceOwner,
    canChangeWorkspaceRole: !isWorkspaceOwner,
    canRemoveFromWorkspace: !isWorkspaceOwner,

    joinedAt: membership.joinedAt ?? membership.createdAt ?? null,

    projectAccess,

    accessSummary: {
      totalProjects: projects.length,
      accessibleProjectCount,
      explicitProjectCount,
      inheritedProjectCount,
    },
  };
}

export function getWorkspaceMembers(request, response) {
  const workspace = findWorkspace(request.params.workspaceId);

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message: "You cannot manage members in this workspace",
    });
  }

  const projects = store.projects.filter(
    (project) => project.workspaceId === workspace.id,
  );

  const members = store.workspaceMembers
    .filter((membership) => membership.workspaceId === workspace.id)
    .map((membership) =>
      presentWorkspaceMember(membership, workspace, projects),
    )
    .sort((firstMember, secondMember) => {
      const firstRolePosition =
        workspaceRoleOrder.get(firstMember.workspaceRole) ?? 99;

      const secondRolePosition =
        workspaceRoleOrder.get(secondMember.workspaceRole) ?? 99;

      if (firstRolePosition !== secondRolePosition) {
        return firstRolePosition - secondRolePosition;
      }

      return firstMember.name.localeCompare(secondMember.name);
    });

  const pendingInvitations =
  store.projectInvitations
    .filter(
      (invitation) =>
        invitation.workspaceId ===
          workspace.id &&
        invitation.status ===
          INVITATION_STATUS.PENDING,
    )
    .map(
      presentPendingWorkspaceInvitation,
    )
    .sort(
      (firstInvitation, secondInvitation) =>
        new Date(
          secondInvitation.createdAt,
        ).getTime() -
        new Date(
          firstInvitation.createdAt,
        ).getTime(),
    );
    return response.status(200).json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
    },

    members,
    pendingInvitations,

    currentUserId: request.user.id,
    canManageMembers: true,
  });
}

export function updateWorkspaceMemberRole(request, response) {
  const workspace = findWorkspace(request.params.workspaceId);

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message: "You cannot manage members in this workspace",
    });
  }

  const { role } = request.body ?? {};

  if (!editableWorkspaceRoles.has(role)) {
    return response.status(400).json({
      message: "Workspace role must be ADMIN, MEMBER, or GUEST",
    });
  }

  const membership = findWorkspaceMembership(
    workspace.id,
    request.params.userId,
  );

  if (!membership) {
    return response.status(404).json({
      message: "Workspace member not found",
    });
  }

  const isWorkspaceOwner =
    workspace.ownerId === membership.userId ||
    membership.role === WORKSPACE_ROLES.OWNER;

  if (isWorkspaceOwner) {
    return response.status(409).json({
      message: "Transfer Workspace ownership before changing the owner's role",
    });
  }

  if (membership.userId === request.user.id) {
    return response.status(409).json({
      message: "You cannot change your own Workspace role",
    });
  }

  const requesterIsWorkspaceOwner = workspace.ownerId === request.user.id;

  if (
    !requesterIsWorkspaceOwner &&
    (membership.role === WORKSPACE_ROLES.ADMIN ||
      role === WORKSPACE_ROLES.ADMIN)
  ) {
    return response.status(403).json({
      message: "Only the Workspace owner can manage Admin roles",
    });
  }

  const projects = store.projects.filter(
    (project) => project.workspaceId === workspace.id,
  );

  const ownedProjects = projects.filter(
    (project) => project.ownerId === membership.userId,
  );

  if (role === WORKSPACE_ROLES.GUEST && ownedProjects.length > 0) {
    return response.status(409).json({
      message:
        "Transfer Project ownership before converting this member into a guest",

      ownedProjects: ownedProjects.map(presentProjectSummary),
    });
  }

  const inheritedProjectsBefore = getInheritedProjects(
    projects,
    membership.userId,
  );

  const previousRole = membership.role;
  const timestamp = new Date().toISOString();

  membership.role = role;
  membership.updatedAt = timestamp;
  workspace.updatedAt = timestamp;

  const inheritedProjectsAfter = getInheritedProjects(
    projects,
    membership.userId,
  );

  const previousInheritedIds = new Set(
    inheritedProjectsBefore.map((project) => project.id),
  );

  const currentInheritedIds = new Set(
    inheritedProjectsAfter.map((project) => project.id),
  );

  const gainedInheritedAccess = inheritedProjectsAfter
    .filter((project) => !previousInheritedIds.has(project.id))
    .map(presentProjectSummary);

  const lostInheritedAccess = inheritedProjectsBefore
    .filter((project) => !currentInheritedIds.has(project.id))
    .map(presentProjectSummary);

  return response.status(200).json({
    member: presentWorkspaceMember(membership, workspace, projects),

    previousRole,

    accessChanges: {
      gainedInheritedAccess,
      lostInheritedAccess,
    },
  });
}

export function setWorkspaceMemberProjectAccess(request, response) {
  const workspace = findWorkspace(request.params.workspaceId);

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message: "You cannot manage members in this workspace",
    });
  }

  const workspaceMembership = findWorkspaceMembership(
    workspace.id,
    request.params.userId,
  );

  if (!workspaceMembership) {
    return response.status(404).json({
      message: "Workspace member not found",
    });
  }

  const project = findWorkspaceProject(workspace.id, request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found in this workspace",
    });
  }

  const { role } = request.body ?? {};

  if (!editableProjectRoles.has(role)) {
    return response.status(400).json({
      message: "Project role must be CONTRIBUTOR or REVIEWER",
    });
  }

  let projectMembership = findProjectMembership(
    project.id,
    workspaceMembership.userId,
  );

  const isProjectOwner =
    project.ownerId === workspaceMembership.userId ||
    projectMembership?.role === PROJECT_ROLES.OWNER;

  if (isProjectOwner) {
    return response.status(409).json({
      message: "Transfer Project ownership before changing the owner's access",
    });
  }

  const timestamp = new Date().toISOString();
  const previousRole = projectMembership?.role ?? null;

  let action;
  let responseStatus;
  let unassignedTaskCount = 0;

  if (projectMembership) {
    projectMembership.role = role;
    projectMembership.updatedAt = timestamp;

    action = "UPDATED";
    responseStatus = 200;

    if (
      previousRole === PROJECT_ROLES.CONTRIBUTOR &&
      role === PROJECT_ROLES.REVIEWER
    ) {
      unassignedTaskCount = removeUserFromTaskAssignments(
        project.id,
        workspaceMembership.userId,
      );
    }
  } else {
    projectMembership = {
      id: randomUUID(),
      projectId: project.id,
      userId: workspaceMembership.userId,
      role,
      joinedAt: timestamp,
      updatedAt: timestamp,
    };

    store.projectMembers.push(projectMembership);

    action = "GRANTED";
    responseStatus = 201;
  }

  project.updatedAt = timestamp;

  return response.status(responseStatus).json({
    action,
    previousRole,

    projectAccess: presentProjectAccess(project, workspaceMembership.userId),

    unassignedTaskCount,
  });
}

export function removeWorkspaceMemberProjectAccess(request, response) {
  const workspace = findWorkspace(request.params.workspaceId);

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message: "You cannot manage members in this workspace",
    });
  }

  const workspaceMembership = findWorkspaceMembership(
    workspace.id,
    request.params.userId,
  );

  if (!workspaceMembership) {
    return response.status(404).json({
      message: "Workspace member not found",
    });
  }

  const project = findWorkspaceProject(workspace.id, request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found in this workspace",
    });
  }

  const projectMembershipIndex = store.projectMembers.findIndex(
    (membership) =>
      membership.projectId === project.id &&
      membership.userId === workspaceMembership.userId,
  );

  if (projectMembershipIndex === -1) {
    const currentAccess = getProjectAccess(project, workspaceMembership.userId);

    if (currentAccess && currentAccess.isMember === false) {
      return response.status(409).json({
        message:
          "This access is inherited from the open Project and cannot be removed individually",
      });
    }

    return response.status(404).json({
      message: "Explicit Project membership not found",
    });
  }

  const projectMembership = store.projectMembers[projectMembershipIndex];

  if (
    project.ownerId === workspaceMembership.userId ||
    projectMembership.role === PROJECT_ROLES.OWNER
  ) {
    return response.status(409).json({
      message: "Transfer Project ownership before removing the owner's access",
    });
  }

  store.projectMembers.splice(projectMembershipIndex, 1);

  const unassignedTaskCount = removeUserFromTaskAssignments(
    project.id,
    workspaceMembership.userId,
  );

  const workspaceMembershipRemoved = removeUnusedGuestWorkspaceMembership(
    workspace.id,
    workspaceMembership.userId,
  );

  project.updatedAt = new Date().toISOString();

  return response.status(200).json({
    message: "Explicit Project access removed",

    removedRole: projectMembership.role,
    unassignedTaskCount,
    workspaceMembershipRemoved,

    remainingProjectAccess: presentProjectAccess(
      project,
      workspaceMembership.userId,
    ),
  });
}

export function removeWorkspaceMember(request, response) {
  const workspace = findWorkspace(request.params.workspaceId);

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  if (
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message: "You cannot manage members in this workspace",
    });
  }

  const membership = findWorkspaceMembership(
    workspace.id,
    request.params.userId,
  );

  if (!membership) {
    return response.status(404).json({
      message: "Workspace member not found",
    });
  }

  const isWorkspaceOwner =
    workspace.ownerId === membership.userId ||
    membership.role === WORKSPACE_ROLES.OWNER;

  if (isWorkspaceOwner) {
    return response.status(409).json({
      message: "Transfer Workspace ownership before removing the owner",
    });
  }

  if (membership.userId === request.user.id) {
    return response.status(409).json({
      message:
        "You cannot remove yourself from the Workspace through member management",
    });
  }

  const requesterIsWorkspaceOwner = workspace.ownerId === request.user.id;

  if (membership.role === WORKSPACE_ROLES.ADMIN && !requesterIsWorkspaceOwner) {
    return response.status(403).json({
      message: "Only the Workspace owner can remove an Admin",
    });
  }

  const projects = store.projects.filter(
    (project) => project.workspaceId === workspace.id,
  );

  const projectIds = new Set(projects.map((project) => project.id));

  const ownedProjects = projects.filter((project) => {
    if (project.ownerId === membership.userId) {
      return true;
    }

    return store.projectMembers.some(
      (projectMembership) =>
        projectMembership.projectId === project.id &&
        projectMembership.userId === membership.userId &&
        projectMembership.role === PROJECT_ROLES.OWNER,
    );
  });

  if (ownedProjects.length > 0) {
    return response.status(409).json({
      message:
        "Transfer Project ownership before removing this Workspace member",

      ownedProjects: ownedProjects.map(presentProjectSummary),
    });
  }

  const user = store.users.find(
    (currentUser) => currentUser.id === membership.userId,
  );

  const projectMembershipsToRemove = store.projectMembers.filter(
    (projectMembership) =>
      projectMembership.userId === membership.userId &&
      projectIds.has(projectMembership.projectId),
  );

  const removedProjectMemberships = projectMembershipsToRemove.map(
    (projectMembership) => {
      const project = projects.find(
        (currentProject) => currentProject.id === projectMembership.projectId,
      );

      const unassignedTaskCount = removeUserFromTaskAssignments(
        projectMembership.projectId,
        membership.userId,
      );

      if (project) {
        project.updatedAt = new Date().toISOString();
      }

      return {
        projectId: projectMembership.projectId,

        projectKey: project?.projectKey ?? null,

        name: project?.name ?? "Unknown Project",

        removedRole: projectMembership.role,

        unassignedTaskCount,
      };
    },
  );

  const totalUnassignedTaskCount = removedProjectMemberships.reduce(
    (total, projectMembership) => total + projectMembership.unassignedTaskCount,
    0,
  );

  store.projectMembers = store.projectMembers.filter(
    (projectMembership) =>
      !(
        projectMembership.userId === membership.userId &&
        projectIds.has(projectMembership.projectId)
      ),
  );

  const timestamp = new Date().toISOString();

  const pendingInvitations = store.projectInvitations.filter(
    (invitation) =>
      invitation.workspaceId === workspace.id &&
      invitation.email === user?.email &&
      invitation.status === INVITATION_STATUS.PENDING,
  );

  for (const invitation of pendingInvitations) {
    invitation.status = INVITATION_STATUS.CANCELLED;

    invitation.respondedAt = timestamp;
  }

  store.workspaceMembers = store.workspaceMembers.filter(
    (workspaceMembership) =>
      !(
        workspaceMembership.workspaceId === workspace.id &&
        workspaceMembership.userId === membership.userId
      ),
  );

  workspace.updatedAt = timestamp;

  return response.status(200).json({
    message: "Workspace member removed",

    removedMember: {
      userId: membership.userId,
      name: user?.name ?? "Unknown user",
      email: user?.email ?? null,
      workspaceRole: membership.role,
    },

    removedProjectMemberships,
    totalUnassignedTaskCount,

    cancelledInvitationCount: pendingInvitations.length,
  });
}
