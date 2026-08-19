import express from "express";
import cors from "cors";
import { authenticateUser } from "./middleware/authMiddleware.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use(
  "/api/projects",
  authenticateUser,
  projectRoutes,
);

// Temporary compatibility until the React client is renamed.
app.use(
  "/api/boards",
  authenticateUser,
  projectRoutes,
);
app.use("/api/tasks", authenticateUser, taskRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;