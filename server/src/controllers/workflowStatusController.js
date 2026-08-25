import { randomUUID } from "node:crypto";
import { PROJECT_PERMISSIONS } from "../constants/access.js";
import { store } from "../data/inMemoryStore.js";
import { getOrderedWorkflowStatuses } from "../utils/workflowStatuses.js";
import { hasProjectPermission } from "../utils/projectAccess.js";

const MAX_WORKFLOW_STATUSES = 12;
const MAX_STATUS_NAME_LENGTH = 40;
const STATUS_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function findProject(projectId) {
  return store.projects.find((project) => project.id === projectId);
}

function findStatus(project, statusId) {
  return project.workflowStatuses?.find((status) => status.id === statusId);
}

function normalizeStatusPositions(project) {
  const orderedStatuses = getOrderedWorkflowStatuses(project);

  orderedStatuses.forEach((status, index) => {
    status.position = index;
  });

  project.workflowStatuses = orderedStatuses;

  return orderedStatuses;
}

function hasDuplicateStatusName(project, name, ignoredStatusId = null) {
  const normalizedName = name.toLowerCase();

  return project.workflowStatuses.some(
    (status) =>
      status.id !== ignoredStatusId &&
      status.name.toLowerCase() === normalizedName,
  );
}

function validateStatusName(name) {
  if (typeof name !== "string" || !name.trim()) {
    return "Status name is required";
  }

  if (name.trim().length > MAX_STATUS_NAME_LENGTH) {
    return `Status name cannot exceed ${MAX_STATUS_NAME_LENGTH} characters`;
  }

  return null;
}

function validateStatusColor(color) {
  if (typeof color !== "string" || !STATUS_COLOR_PATTERN.test(color)) {
    return "Status colour must be a six-digit hexadecimal value";
  }

  return null;
}

function canManageWorkflow(project, userId) {
  return hasProjectPermission(
    project,
    userId,
    PROJECT_PERMISSIONS.UPDATE_PROJECT,
  );
}

export function getWorkflowStatuses(request, response) {
  const project = findProject(request.params.projectId);

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

  return response.status(200).json({
    workflowStatuses: getOrderedWorkflowStatuses(project),
  });
}

export function createWorkflowStatus(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (!canManageWorkflow(project, request.user.id)) {
    return response.status(403).json({
      message: "Only the project owner can manage workflow statuses",
    });
  }

  const { name, color = "#64748b" } = request.body ?? {};

  const nameError = validateStatusName(name);

  if (nameError) {
    return response.status(400).json({
      message: nameError,
    });
  }

  const colorError = validateStatusColor(color);

  if (colorError) {
    return response.status(400).json({
      message: colorError,
    });
  }

  if (project.workflowStatuses.length >= MAX_WORKFLOW_STATUSES) {
    return response.status(409).json({
      message: `A project cannot contain more than ${MAX_WORKFLOW_STATUSES} workflow statuses`,
    });
  }

  const normalizedName = name.trim();

  if (hasDuplicateStatusName(project, normalizedName)) {
    return response.status(409).json({
      message: "A workflow status with that name already exists",
    });
  }

  normalizeStatusPositions(project);

  const firstCompletedStatus = project.workflowStatuses.find(
    (status) => status.isCompleted,
  );

  const newPosition =
    firstCompletedStatus?.position ?? project.workflowStatuses.length;

  project.workflowStatuses.forEach((status) => {
    if (status.position >= newPosition) {
      status.position += 1;
    }
  });

  const workflowStatus = {
    id: randomUUID(),
    name: normalizedName,
    color: color.toLowerCase(),
    position: newPosition,
    isCompleted: false,
  };

  project.workflowStatuses.push(workflowStatus);

  const workflowStatuses = normalizeStatusPositions(project);

  project.updatedAt = new Date().toISOString();

  return response.status(201).json({
    workflowStatus,
    workflowStatuses,
  });
}

export function updateWorkflowStatus(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (!canManageWorkflow(project, request.user.id)) {
    return response.status(403).json({
      message: "Only the project owner can manage workflow statuses",
    });
  }

  const workflowStatus = findStatus(project, request.params.statusId);

  if (!workflowStatus) {
    return response.status(404).json({
      message: "Workflow status not found",
    });
  }

  const { name, color } = request.body ?? {};

  const containsUpdate = name !== undefined || color !== undefined;

  if (!containsUpdate) {
    return response.status(400).json({
      message: "Provide a status name or colour to update",
    });
  }

  if (name !== undefined) {
    const nameError = validateStatusName(name);

    if (nameError) {
      return response.status(400).json({
        message: nameError,
      });
    }

    const normalizedName = name.trim();

    if (hasDuplicateStatusName(project, normalizedName, workflowStatus.id)) {
      return response.status(409).json({
        message: "A workflow status with that name already exists",
      });
    }

    workflowStatus.name = normalizedName;
  }

  if (color !== undefined) {
    const colorError = validateStatusColor(color);

    if (colorError) {
      return response.status(400).json({
        message: colorError,
      });
    }

    workflowStatus.color = color.toLowerCase();
  }

  project.updatedAt = new Date().toISOString();

  return response.status(200).json({
    workflowStatus,
    workflowStatuses: getOrderedWorkflowStatuses(project),
  });
}

