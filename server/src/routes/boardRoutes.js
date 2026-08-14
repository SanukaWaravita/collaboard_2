import { Router } from "express";
import {
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  updateBoard,
} from "../controllers/boardController.js";
import { createTask } from "../controllers/taskController.js";

const router = Router();

router
  .route("/")
  .get(getBoards)
  .post(createBoard);

router.post("/:boardId/tasks", createTask);

router
  .route("/:boardId")
  .get(getBoard)
  .patch(updateBoard)
  .delete(deleteBoard);

export default router;