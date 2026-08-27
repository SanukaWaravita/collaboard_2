import { Router } from "express";
import {
  deleteTask,
  getTask,
  updateTask,
} from "../controllers/taskController.js";

const router = Router();

router.route("/:taskId").get(getTask).patch(updateTask).delete(deleteTask);

export default router;
