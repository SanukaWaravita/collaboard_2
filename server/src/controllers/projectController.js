import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";
import {
  PROJECT_PERMISSIONS,
  PROJECT_ROLES,
  PROJECT_VISIBILITY,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  getProjectAccess,
  hasProjectPermission,
} from "../utils/projectAccess.js";
import {
  generateProjectKey,
  normalizeProjectKey,
  projectKeyExists,
  validateProjectKey,
} from "../utils/projectKey.js";
import {
  createDefaultWorkflowStatuses,
} from "../utils/workflowStatuses.js";

function presentProject(project, userId) {
  const access = getProjectAccess(project, userId);

  return {
    ...project,

    taskCount: store.tasks.filter(
      (task) => task.projectId === project.id,
    ).length,

    currentUserRole: access?.role ?? null,
    isMember: access?.isMember ?? false,
    permissions: access?.permissions ?? [],
  };
}

function findWorkspaceMembershipForCreation(
  userId,
  requestedWorkspaceId,
) {
  if (requestedWorkspaceId) {
    return store.workspaceMembers.find(
      (membership) =>
        membership.workspaceId ===
          requestedWorkspaceId &&
        membership.userId === userId,
    );
  }

  const eligibleMemberships =
    store.workspaceMembers.filter(
      (membership) =>
        membership.userId === userId &&
        membership.role !== WORKSPACE_ROLES.GUEST,
    );

  if (eligibleMemberships.length === 1) {
    return eligibleMemberships[0];
  }

  return null;
}

export function getProjects(request, response) {
  const requestedWorkspaceId =
    request.params.workspaceId ??
    request.query.workspaceId;

  const projects = store.projects
    .filter((project) => {
      if (
        requestedWorkspaceId &&
        project.workspaceId !== requestedWorkspaceId
      ) {
        return false;
      }

      return Boolean(
        getProjectAccess(project, request.user.id),
      );
    })
    .map((project) =>
      presentProject(project, request.user.id),
    );

  return response.status(200).json({
    projects,
  });
}

export function createProject(request, response) {
  const {
    workspaceId: bodyWorkspaceId,
    name,
    description = "",
    projectKey,
    visibility = PROJECT_VISIBILITY.PRIVATE,
  } = request.body ?? {};

  const workspaceId =
    request.params.workspaceId ?? bodyWorkspaceId;

  if (typeof name !== "string" || !name.trim()) {
    return response.status(400).json({
      message: "Project name is required",
    });
  }

  if (typeof description !== "string") {
    return response.status(400).json({
      message: "Project description must be text",
    });
  }

  if (
    !Object.values(PROJECT_VISIBILITY).includes(
      visibility,
    )
  ) {
    return response.status(400).json({
      message: "Visibility must be open or private",
    });
  }

  const workspaceMembership =
    findWorkspaceMembershipForCreation(
      request.user.id,
      workspaceId,
    );

  if (!workspaceMembership) {
    const membershipCount =
      store.workspaceMembers.filter(
        (membership) =>
          membership.userId === request.user.id &&
          membership.role !== WORKSPACE_ROLES.GUEST,
      ).length;

    if (!workspaceId && membershipCount > 1) {
      return response.status(400).json({
        message:
          "workspaceId is required when you belong to multiple workspaces",
      });
    }

    return response.status(403).json({
      message:
        "You cannot create projects in this workspace",
    });
  }

  if (workspaceMembership.role === WORKSPACE_ROLES.GUEST) {
    return response.status(403).json({
      message: "Guest users cannot create projects",
    });
  }

  const workspace = store.workspaces.find(
    (currentWorkspace) =>
      currentWorkspace.id ===
      workspaceMembership.workspaceId,
  );

  if (!workspace) {
    return response.status(404).json({
      message: "Workspace not found",
    });
  }

  const normalizedKey = projectKey
    ? normalizeProjectKey(projectKey)
    : generateProjectKey(workspace.id, name);

  if (!validateProjectKey(normalizedKey)) {
    return response.status(400).json({
      message:
        "Project key must contain 2–10 uppercase letters or numbers",
    });
  }

  if (projectKeyExists(workspace.id, normalizedKey)) {
    return response.status(409).json({
      message:
        "That project key is already used in this workspace",
    });
  }

  const timestamp = new Date().toISOString();

  const project = {
    id: randomUUID(),
    workspaceId: workspace.id,
    projectKey: normalizedKey,
    name: name.trim(),
    description: description.trim(),
    visibility,
    ownerId: request.user.id,
    workflowStatuses: createDefaultWorkflowStatuses(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.projects.push(project);

  store.projectMembers.push({
    id: randomUUID(),
    projectId: project.id,
    userId: request.user.id,
    role: PROJECT_ROLES.OWNER,
    joinedAt: timestamp,
  });

  const presentedProject = presentProject(
    project,
    request.user.id,
  );

  return response.status(201).json({
    project: presentedProject,
  });
}

export function getProject(request, response) {
  const project = store.projects.find(
    (currentProject) =>
      currentProject.id === request.params.projectId,
  );

  if (
    !project ||
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.READ_PROJECT,
    )
  ) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  const tasks = store.tasks.filter(
    (task) => task.projectId === project.id,
  );

  const presentedProject = presentProject(
    project,
    request.user.id,
  );

  return response.status(200).json({
    project: presentedProject,
    tasks,
  });
}

export function updateProject(request, response) {
  const project = store.projects.find(
    (currentProject) =>
      currentProject.id === request.params.projectId,
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
      PROJECT_PERMISSIONS.UPDATE_PROJECT,
    )
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can update this project",
    });
  }

  const {
    name,
    description,
    visibility,
  } = request.body ?? {};

  const containsUpdate =
    name !== undefined ||
    description !== undefined ||
    visibility !== undefined;

  if (!containsUpdate) {
    return response.status(400).json({
      message:
        "Provide a name, description, or visibility to update",
    });
  }

  if (
    name !== undefined &&
    (typeof name !== "string" || !name.trim())
  ) {
    return response.status(400).json({
      message: "Project name cannot be empty",
    });
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return response.status(400).json({
      message: "Project description must be text",
    });
  }

  if (
    visibility !== undefined &&
    !Object.values(PROJECT_VISIBILITY).includes(
      visibility,
    )
  ) {
    return response.status(400).json({
      message: "Visibility must be open or private",
    });
  }

  if (name !== undefined) {
    project.name = name.trim();
  }

  if (description !== undefined) {
    project.description = description.trim();
  }

  if (visibility !== undefined) {
    project.visibility = visibility;
  }

  project.updatedAt = new Date().toISOString();

  const presentedProject = presentProject(
    project,
    request.user.id,
  );

  return response.status(200).json({
    project: presentedProject,
  });
}

export function deleteProject(request, response) {
  const projectIndex = store.projects.findIndex(
    (project) =>
      project.id === request.params.projectId,
  );

  if (projectIndex === -1) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  const project = store.projects[projectIndex];

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.DELETE_PROJECT,
    )
  ) {
    return response.status(403).json({
      message:
        "Only the project owner can delete this project",
    });
  }

  store.projects.splice(projectIndex, 1);

  store.tasks = store.tasks.filter(
    (task) => task.projectId !== project.id,
  );

  store.projectMembers =
    store.projectMembers.filter(
      (membership) =>
        membership.projectId !== project.id,
    );

  store.projectInvitations =
    store.projectInvitations.filter(
      (invitation) =>
        invitation.projectId !== project.id,
    );

  return response.status(204).send();
}