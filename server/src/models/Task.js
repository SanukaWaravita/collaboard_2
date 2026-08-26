import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const taskSchema = new Schema(
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      required: true,
      trim: true,
    },

    dueDate: {
      type: String,
      default: null,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    assigneeIds: {
      type: [
        {
          type: String,
          ref: "User",
        },
      ],

      default: [],

      validate: {
        validator(assigneeIds) {
          return (
            new Set(assigneeIds).size ===
            assigneeIds.length
          );
        },

        message:
          "Task Assignee IDs cannot be duplicated",
      },
    },

    createdById: {
      type: String,
      ref: "User",
      required: true,
      immutable: true,
    },

    reporterId: {
      type: String,
      ref: "User",
      required: true,
    },

    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,

      validate: {
        validator: Number.isInteger,
        message:
          "Task version must be an integer",
      },
    },
  },
  createSchemaOptions({
    collection: "tasks",
    timestamps: true,
  }),
);

taskSchema.index(
  {
    projectId: 1,
    status: 1,
  },
  {
    name: "project_workflow_tasks",
  },
);

taskSchema.index(
  {
    projectId: 1,
    assigneeIds: 1,
  },
  {
    name: "project_assignee_tasks",
  },
);

taskSchema.index(
  {
    projectId: 1,
    reporterId: 1,
  },
  {
    name: "project_reporter_tasks",
  },
);

taskSchema.index(
  {
    projectId: 1,
    updatedAt: -1,
  },
  {
    name: "recent_project_tasks",
  },
);

const Task = model("Task", taskSchema);

export default Task;