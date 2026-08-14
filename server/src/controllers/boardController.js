import { randomUUID } from "node:crypto";
import { store } from "../data/inMemoryStore.js";

function includeTaskCount(board) {
  const taskCount = store.tasks.filter(
    (task) => task.boardId === board.id,
  ).length;

  return {
    ...board,
    taskCount,
  };
}

export function getBoards(request, response) {
  const boards = store.boards.map(includeTaskCount);

  response.status(200).json({ boards });
}

export function createBoard(request, response) {
  const { name, description = "" } = request.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return response.status(400).json({
      message: "Board name is required",
    });
  }

  if (typeof description !== "string") {
    return response.status(400).json({
      message: "Board description must be text",
    });
  }

  const timestamp = new Date().toISOString();

  const board = {
    id: randomUUID(),
    name: name.trim(),
    description: description.trim(),
    ownerId: "temporary-user",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.boards.push(board);

  return response.status(201).json({
    board: includeTaskCount(board),
  });
}

export function getBoard(request, response) {
  const board = store.boards.find(
    (currentBoard) => currentBoard.id === request.params.boardId,
  );

  if (!board) {
    return response.status(404).json({
      message: "Board not found",
    });
  }

  const tasks = store.tasks.filter(
    (task) => task.boardId === board.id,
  );

  return response.status(200).json({
    board: includeTaskCount(board),
    tasks,
  });
}

export function updateBoard(request, response) {
  const board = store.boards.find(
    (currentBoard) => currentBoard.id === request.params.boardId,
  );

  if (!board) {
    return response.status(404).json({
      message: "Board not found",
    });
  }

  const { name, description } = request.body ?? {};

  if (name === undefined && description === undefined) {
    return response.status(400).json({
      message: "Provide a name or description to update",
    });
  }

  if (
    name !== undefined &&
    (typeof name !== "string" || !name.trim())
  ) {
    return response.status(400).json({
      message: "Board name cannot be empty",
    });
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return response.status(400).json({
      message: "Board description must be text",
    });
  }

  if (name !== undefined) {
    board.name = name.trim();
  }

  if (description !== undefined) {
    board.description = description.trim();
  }

  board.updatedAt = new Date().toISOString();

  return response.status(200).json({
    board: includeTaskCount(board),
  });
}

export function deleteBoard(request, response) {
  const boardIndex = store.boards.findIndex(
    (board) => board.id === request.params.boardId,
  );

  if (boardIndex === -1) {
    return response.status(404).json({
      message: "Board not found",
    });
  }

  const [deletedBoard] = store.boards.splice(boardIndex, 1);

  store.tasks = store.tasks.filter(
    (task) => task.boardId !== deletedBoard.id,
  );

  return response.status(204).send();
}
