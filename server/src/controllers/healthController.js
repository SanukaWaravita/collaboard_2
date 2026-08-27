import {
  isDatabaseConnected,
} from "../config/database.js";

export function getHealth(request, response) {
  const databaseConnected =
    isDatabaseConnected();

  return response
    .status(databaseConnected ? 200 : 503)
    .json({
      status: databaseConnected
        ? "ok"
        : "unavailable",
      message: databaseConnected
        ? "CollaBoard API is running"
        : "CollaBoard API cannot reach MongoDB",
      database: databaseConnected
        ? "connected"
        : "disconnected",
      timestamp: new Date().toISOString(),
    });
}