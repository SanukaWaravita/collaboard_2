import "dotenv/config";
import "./models/index.js";
import app from "./app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

const port = process.env.PORT || 5000;

let server = null;
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `${signal} received. Shutting down...`,
  );

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await disconnectDatabase();

    console.log("Server shutdown complete.");

    process.exit(0);
  } catch (error) {
    console.error(
      "Server shutdown failed:",
      error.message,
    );

    process.exit(1);
  }
}

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(port, () => {
      console.log(
        `CollaBoard API running at http://localhost:${port}`,
      );
    });

    process.once("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error(
      "CollaBoard API failed to start:",
      error.message,
    );

    process.exit(1);
  }
}

void startServer();