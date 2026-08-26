import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  INVITATION_STATUS,
  MEMBER_TYPES,
  PROJECT_ROLES,
} from "../constants/access.js";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const projectInvitationSchema = new Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },

    workspaceId: {
      type: String,
      ref: "Workspace",
      required: true,
    },

    projectId: {
      type: String,
      ref: "Project",
      required: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    role: {
      type: String,
      required: true,
      enum: [
        PROJECT_ROLES.CONTRIBUTOR,
        PROJECT_ROLES.REVIEWER,
      ],
    },

    memberType: {
      type: String,
      required: true,
      enum: Object.values(
        MEMBER_TYPES,
      ),
    },

    status: {
      type: String,
      required: true,
      enum: Object.values(
        INVITATION_STATUS,
      ),
      default: INVITATION_STATUS.PENDING,
    },

    invitedById: {
      type: String,
      ref: "User",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  createSchemaOptions({
    collection: "project_invitations",
  }),
);

projectInvitationSchema.index(
  {
    projectId: 1,
    email: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      status: INVITATION_STATUS.PENDING,
    },

    name: "unique_pending_project_invitation",
  },
);

projectInvitationSchema.index(
  {
    email: 1,
    status: 1,
  },
  {
    name: "user_pending_invitations",
  },
);

projectInvitationSchema.index(
  {
    workspaceId: 1,
    status: 1,
  },
  {
    name: "workspace_invitations",
  },
);

const ProjectInvitation = model(
  "ProjectInvitation",
  projectInvitationSchema,
);

export default ProjectInvitation;