export function reorderWorkflowStatuses(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (!canManageWorkflow(project, request.user.id)) {
    return response.status(403).json({
      message: "Only the project owner can reorder workflow statuses",
    });
  }

  const { statusIds } = request.body ?? {};

  if (!Array.isArray(statusIds)) {
    return response.status(400).json({
      message: "statusIds must be an ordered array",
    });
  }

  if (statusIds.length !== project.workflowStatuses.length) {
    return response.status(400).json({
      message: "The complete workflow status order is required",
    });
  }

  if (statusIds.some((statusId) => typeof statusId !== "string" || !statusId)) {
    return response.status(400).json({
      message: "Every workflow status identifier must be text",
    });
  }

  const uniqueStatusIds = new Set(statusIds);

  if (uniqueStatusIds.size !== statusIds.length) {
    return response.status(400).json({
      message: "Workflow status identifiers cannot be duplicated",
    });
  }

  const statusesById = new Map(
    project.workflowStatuses.map((status) => [status.id, status]),
  );

  const containsUnknownStatus = statusIds.some(
    (statusId) => !statusesById.has(statusId),
  );

  if (containsUnknownStatus) {
    return response.status(400).json({
      message: "Every status must belong to this project",
    });
  }

  const reorderedStatuses = statusIds.map((statusId) =>
    statusesById.get(statusId),
  );

  let completedStatusFound = false;
  let activeStatusAfterCompleted = false;

  reorderedStatuses.forEach((status) => {
    if (status.isCompleted) {
      completedStatusFound = true;
      return;
    }

    if (completedStatusFound) {
      activeStatusAfterCompleted = true;
    }
  });

  if (activeStatusAfterCompleted) {
    return response.status(400).json({
      message: "Completed statuses must remain after active statuses",
    });
  }

  reorderedStatuses.forEach((status, index) => {
    status.position = index;
  });

  project.workflowStatuses = reorderedStatuses;
  project.updatedAt = new Date().toISOString();

  return response.status(200).json({
    workflowStatuses: reorderedStatuses,
  });
}

export function deleteWorkflowStatus(request, response) {
  const project = findProject(request.params.projectId);

  if (!project) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (!canManageWorkflow(project, request.user.id)) {
    return response.status(403).json({
      message: "Only the project owner can manage workflow statuses",
    });
  }

  const workflowStatus = findStatus(project, request.params.statusId);

  if (!workflowStatus) {
    return response.status(404).json({
      message: "Workflow status not found",
    });
  }

  if (project.workflowStatuses.length === 1) {
    return response.status(409).json({
      message: "A project must contain at least one workflow status",
    });
  }

  const otherCompletedStatus = project.workflowStatuses.find(
    (status) => status.id !== workflowStatus.id && status.isCompleted,
  );

  if (workflowStatus.isCompleted && !otherCompletedStatus) {
    return response.status(409).json({
      message: "The project's only completed status cannot be deleted",
    });
  }

  const { replacementStatusId } = request.body ?? {};

  let replacementStatus = null;

  if (replacementStatusId !== undefined) {
    replacementStatus = findStatus(project, replacementStatusId);

    if (!replacementStatus || replacementStatus.id === workflowStatus.id) {
      return response.status(400).json({
        message: "Replacement status must be another status in this project",
      });
    }
  }

  const affectedTasks = store.tasks.filter(
    (task) =>
      task.projectId === project.id && task.status === workflowStatus.id,
  );

  if (affectedTasks.length > 0 && !replacementStatus) {
    return response.status(409).json({
      message: "Move the status's tasks before deleting it",
      taskCount: affectedTasks.length,
    });
  }

  const timestamp = new Date().toISOString();

  affectedTasks.forEach((task) => {
    task.status = replacementStatus.id;
    task.version += 1;
    task.updatedAt = timestamp;
  });

  project.workflowStatuses = project.workflowStatuses.filter(
    (status) => status.id !== workflowStatus.id,
  );

  const workflowStatuses = normalizeStatusPositions(project);

  project.updatedAt = timestamp;

  return response.status(200).json({
    deletedStatusId: workflowStatus.id,
    replacementStatusId: replacementStatus?.id ?? null,
    movedTaskCount: affectedTasks.length,
    workflowStatuses,
  });
}
