import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "../controllers/projectController.js";
import { createTask } from "../controllers/taskController.js";
import {
  cancelProjectInvitation,
  getProjectInvitations,
  inviteProjectMember,
} from "../controllers/invitationController.js";
import {
  getProjectMembers,
  removeProjectMember,
  transferProjectOwnership,
  updateProjectMember,
} from "../controllers/projectMemberController.js";
import {
  createWorkflowStatus,
  deleteWorkflowStatus,
  getWorkflowStatuses,
  reorderWorkflowStatuses,
  updateWorkflowStatus,
} from "../controllers/workflowStatusController.js";

const router = Router();

router.route("/").get(getProjects).post(createProject);

router.get("/:projectId/members", getProjectMembers);

router.patch("/:projectId/members/:userId", updateProjectMember);

router.delete("/:projectId/members/:userId", removeProjectMember);

router.post("/:projectId/transfer-ownership", transferProjectOwnership);

router
  .route("/:projectId/invitations")
  .get(getProjectInvitations)
  .post(inviteProjectMember);

router.delete("/:projectId/invitations/:invitationId", cancelProjectInvitation);

router
  .route("/:projectId/statuses")
  .get(getWorkflowStatuses)
  .post(createWorkflowStatus);

router.put("/:projectId/statuses/order", reorderWorkflowStatuses);

router
  .route("/:projectId/statuses/:statusId")
  .patch(updateWorkflowStatus)
  .delete(deleteWorkflowStatus);

router
  .route("/:projectId")
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

router.post("/:projectId/tasks", createTask);

export default router;
