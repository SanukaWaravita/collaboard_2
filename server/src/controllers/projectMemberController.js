import { store } from "../data/inMemoryStore.js";
import {
  MEMBER_TYPES,
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  getProjectAccess,
  hasProjectPermission,
} from "../utils/projectAccess.js";
import { hasWorkspacePermission } from "../utils/workspaceAccess.js";
import {
  clearTaskAssignmentsForUser,
  isAssignableProjectRole,
} from "../utils/taskAssignee.js";

const editableProjectRoles = new Set([
  PROJECT_ROLES.CONTRIBUTOR,
  PROJECT_ROLES.REVIEWER,
]);

function findProject(projectId) {
  return store.projects.find(
    (project) => project.id === projectId,
  );
}

function findProjectMembership(projectId, userId) {
  return store.projectMembers.find(
    (membership) =>
      membership.projectId === projectId &&
      membership.userId === userId,
  );
}

function findWorkspaceMembership(workspaceId, userId) {
  return store.workspaceMembers.find(
    (membership) =>
      membership.workspaceId === workspaceId &&
      membership.userId === userId,
  );
}

function canManageProjectMembers(userId, project) {
  const workspace = store.workspaces.find(
    (currentWorkspace) =>
      currentWorkspace.id === project.workspaceId,
  );

  return (
    hasProjectPermission(
      project,
      userId,
      PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    ) ||
    Boolean(
      workspace &&
        hasWorkspacePermission(
          workspace,
          userId,
          WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
        ),
    )
  );
}

function presentProjectMember(membership, project) {
  const user = store.users.find(
    (currentUser) => currentUser.id === membership.userId,
  );

  const workspaceMembership = findWorkspaceMembership(
    project.workspaceId,
    membership.userId,
  );

  return {
    userId: membership.userId,
    name: user?.name ?? "Unknown user",
    email: user?.email ?? null,
    projectRole: membership.role,
canBeAssigned: isAssignableProjectRole(
  membership.role,
),
workspaceRole: workspaceMembership?.role ?? null,
    memberType:
      workspaceMembership?.role === WORKSPACE_ROLES.GUEST
        ? MEMBER_TYPES.GUEST
        : MEMBER_TYPES.INTERNAL,
    joinedAt:
      membership.joinedAt ??
      membership.createdAt ??
      null,
  };
}

function removeUnusedGuestWorkspaceMembership(
  workspaceId,
  userId,
) {
  const workspaceMembershipIndex =
    store.workspaceMembers.findIndex(
      (membership) =>
        membership.workspaceId === workspaceId &&
        membership.userId === userId &&
        membership.role === WORKSPACE_ROLES.GUEST,
    );

  if (workspaceMembershipIndex === -1) {
    return false;
  }

  const hasAnotherProject = store.projectMembers.some(
    (membership) => {
      if (membership.userId !== userId) {
        return false;
      }

      const membershipProject = store.projects.find(
        (project) => project.id === membership.projectId,
      );

      return membershipProject?.workspaceId === workspaceId;
    },
  );

  if (hasAnotherProject) {
    return false;
  }

  store.workspaceMembers.splice(
    workspaceMembershipIndex,
    1,
  );

  return true;
}

export function getProjectMembers(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  const projectAccess = getProjectAccess(
    project,
    request.user.id,
  );

  const canManage = canManageProjectMembers(
    request.user.id,
    project,
  );

  if (!projectAccess && !canManage) {
    return response.status(403).json({
      message: "You do not have access to this project",
    });
  }

  const members = store.projectMembers
    .filter(
      (membership) =>
        membership.projectId === project.id,
    )
    .map((membership) =>
      presentProjectMember(membership, project),
    )
    .sort((firstMember, secondMember) => {
      if (
        firstMember.projectRole === PROJECT_ROLES.OWNER
      ) {
        return -1;
      }

      if (
        secondMember.projectRole === PROJECT_ROLES.OWNER
      ) {
        return 1;
      }

      return firstMember.name.localeCompare(
        secondMember.name,
      );
    });

  return response.status(200).json({
    members,
    canManageMembers: canManage,
  });
}

