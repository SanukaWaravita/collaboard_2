import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";
import { PROJECT_PERMISSIONS } from "../constants/access.js";
import {
  getProjectAccess,
  hasProjectPermission,
} from "../utils/projectAccess.js";
import {
  findWorkflowStatus,
  getInitialWorkflowStatus,
} from "../utils/workflowStatuses.js";
import {
  isValidDueDate,
  normalizeDueDate,
} from "../utils/taskDueDate.js";
import {
  findAssignableProjectMember,
  isValidAssigneeIdValue,
  normalizeAssigneeId,
} from "../utils/taskAssignee.js";

function findTaskAndProject(taskId) {
  const task = store.tasks.find(
    (currentTask) => currentTask.id === taskId,
  );

  if (!task) {
    return null;
  }

  const project = store.projects.find(
    (currentProject) =>
      currentProject.id === task.projectId,
  );

  return project ? { task, project } : null;
}

export function createTask(request, response) {
  const project = store.projects.find(
    (currentProject) =>
      currentProject.id === request.params.projectId,
  );

  if (
    !project ||
    !getProjectAccess(project, request.user.id)
  ) {
    return response.status(404).json({
      message: "Project not found",
    });
  }

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.CREATE_TASK,
    )
  ) {
    return response.status(403).json({
      message:
        "You cannot create tasks in this project",
    });
  }

  const {
  title,
  description = "",
  status,
  dueDate = null,
  assigneeId = null,
} = request.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    return response.status(400).json({
      message: "Task title is required",
    });
  }

  if (typeof description !== "string") {
    return response.status(400).json({
      message: "Task description must be text",
    });
  }

  if (!isValidDueDate(dueDate)) {
  return response.status(400).json({
    message:
      "Due date must use YYYY-MM-DD format or be null",
  });
}

if (!isValidAssigneeIdValue(assigneeId)) {
  return response.status(400).json({
    message:
      "Assignee must be a user ID or null",
  });
}

const normalizedAssigneeId =
  normalizeAssigneeId(assigneeId);

if (
  normalizedAssigneeId &&
  !findAssignableProjectMember(
    project.id,
    normalizedAssigneeId,
  )
) {
  return response.status(400).json({
    message:
      "Assignee must be an owner or contributor in this project",
  });
}

  const selectedStatus =
    status === undefined
      ? getInitialWorkflowStatus(project)
      : findWorkflowStatus(project, status);

  if (!selectedStatus) {
    return response.status(400).json({
      message:
        status === undefined
          ? "Project does not have a workflow status"
          : "Task status does not exist in this project",
    });
  }

  const timestamp = new Date().toISOString();

  const task = {
    id: randomUUID(),
    projectId: project.id,
    title: title.trim(),
    description: description.trim(),
    status: selectedStatus.id,
    dueDate: normalizeDueDate(dueDate),
    assigneeId: normalizedAssigneeId,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.tasks.push(task);

  return response.status(201).json({ task });
}

export function getTask(request, response) {
  const result = findTaskAndProject(
    request.params.taskId,
  );

  if (
    !result ||
    !hasProjectPermission(
      result.project,
      request.user.id,
      PROJECT_PERMISSIONS.READ_PROJECT,
    )
  ) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  return response.status(200).json({
    task: result.task,
  });
}

export function updateTask(request, response) {
  const result = findTaskAndProject(
    request.params.taskId,
  );

  if (!result) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  const { task, project } = result;

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.UPDATE_TASK,
    )
  ) {
    return response.status(403).json({
      message:
        "You cannot edit tasks in this project",
    });
  }

  const {
  title,
  description,
  status,
  dueDate,
  assigneeId,
  version,
} = request.body ?? {};

  const containsUpdate =
  title !== undefined ||
  description !== undefined ||
  status !== undefined ||
  dueDate !== undefined ||
  assigneeId !== undefined;

  if (!containsUpdate) {
    return response.status(400).json({
      message:
        "Provide a title, description, status, Due Date, or Assignee to update",
    });
  }

  if (!Number.isInteger(version) || version < 1) {
    return response.status(400).json({
      message: "A valid task version is required",
    });
  }

  if (version !== task.version) {
    return response.status(409).json({
      message:
        "Task was modified by another request",
      task,
    });
  }

  if (
    title !== undefined &&
    (typeof title !== "string" || !title.trim())
  ) {
    return response.status(400).json({
      message: "Task title cannot be empty",
    });
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return response.status(400).json({
      message: "Task description must be text",
    });
  }

  if (
  dueDate !== undefined &&
  !isValidDueDate(dueDate)
) {
  return response.status(400).json({
    message:
      "Due date must use YYYY-MM-DD format or be null",
  });
}

let normalizedAssigneeId;

if (assigneeId !== undefined) {
  if (!isValidAssigneeIdValue(assigneeId)) {
    return response.status(400).json({
      message:
        "Assignee must be a user ID or null",
    });
  }

  normalizedAssigneeId =
    normalizeAssigneeId(assigneeId);

  if (
    normalizedAssigneeId &&
    !findAssignableProjectMember(
      project.id,
      normalizedAssigneeId,
    )
  ) {
    return response.status(400).json({
      message:
        "Assignee must be an owner or contributor in this project",
    });
  }
}

  if (
    status !== undefined &&
    !findWorkflowStatus(project, status)
  ) {
    return response.status(400).json({
      message:
        "Task status does not exist in this project",
    });
  }

  if (title !== undefined) {
    task.title = title.trim();
  }

  if (description !== undefined) {
    task.description = description.trim();
  }

  if (status !== undefined) {
    task.status = status;
  }

  if (dueDate !== undefined) {
  task.dueDate = normalizeDueDate(dueDate);
}

if (assigneeId !== undefined) {
  task.assigneeId = normalizedAssigneeId;
}

task.version += 1;
  task.updatedAt = new Date().toISOString();

  return response.status(200).json({ task });
}

export function deleteTask(request, response) {
  const result = findTaskAndProject(
    request.params.taskId,
  );

  if (!result) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  const { task, project } = result;

  if (
    !hasProjectPermission(
      project,
      request.user.id,
      PROJECT_PERMISSIONS.DELETE_TASK,
    )
  ) {
    return response.status(403).json({
      message:
        "You cannot delete tasks in this project",
    });
  }

  const taskIndex = store.tasks.findIndex(
    (currentTask) =>
      currentTask.id === task.id,
  );

  store.tasks.splice(taskIndex, 1);

  return response.status(204).send();
}