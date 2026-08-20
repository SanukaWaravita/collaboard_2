import { Router } from "express";
import {
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
} from "../controllers/invitationController.js";

const router = Router();

router.get("/", getMyInvitations);

router.post(
  "/:invitationId/accept",
  acceptInvitation,
);

router.post(
  "/:invitationId/decline",
  declineInvitation,
);

export default router;