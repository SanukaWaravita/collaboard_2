import {
  WorkspaceMember,
} from "../models/index.js";
import {
  getWorkspacePermissions,
} from "./workspaceAccess.js";

export async function getDatabaseWorkspaceMembership(
  workspaceId,
  userId,
) {
  return WorkspaceMember.findOne({
    workspaceId,
    userId,
  });
}

export async function getDatabaseWorkspaceAccess(
  workspace,
  userId,
) {
  const membership =
    await getDatabaseWorkspaceMembership(
      workspace.id,
      userId,
    );

  if (!membership) {
    return null;
  }

  return {
    role: membership.role,
    permissions:
      getWorkspacePermissions(
        membership.role,
      ),
  };
}

export async function hasDatabaseWorkspacePermission(
  workspace,
  userId,
  permission,
) {
  const access =
    await getDatabaseWorkspaceAccess(
      workspace,
      userId,
    );

  return Boolean(
    access?.permissions.includes(permission),
  );
}