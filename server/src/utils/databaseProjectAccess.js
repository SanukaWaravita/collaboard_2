import {
  PROJECT_ROLES,
  PROJECT_VISIBILITY,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  ProjectMember,
  WorkspaceMember,
} from "../models/index.js";
import { getProjectPermissions } from "./projectAccess.js";

export async function getDatabaseProjectMembership(
  projectId,
  userId,
) {
  return ProjectMember.findOne({
    projectId,
    userId,
  });
}

export async function getDatabaseProjectAccess(
  project,
  userId,
) {
  const projectMembership =
    await getDatabaseProjectMembership(
      project.id,
      userId,
    );

  if (projectMembership) {
    return {
      role: projectMembership.role,
      isMember: true,
      permissions: getProjectPermissions(
        projectMembership.role,
      ),
    };
  }

  const workspaceMembership =
    await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId,
    });

  const canViewOpenProject =
    workspaceMembership &&
    workspaceMembership.role !==
      WORKSPACE_ROLES.GUEST &&
    project.visibility ===
      PROJECT_VISIBILITY.OPEN;

  if (canViewOpenProject) {
    return {
      role: PROJECT_ROLES.REVIEWER,
      isMember: false,
      permissions: getProjectPermissions(
        PROJECT_ROLES.REVIEWER,
      ),
    };
  }

  return null;
}

export async function hasDatabaseProjectPermission(
  project,
  userId,
  permission,
) {
  const access =
    await getDatabaseProjectAccess(
      project,
      userId,
    );

  return Boolean(
    access?.permissions.includes(permission),
  );
}