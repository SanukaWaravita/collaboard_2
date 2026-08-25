import { store } from "../data/inMemoryStore.js";
import { WORKSPACE_PERMISSIONS, WORKSPACE_ROLES } from "../constants/access.js";

const rolePermissions = Object.freeze({
  [WORKSPACE_ROLES.OWNER]: [
    WORKSPACE_PERMISSIONS.READ_WORKSPACE,
    WORKSPACE_PERMISSIONS.UPDATE_WORKSPACE,
    WORKSPACE_PERMISSIONS.DELETE_WORKSPACE,
    WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    WORKSPACE_PERMISSIONS.CREATE_PROJECT,
  ],

  [WORKSPACE_ROLES.ADMIN]: [
    WORKSPACE_PERMISSIONS.READ_WORKSPACE,
    WORKSPACE_PERMISSIONS.UPDATE_WORKSPACE,
    WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    WORKSPACE_PERMISSIONS.CREATE_PROJECT,
  ],

  [WORKSPACE_ROLES.MEMBER]: [
    WORKSPACE_PERMISSIONS.READ_WORKSPACE,
    WORKSPACE_PERMISSIONS.CREATE_PROJECT,
  ],

  [WORKSPACE_ROLES.GUEST]: [WORKSPACE_PERMISSIONS.READ_WORKSPACE],
});

export function getWorkspaceMembership(workspaceId, userId) {
  return store.workspaceMembers.find(
    (membership) =>
      membership.workspaceId === workspaceId && membership.userId === userId,
  );
}

export function getWorkspaceAccess(workspace, userId) {
  const membership = getWorkspaceMembership(workspace.id, userId);

  if (!membership) {
    return null;
  }

  return {
    role: membership.role,
    permissions: rolePermissions[membership.role] ?? [],
  };
}

export function hasWorkspacePermission(workspace, userId, permission) {
  const access = getWorkspaceAccess(workspace, userId);

  return Boolean(access?.permissions.includes(permission));
}
