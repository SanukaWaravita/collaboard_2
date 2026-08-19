import { Router } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceGuests,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspaceController.js";
import {
  createProject,
  getProjects,
} from "../controllers/projectController.js";

const router = Router();

router
  .route("/")
  .get(getWorkspaces)
  .post(createWorkspace);

router
  .route("/:workspaceId/projects")
  .get(getProjects)
  .post(createProject);

router.get(
  "/:workspaceId/guests",
  getWorkspaceGuests,
);

router
  .route("/:workspaceId")
  .get(getWorkspace)
  .patch(updateWorkspace)
  .delete(deleteWorkspace);

export default router;