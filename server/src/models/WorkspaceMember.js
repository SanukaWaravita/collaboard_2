import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const workspaceMemberSchema = new Schema(
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

    userId: {
      type: String,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: Object.values(
        WORKSPACE_ROLES,
      ),
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  createSchemaOptions({
    collection: "workspace_members",
  }),
);

workspaceMemberSchema.index(
  {
    workspaceId: 1,
    userId: 1,
  },
  {
    unique: true,
    name: "unique_workspace_membership",
  },
);

workspaceMemberSchema.index(
  {
    userId: 1,
    role: 1,
  },
  {
    name: "user_workspace_access",
  },
);

const WorkspaceMember = model(
  "WorkspaceMember",
  workspaceMemberSchema,
);

export default WorkspaceMember;