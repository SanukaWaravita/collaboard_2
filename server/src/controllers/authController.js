import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { store } from "../data/inMemoryStore.js";

function createToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error("JWT secret is not configured");
    error.status = 500;
    throw error;
  }

  return jwt.sign({}, secret, {
    subject: userId,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

function createPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerUser(request, response) {
  const { name, email, password } = request.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return response.status(400).json({
      message: "Name is required",
    });
  }

  if (
    typeof email !== "string" ||
    !isValidEmail(email.trim())
  ) {
    return response.status(400).json({
      message: "A valid email address is required",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    return response.status(400).json({
      message: "Password must contain at least 8 characters",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = store.users.find(
    (user) => user.email === normalizedEmail,
  );

  if (existingUser) {
    return response.status(409).json({
      message: "An account with this email already exists",
    });
  }

  const timestamp = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

    if (store.users.length === 0) {
    store.boards.forEach((board) => {
      if (board.ownerId === "temporary-user") {
        board.ownerId = user.id;
      }
    });
  }

  store.users.push(user);

  return response.status(201).json({
    token: createToken(user.id),
    user: createPublicUser(user),
  });
}

export async function loginUser(request, response) {
  const { email, password } = request.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return response.status(400).json({
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = store.users.find(
    (currentUser) => currentUser.email === normalizedEmail,
  );

  if (!user) {
    return response.status(401).json({
      message: "Invalid email or password",
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return response.status(401).json({
      message: "Invalid email or password",
    });
  }

  return response.status(200).json({
    token: createToken(user.id),
    user: createPublicUser(user),
  });
}
