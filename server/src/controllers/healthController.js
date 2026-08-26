import {
  isDatabaseConnected,
} from "../config/database.js";

export function getHealth(_request, response) {
  const databaseConnected =
    isDatabaseConnected();

  return response
    .status(databaseConnected ? 200 : 503)
    .json({
      status: databaseConnected
        ? "ok"
        : "unavailable",
      database: databaseConnected
        ? "connected"
        : "disconnected",
    });
}