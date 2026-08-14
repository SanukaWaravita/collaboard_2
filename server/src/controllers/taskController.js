import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";

const allowedStatuses = new Set(["todo", "doing", "done"]);

export function createTask(request, response) {
  const board = store.boards.find(
    (currentBoard) => currentBoard.id === request.params.boardId,
  );

  if (!board) {
    return response.status(404).json({
      message: "Board not found",
    });
  }

  const {
    title,
    description = "",
    status = "todo",
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

  if (!allowedStatuses.has(status)) {
    return response.status(400).json({
      message: "Task status must be todo, doing, or done",
    });
  }

  const timestamp = new Date().toISOString();

  const task = {
    id: randomUUID(),
    boardId: board.id,
    title: title.trim(),
    description: description.trim(),
    status,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.tasks.push(task);

  return response.status(201).json({ task });
}

export function getTask(request, response) {
  const task = store.tasks.find(
    (currentTask) => currentTask.id === request.params.taskId,
  );

  if (!task) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  return response.status(200).json({ task });
}

export function updateTask(request, response) {
  const task = store.tasks.find(
    (currentTask) => currentTask.id === request.params.taskId,
  );

  if (!task) {
    return response.status(404).json({
      message: "Task not found",
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
      message: "Provide a title, description, or status to update",
    });
  }

  if (!Number.isInteger(version) || version < 1) {
    return response.status(400).json({
      message: "A valid task version is required",
    });
  }

  if (version !== task.version) {
    return response.status(409).json({
      message: "Task was modified by another request",
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
    !allowedStatuses.has(status)
  ) {
    return response.status(400).json({
      message: "Task status must be todo, doing, or done",
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
  const taskIndex = store.tasks.findIndex(
    (task) => task.id === request.params.taskId,
  );

  if (taskIndex === -1) {
    return response.status(404).json({
      message: "Task not found",
    });
  }

  store.tasks.splice(taskIndex, 1);

  return response.status(204).send();
}
