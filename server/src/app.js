import express from "express";
import cors from "cors";
import boardRoutes from "./routes/boardRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/boards", boardRoutes);

app.use((request, response) => {
  response.status(404).json({
    message: `Route ${request.method} ${request.originalUrl} not found`,
  });
});

export default app;