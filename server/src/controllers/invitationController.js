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

export function inviteWorkspaceProjectMembers(
  request,
  response,
) {
  const workspace = store.workspaces.find(
    (item) =>
      item.id === request.params.workspaceId,
  );

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
      message:
        "Workspace member management permission is required",
    });
  }

  const {
    email,
    memberType = MEMBER_TYPES.INTERNAL,
    projects = [],
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
      message: "You cannot invite yourself",
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

  if (!Array.isArray(projects) || projects.length === 0) {
    return response.status(400).json({
      message:
        "At least one Project must be selected",
    });
  }

  const normalizedSelections = projects.map(
    (selection) => ({
      projectId: String(
        selection?.projectId ?? "",
      ).trim(),

      role: String(
        selection?.role ??
          PROJECT_ROLES.REVIEWER,
      ).trim(),
    }),
  );

  const selectedProjectIds = new Set();

  for (const selection of normalizedSelections) {
    if (!selection.projectId) {
      return response.status(400).json({
        message:
          "Every Project selection requires a projectId",
      });
    }

    if (
      !allowedInvitationRoles.has(selection.role)
    ) {
      return response.status(400).json({
        message:
          "Every Project role must be CONTRIBUTOR or REVIEWER",
      });
    }

    if (
      selectedProjectIds.has(selection.projectId)
    ) {
      return response.status(400).json({
        message:
          "A Project cannot be selected more than once",
      });
    }

    selectedProjectIds.add(selection.projectId);
  }

  const selectedProjects = normalizedSelections.map(
    (selection) => {
      const project = store.projects.find(
        (item) =>
          item.id === selection.projectId &&
          item.workspaceId === workspace.id,
      );

      return {
        ...selection,
        project,
      };
    },
  );

  const missingSelection = selectedProjects.find(
    (selection) => !selection.project,
  );

  if (missingSelection) {
    return response.status(400).json({
      message:
        "Every selected Project must belong to this Workspace",
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

  let effectiveMemberType = memberType;

  if (
    existingWorkspaceMembership &&
    existingWorkspaceMembership.role !==
      WORKSPACE_ROLES.GUEST
  ) {
    effectiveMemberType = MEMBER_TYPES.INTERNAL;
  }

  const createdInvitations = [];
  const skippedProjects = [];

  for (const selection of selectedProjects) {
    const { project, role } = selection;

    const existingProjectMembership = invitedUser
      ? getProjectMembership(
          project.id,
          invitedUser.id,
        )
      : null;

    if (existingProjectMembership) {
      skippedProjects.push({
        projectId: project.id,
        projectKey: project.projectKey,
        projectName: project.name,
        reason: "ALREADY_MEMBER",
        message:
          "The user is already a member of this Project",
      });

      continue;
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
      skippedProjects.push({
        projectId: project.id,
        projectKey: project.projectKey,
        projectName: project.name,
        reason: "PENDING_INVITATION_EXISTS",
        message:
          "A pending invitation already exists",
      });

      continue;
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
    createdInvitations.push(invitation);
  }

  if (createdInvitations.length === 0) {
    return response.status(409).json({
      message:
        "No invitations were created because every selected Project was skipped",
      invitations: [],
      skippedProjects,
    });
  }

  return response.status(201).json({
    message:
      `${createdInvitations.length} ` +
      `${
        createdInvitations.length === 1
          ? "invitation"
          : "invitations"
      } created`,

    invitations: createdInvitations.map(
      presentInvitation,
    ),

    skippedProjects,
  });
}

export function cancelWorkspaceInvitation(
  request,
  response,
) {
  const workspace = store.workspaces.find(
    (item) =>
      item.id === request.params.workspaceId,
  );

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
      message:
        "Workspace member management permission is required",
    });
  }

  const invitation =
    store.projectInvitations.find(
      (item) =>
        item.id === request.params.invitationId &&
        item.workspaceId === workspace.id &&
        item.status === INVITATION_STATUS.PENDING,
    );

  if (!invitation) {
    return response.status(404).json({
      message:
        "Pending Workspace invitation not found",
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