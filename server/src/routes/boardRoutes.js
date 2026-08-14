import { Router } from "express";
import {
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  updateBoard,
} from "../controllers/boardController.js";

const router = Router();

router
  .route("/")
  .get(getBoards)
  .post(createBoard);

router
  .route("/:boardId")
  .get(getBoard)
  .patch(updateBoard)
  .delete(deleteBoard);

export default router;
