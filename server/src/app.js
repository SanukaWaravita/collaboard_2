import express from "express";
import cors from "cors";
import { authenticateUser } from "./middleware/authMiddleware.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function normalizeOrigin(value) {
  return value
    .trim()
    .replace(/\/+$/, "");
}

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.CORS_ALLOWED_ORIGINS
      ?.split(",")
      .map(normalizeOrigin)
      .filter(Boolean) ?? [];

  return new Set(
    configuredOrigins.length > 0
      ? configuredOrigins
      : DEFAULT_ALLOWED_ORIGINS,
  );
}

const allowedOrigins = getAllowedOrigins();

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(
          normalizeOrigin(origin),
        )
      ) {
        callback(null, true);
        return;
      }

      const error = new Error(
        "Origin is not allowed by CORS",
      );

      error.status = 403;

      callback(error);
    },
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use(
  "/api/workspaces",
  authenticateUser,
  workspaceRoutes,
);
app.use(
  "/api/projects",
  authenticateUser,
  projectRoutes,
);
app.use(
  "/api/invitations",
  authenticateUser,
  invitationRoutes,
);
app.use(
  "/api/tasks",
  authenticateUser,
  taskRoutes,
);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;