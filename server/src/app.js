import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import boardRoutes from "./routes/boardRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;