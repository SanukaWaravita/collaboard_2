import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";
import { WORKSPACE_PERMISSIONS, WORKSPACE_ROLES } from "../constants/access.js";
import {
  getWorkspaceAccess,
  hasWorkspacePermission,
} from "../utils/workspaceAccess.js";
import {
  generateWorkspaceSlug,
  normalizeWorkspaceSlug,
  validateWorkspaceSlug,
  workspaceSlugExists,
} from "../utils/workspaceSlug.js";

function presentWorkspace(workspace, userId) {
  const access = getWorkspaceAccess(workspace, userId);

  return {
    ...workspace,

    memberCount: store.workspaceMembers.filter(
      (membership) => membership.workspaceId === workspace.id,
    ).length,

    projectCount: store.projects.filter(
      (project) => project.workspaceId === workspace.id,
    ).length,

    currentUserRole: access?.role ?? null,
    permissions: access?.permissions ?? [],
  };
}

export function getWorkspaces(request, response) {
  const workspaceIds = new Set(
    store.workspaceMembers
      .filter((membership) => membership.userId === request.user.id)
      .map((membership) => membership.workspaceId),
  );

  const workspaces = store.workspaces
    .filter((workspace) => workspaceIds.has(workspace.id))
    .map((workspace) => presentWorkspace(workspace, request.user.id));

  return response.status(200).json({ workspaces });
}

export function createWorkspace(request, response) {
  const { name, slug: requestedSlug } = request.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return response.status(400).json({
      message: "Workspace name is required",
    });
  }

  const slug = requestedSlug
    ? normalizeWorkspaceSlug(requestedSlug)
    : generateWorkspaceSlug(name);

  if (!validateWorkspaceSlug(slug)) {
    return response.status(400).json({
      message:
        "Workspace slug must contain 2–50 lowercase letters, numbers, or hyphens",
    });
  }

  if (workspaceSlugExists(slug)) {
    return response.status(409).json({
      message: "That workspace slug is already in use",
    });
  }

  const timestamp = new Date().toISOString();

  const workspace = {
    id: randomUUID(),
    name: name.trim(),
    slug,
    ownerId: request.user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.workspaces.push(workspace);

  store.workspaceMembers.push({
    id: randomUUID(),
    workspaceId: workspace.id,
    userId: request.user.id,
    role: WORKSPACE_ROLES.OWNER,
    joinedAt: timestamp,
  });

  return response.status(201).json({
    workspace: presentWorkspace(workspace, request.user.id),
  });
}

export function getWorkspace(request, response) {
  const workspace = store.workspaces.find(
    (currentWorkspace) => currentWorkspace.id === request.params.workspaceId,
  );

  if (
    !workspace ||
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.READ_WORKSPACE,
    )
  ) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  return response.status(200).json({
    workspace: presentWorkspace(workspace, request.user.id),
  });
}

export function updateWorkspace(request, response) {
  const workspace = store.workspaces.find(
    (currentWorkspace) => currentWorkspace.id === request.params.workspaceId,
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
      WORKSPACE_PERMISSIONS.UPDATE_WORKSPACE,
    )
  ) {
    return response.status(403).json({
      message: "You cannot update this workspace",
    });
  }

  const { name } = request.body ?? {};

  if (name === undefined) {
    return response.status(400).json({
      message: "Provide a workspace name to update",
    });
  }

  if (typeof name !== "string" || !name.trim()) {
    return response.status(400).json({
      message: "Workspace name cannot be empty",
    });
  }

  workspace.name = name.trim();
  workspace.updatedAt = new Date().toISOString();

  return response.status(200).json({
    workspace: presentWorkspace(workspace, request.user.id),
  });
}

export function deleteWorkspace(request, response) {
  const workspaceIndex = store.workspaces.findIndex(
    (workspace) => workspace.id === request.params.workspaceId,
  );

  if (workspaceIndex === -1) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  const workspace = store.workspaces[workspaceIndex];

  if (
    !hasWorkspacePermission(
      workspace,
      request.user.id,
      WORKSPACE_PERMISSIONS.DELETE_WORKSPACE,
    )
  ) {
    return response.status(403).json({
      message: "Only the workspace owner can delete this workspace",
    });
  }

  const projectIds = new Set(
    store.projects
      .filter((project) => project.workspaceId === workspace.id)
      .map((project) => project.id),
  );

  store.tasks = store.tasks.filter((task) => !projectIds.has(task.projectId));

  store.projectMembers = store.projectMembers.filter(
    (membership) => !projectIds.has(membership.projectId),
  );

  store.projectInvitations = store.projectInvitations.filter(
    (invitation) => !projectIds.has(invitation.projectId),
  );

  store.projects = store.projects.filter(
    (project) => project.workspaceId !== workspace.id,
  );

  store.workspaceMembers = store.workspaceMembers.filter(
    (membership) => membership.workspaceId !== workspace.id,
  );

  store.workspaces.splice(workspaceIndex, 1);

  return response.status(204).send();
}
