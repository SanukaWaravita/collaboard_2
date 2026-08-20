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
    version,
  } = request.body ?? {};

  const containsUpdate =
    title !== undefined ||
    description !== undefined ||
    status !== undefined;

  if (!containsUpdate) {
    return response.status(400).json({
      message:
        "Provide a title, description, or status to update",
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