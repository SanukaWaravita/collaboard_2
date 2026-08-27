import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const workspaceSchema = new Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    ownerId: {
      type: String,
      ref: "User",
      required: true,
    },
  },
  createSchemaOptions({
    collection: "workspaces",
    timestamps: true,
  }),
);

workspaceSchema.index(
  {
    slug: 1,
  },
  {
    unique: true,
    name: "unique_workspace_slug",
  },
);

workspaceSchema.index(
  {
    ownerId: 1,
  },
  {
    name: "workspace_owner",
  },
);

const Workspace = model(
  "Workspace",
  workspaceSchema,
);

export default Workspace;