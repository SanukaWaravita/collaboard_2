import { store } from "../data/inMemoryStore.js";
import {
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  PROJECT_VISIBILITY,
  WORKSPACE_ROLES,
} from "../constants/access.js";

const rolePermissions = Object.freeze({
  [PROJECT_ROLES.OWNER]: [
    PROJECT_PERMISSIONS.READ_PROJECT,
    PROJECT_PERMISSIONS.UPDATE_PROJECT,
    PROJECT_PERMISSIONS.DELETE_PROJECT,
    PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    PROJECT_PERMISSIONS.CREATE_TASK,
    PROJECT_PERMISSIONS.UPDATE_TASK,
    PROJECT_PERMISSIONS.DELETE_TASK,
  ],

  [PROJECT_ROLES.CONTRIBUTOR]: [
    PROJECT_PERMISSIONS.READ_PROJECT,
    PROJECT_PERMISSIONS.CREATE_TASK,
    PROJECT_PERMISSIONS.UPDATE_TASK,
    PROJECT_PERMISSIONS.DELETE_TASK,
  ],

  [PROJECT_ROLES.REVIEWER]: [PROJECT_PERMISSIONS.READ_PROJECT],
});

export function getProjectPermissions(role) {
  return rolePermissions[role] ?? [];
}

export function getWorkspaceMembership(workspaceId, userId) {
  return store.workspaceMembers.find(
    (membership) =>
      membership.workspaceId === workspaceId && membership.userId === userId,
  );
}

export function getProjectMembership(projectId, userId) {
  return store.projectMembers.find(
    (membership) =>
      membership.projectId === projectId && membership.userId === userId,
  );
}

export function getProjectAccess(project, userId) {
  const projectMembership = getProjectMembership(project.id, userId);

  if (projectMembership) {
    return {
      role: projectMembership.role,
      isMember: true,
      permissions: rolePermissions[projectMembership.role] ?? [],
    };
  }

  const workspaceMembership = getWorkspaceMembership(
    project.workspaceId,
    userId,
  );

  const canViewOpenProject =
    workspaceMembership &&
    workspaceMembership.role !== WORKSPACE_ROLES.GUEST &&
    project.visibility === PROJECT_VISIBILITY.OPEN;

  if (canViewOpenProject) {
    return {
      role: PROJECT_ROLES.REVIEWER,
      isMember: false,
      permissions: getProjectPermissions(PROJECT_ROLES.REVIEWER),
    };
  }

  return null;
}

export function hasProjectPermission(project, userId, permission) {
  const access = getProjectAccess(project, userId);

  return Boolean(access?.permissions.includes(permission));
}
