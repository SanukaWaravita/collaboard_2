import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";
import {
  INVITATION_STATUS,
  MEMBER_TYPES,
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  getProjectMembership,
  hasProjectPermission,
} from "../utils/projectAccess.js";
import {
  getWorkspaceMembership,
  hasWorkspacePermission,
} from "../utils/workspaceAccess.js";

const allowedInvitationRoles = new Set([
  PROJECT_ROLES.CONTRIBUTOR,
  PROJECT_ROLES.REVIEWER,
]);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function presentInvitation(invitation) {
  const project = store.projects.find(
    (item) => item.id === invitation.projectId,
  );

  const workspace = store.workspaces.find(
    (item) => item.id === invitation.workspaceId,
  );

  const inviter = store.users.find(
    (user) => user.id === invitation.invitedById,
  );

  return {
    ...invitation,

    project: project
      ? {
          id: project.id,
          projectKey: project.projectKey,
          name: project.name,
          visibility: project.visibility,
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

export function inviteProjectMember(
  request,
  response,
) {
  const project = store.projects.find(
    (item) => item.id === request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can invite members",
    });
  }

  const workspace = store.workspaces.find(
    (item) => item.id === project.workspaceId,
  );

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  const {
    email,
    role = PROJECT_ROLES.REVIEWER,
    memberType = MEMBER_TYPES.INTERNAL,
  } = request.body ?? {};

  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return response.status(400).json({
      message: "A valid email address is required",
    });
  }

  if (normalizedEmail === request.user.email) {
    return response.status(400).json({
      message: "You are already the project owner",
    });
  }

  if (!allowedInvitationRoles.has(role)) {
    return response.status(400).json({
      message:
        "Role must be CONTRIBUTOR or REVIEWER",
    });
  }

  if (
    !Object.values(MEMBER_TYPES).includes(memberType)
  ) {
    return response.status(400).json({
      message:
        "Member type must be INTERNAL or GUEST",
    });
  }

  const invitedUser = store.users.find(
    (user) => user.email === normalizedEmail,
  );

  const existingWorkspaceMembership = invitedUser
    ? getWorkspaceMembership(
        workspace.id,
        invitedUser.id,
      )
    : null;

  const existingProjectMembership = invitedUser
    ? getProjectMembership(
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
      memberType === MEMBER_TYPES.INTERNAL
    );

  if (
    requiresWorkspaceManagement &&
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message:
        "Workspace administration permission is required to invite this user",
    });
  }

  let effectiveMemberType = memberType;

  if (
    existingWorkspaceMembership &&
    existingWorkspaceMembership.role !==
      WORKSPACE_ROLES.GUEST
  ) {
    effectiveMemberType = MEMBER_TYPES.INTERNAL;
  }

  const existingInvitation =
    store.projectInvitations.find(
      (invitation) =>
        invitation.projectId === project.id &&
        invitation.email === normalizedEmail &&
        invitation.status ===
          INVITATION_STATUS.PENDING,
    );

  if (existingInvitation) {
    return response.status(409).json({
      message:
        "A pending invitation already exists",
    });
  }

  const invitation = {
    id: randomUUID(),
    workspaceId: workspace.id,
    projectId: project.id,
    email: normalizedEmail,
    role,
    memberType: effectiveMemberType,
    status: INVITATION_STATUS.PENDING,
    invitedById: request.user.id,
    createdAt: new Date().toISOString(),
    respondedAt: null,
  };

  store.projectInvitations.push(invitation);

  return response.status(201).json({
    invitation: presentInvitation(invitation),
  });
}

export function getProjectInvitations(
  request,
  response,
) {
  const project = store.projects.find(
    (item) => item.id === request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can view invitations",
    });
  }

  const invitations = store.projectInvitations
    .filter(
      (invitation) =>
        invitation.projectId === project.id,
    )
    .map(presentInvitation);

  return response.status(200).json({
    invitations,
  });
}

export function cancelProjectInvitation(
  request,
  response,
) {
  const project = store.projects.find(
    (item) => item.id === request.params.projectId,
  );

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    )
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can cancel invitations",
    });
  }

  const invitation =
    store.projectInvitations.find(
      (item) =>
        item.id === request.params.invitationId &&
        item.projectId === project.id &&
        item.status === INVITATION_STATUS.PENDING,
    );

  if (!invitation) {
    return response.status(404).json({
      message:
        "Pending invitation not found",
    });
  }

  invitation.status =
    INVITATION_STATUS.CANCELLED;
  invitation.respondedAt =
    new Date().toISOString();

  return response.status(200).json({
    invitation: presentInvitation(invitation),
  });
}

export function getMyInvitations(
  request,
  response,
) {
  const invitations = store.projectInvitations
    .filter(
      (invitation) =>
        invitation.email === request.user.email &&
        invitation.status ===
          INVITATION_STATUS.PENDING,
    )
    .map(presentInvitation);

  return response.status(200).json({
    invitations,
  });
}

export function acceptInvitation(
  request,
  response,
) {
  const invitation =
    store.projectInvitations.find(
      (item) =>
        item.id === request.params.invitationId &&
        item.status === INVITATION_STATUS.PENDING,
    );

  if (
    !invitation ||
    invitation.email !== request.user.email
  ) {
    return response.status(404).json({
      message: "Invitation not found",
    });
  }

  const project = store.projects.find(
    (item) => item.id === invitation.projectId,
  );

  const workspace = store.workspaces.find(
    (item) => item.id === invitation.workspaceId,
  );

  if (!project || !workspace) {
    return response.status(404).json({
      message:
        "The invited project or workspace no longer exists",
    });
  }

  const existingProjectMembership =
    getProjectMembership(
      project.id,
      request.user.id,
    );

  if (existingProjectMembership) {
    return response.status(409).json({
      message:
        "You are already a member of this project",
    });
  }

  let workspaceMembership =
    getWorkspaceMembership(
      workspace.id,
      request.user.id,
    );

  const timestamp = new Date().toISOString();

  if (!workspaceMembership) {
    workspaceMembership = {
      id: randomUUID(),
      workspaceId: workspace.id,
      userId: request.user.id,

      role:
        invitation.memberType === MEMBER_TYPES.GUEST
          ? WORKSPACE_ROLES.GUEST
          : WORKSPACE_ROLES.MEMBER,

      joinedAt: timestamp,
    };

    store.workspaceMembers.push(
      workspaceMembership,
    );
  } else if (
    workspaceMembership.role ===
      WORKSPACE_ROLES.GUEST &&
    invitation.memberType === MEMBER_TYPES.INTERNAL
  ) {
    workspaceMembership.role =
      WORKSPACE_ROLES.MEMBER;
  }

  const projectMembership = {
    id: randomUUID(),
    projectId: project.id,
    userId: request.user.id,
    role: invitation.role,
    joinedAt: timestamp,
  };

  store.projectMembers.push(projectMembership);

  invitation.status =
    INVITATION_STATUS.ACCEPTED;
  invitation.respondedAt = timestamp;

  return response.status(200).json({
    projectMembership,
    workspaceMembership,
  });
}

export function declineInvitation(
  request,
  response,
) {
  const invitation =
    store.projectInvitations.find(
      (item) =>
        item.id === request.params.invitationId &&
        item.status === INVITATION_STATUS.PENDING,
    );

  if (
    !invitation ||
    invitation.email !== request.user.email
  ) {
    return response.status(404).json({
      message: "Invitation not found",
    });
  }

  invitation.status =
    INVITATION_STATUS.DECLINED;
  invitation.respondedAt =
    new Date().toISOString();

  return response.status(200).json({
    invitation: presentInvitation(invitation),
  });
}