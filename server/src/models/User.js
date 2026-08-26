import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  createSchemaOptions,
} from "./schemaOptions.js";

const { Schema, model } = mongoose;

const userSchema = new Schema(
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

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  createSchemaOptions({
    collection: "users",
    timestamps: true,
    hiddenFields: ["passwordHash"],
  }),
);

userSchema.index(
  {
    email: 1,
  },
  {
    unique: true,
    name: "unique_user_email",
  },
);

const User = model("User", userSchema);

export default User;