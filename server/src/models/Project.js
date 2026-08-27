import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  PROJECT_VISIBILITY,
} from "../constants/access.js";
import {
  createDefaultWorkflowStatuses,
} from "../utils/workflowStatuses.js";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const workflowStatusSchema = new Schema(
  {
    id: {
      type: String,
      default: randomUUID,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    color: {
      type: String,
      required: true,
      lowercase: true,
      match: /^#[0-9a-fA-F]{6}$/,
    },

    position: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message:
          "Workflow position must be an integer",
      },
    },

    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const projectSchema = new Schema(
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

    projectKey: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 10,
      match: /^[A-Z][A-Z0-9]{1,9}$/,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    visibility: {
      type: String,
      required: true,
      enum: Object.values(
        PROJECT_VISIBILITY,
      ),
      default: PROJECT_VISIBILITY.PRIVATE,
    },

    ownerId: {
      type: String,
      ref: "User",
      required: true,
    },

    workflowStatuses: {
      type: [workflowStatusSchema],
      default: createDefaultWorkflowStatuses,

      validate: {
        validator(workflowStatuses) {
          return (
            workflowStatuses.length >= 1 &&
            workflowStatuses.length <= 12
          );
        },

        message:
          "A Project must contain between 1 and 12 workflow statuses",
      },
    },
  },
  createSchemaOptions({
    collection: "projects",
    timestamps: true,
  }),
);

projectSchema.index(
  {
    workspaceId: 1,
    projectKey: 1,
  },
  {
    unique: true,
    name: "unique_workspace_project_key",
  },
);

projectSchema.index(
  {
    workspaceId: 1,
    visibility: 1,
  },
  {
    name: "workspace_project_visibility",
  },
);

projectSchema.index(
  {
    ownerId: 1,
  },
  {
    name: "project_owner",
  },
);

const Project = model(
  "Project",
  projectSchema,
);

export default Project;