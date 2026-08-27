import { Router } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspaceController.js";
import {
  createProject,
  getProjects,
} from "../controllers/projectController.js";
import {
  getWorkspaceMembers,
  removeWorkspaceMember,
  removeWorkspaceMemberProjectAccess,
  setWorkspaceMemberProjectAccess,
  updateWorkspaceMemberRole,
} from "../controllers/workspaceMemberController.js";
import {
  cancelWorkspaceInvitation,
  inviteWorkspaceProjectMembers,
} from "../controllers/invitationController.js";

const router = Router();

router.route("/").get(getWorkspaces).post(createWorkspace);

router.route("/:workspaceId/projects").get(getProjects).post(createProject);

router.get("/:workspaceId/members", getWorkspaceMembers);

router
  .route("/:workspaceId/members/:userId")
  .patch(updateWorkspaceMemberRole)
  .delete(removeWorkspaceMember);

router
  .route("/:workspaceId/members/:userId/projects/:projectId")
  .put(setWorkspaceMemberProjectAccess)
  .delete(removeWorkspaceMemberProjectAccess);

router.post("/:workspaceId/invitations", inviteWorkspaceProjectMembers);

router.delete(
  "/:workspaceId/invitations/:invitationId",
  cancelWorkspaceInvitation,
);

router
  .route("/:workspaceId")
  .get(getWorkspace)
  .patch(updateWorkspace)
  .delete(deleteWorkspace);

export default router;
