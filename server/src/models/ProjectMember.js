import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  PROJECT_ROLES,
} from "../constants/access.js";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const projectMemberSchema = new Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },

    projectId: {
      type: String,
      ref: "Project",
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
        PROJECT_ROLES,
      ),
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  createSchemaOptions({
    collection: "project_members",
  }),
);

projectMemberSchema.index(
  {
    projectId: 1,
    userId: 1,
  },
  {
    unique: true,
    name: "unique_project_membership",
  },
);

projectMemberSchema.index(
  {
    userId: 1,
    role: 1,
  },
  {
    name: "user_project_access",
  },
);

const ProjectMember = model(
  "ProjectMember",
  projectMemberSchema,
);

export default ProjectMember;