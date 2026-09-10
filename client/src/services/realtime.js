import { io } from "socket.io-client";
import { getToken } from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let realtimeSocket = null;

function getRealtimeServerUrl() {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

  return new URL(configuredUrl, window.location.origin).origin;
}

export function getRealtimeSocket() {
  if (!realtimeSocket) {
    realtimeSocket = io(getRealtimeServerUrl(), {
      autoConnect: false,
      auth(callback) {
        callback({ token: getToken() });
      },
    });
  }

  return realtimeSocket;
}

export function disconnectRealtimeSocket() {
  if (!realtimeSocket) {
    return;
  }

  realtimeSocket.disconnect();
  realtimeSocket = null;
}
