import express from "express";
import cors from "cors";
import { authenticateUser } from "./middleware/authMiddleware.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/boards", authenticateUser, boardRoutes);
app.use("/api/tasks", authenticateUser, taskRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;