export function updateProjectMember(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !canManageProjectMembers(request.user.id, project)
  ) {
    return response.status(403).json({
      message:
        "You do not have permission to manage project members",
    });
  }

  const { role } = request.body ?? {};

  if (!editableProjectRoles.has(role)) {
    return response.status(400).json({
      message:
        "Project role must be CONTRIBUTOR or REVIEWER",
    });
  }

  const membership = findProjectMembership(
    project.id,
    request.params.userId,
  );

  if (!membership) {
    return response.status(404).json({
      message: "Project member not found",
    });
  }

  if (
    membership.role === PROJECT_ROLES.OWNER ||
    membership.userId === project.ownerId
  ) {
    return response.status(409).json({
      message:
        "Transfer project ownership before changing the owner's role",
    });
  }

  const timestamp = new Date().toISOString();

membership.role = role;
membership.updatedAt = timestamp;
project.updatedAt = timestamp;

const unassignedTaskCount =
  isAssignableProjectRole(role)
    ? 0
    : clearTaskAssignmentsForUser(
        project.id,
        membership.userId,
      );

return response.status(200).json({
  member: presentProjectMember(membership, project),
  unassignedTaskCount,
});
}

export function removeProjectMember(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !canManageProjectMembers(request.user.id, project)
  ) {
    return response.status(403).json({
      message:
        "You do not have permission to manage project members",
    });
  }

  const membershipIndex = store.projectMembers.findIndex(
    (membership) =>
      membership.projectId === project.id &&
      membership.userId === request.params.userId,
  );

  if (membershipIndex === -1) {
    return response.status(404).json({
      message: "Project member not found",
    });
  }

  const membership = store.projectMembers[membershipIndex];

  if (
    membership.role === PROJECT_ROLES.OWNER ||
    membership.userId === project.ownerId
  ) {
    return response.status(409).json({
      message:
        "Project owners cannot be removed. Transfer ownership first.",
    });
  }

  store.projectMembers.splice(membershipIndex, 1);

const unassignedTaskCount =
  clearTaskAssignmentsForUser(
    project.id,
    membership.userId,
  );

const workspaceGuestRemoved =
  removeUnusedGuestWorkspaceMembership(
    project.workspaceId,
    membership.userId,
  );

project.updatedAt = new Date().toISOString();

return response.status(200).json({
  message: "Project member removed",
  userId: membership.userId,
  unassignedTaskCount,
  workspaceGuestRemoved,
});
}

export function transferProjectOwnership(
  request,
  response,
) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (project.ownerId !== request.user.id) {
    return response.status(403).json({
      message:
        "Only the current project owner can transfer ownership",
    });
  }

  const { userId } = request.body ?? {};

  if (typeof userId !== "string" || !userId.trim()) {
    return response.status(400).json({
      message: "The new owner's userId is required",
    });
  }

  if (userId === request.user.id) {
    return response.status(400).json({
      message: "This user already owns the project",
    });
  }

  const newOwnerMembership = findProjectMembership(
    project.id,
    userId,
  );

  if (!newOwnerMembership) {
    return response.status(400).json({
      message:
        "The new owner must already be a project member",
    });
  }

  const newOwnerWorkspaceMembership =
    findWorkspaceMembership(
      project.workspaceId,
      userId,
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
      message: "Guest users cannot own projects",
    });
  }

  const timestamp = new Date().toISOString();

  let previousOwnerMembership = findProjectMembership(
    project.id,
    request.user.id,
  );

  if (!previousOwnerMembership) {
    previousOwnerMembership = {
      projectId: project.id,
      userId: request.user.id,
      role: PROJECT_ROLES.CONTRIBUTOR,
      joinedAt: timestamp,
      updatedAt: timestamp,
    };

    store.projectMembers.push(previousOwnerMembership);
  }

  for (const membership of store.projectMembers) {
    if (
      membership.projectId === project.id &&
      membership.role === PROJECT_ROLES.OWNER
    ) {
      membership.role = PROJECT_ROLES.CONTRIBUTOR;
      membership.updatedAt = timestamp;
    }
  }

  newOwnerMembership.role = PROJECT_ROLES.OWNER;
  newOwnerMembership.updatedAt = timestamp;

  previousOwnerMembership.role =
    PROJECT_ROLES.CONTRIBUTOR;
  previousOwnerMembership.updatedAt = timestamp;

  project.ownerId = userId;
  project.updatedAt = timestamp;

  return response.status(200).json({
    message: "Project ownership transferred",
    project,
    previousOwner: presentProjectMember(
      previousOwnerMembership,
      project,
    ),
    newOwner: presentProjectMember(
      newOwnerMembership,
      project,
    ),
  });
}