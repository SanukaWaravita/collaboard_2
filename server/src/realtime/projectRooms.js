import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { PROJECT_PERMISSIONS } from "../constants/access.js";
import { getAllowedOrigins, isAllowedOrigin } from "../config/cors.js";
import { Project, User } from "../models/index.js";
import { hasDatabaseProjectPermission } from "../utils/databaseProjectAccess.js";

export function getProjectRoom(projectId) {
  return `project:${projectId}`;
}

function acknowledge(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

async function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  const secret = process.env.JWT_SECRET;

  if (!token || typeof token !== "string") {
    next(new Error("Authentication required"));
    return;
  }

  if (!secret) {
    next(new Error("Real-time authentication is not configured"));
    return;
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });
  } catch {
    next(new Error("Invalid or expired token"));
    return;
  }

  if (typeof decodedToken.sub !== "string" || !decodedToken.sub) {
    next(new Error("Invalid or expired token"));
    return;
  }

  try {
    const user = await User.findById(decodedToken.sub);

    if (!user) {
      next(new Error("Invalid or expired token"));
      return;
    }

    socket.data.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch {
    next(new Error("Real-time authentication failed"));
  }
}

async function joinProject(socket, payload, callback) {
  const projectId = payload?.projectId;

  if (typeof projectId !== "string" || !projectId) {
    acknowledge(callback, {
      ok: false,
      message: "A valid Project ID is required",
    });
    return;
  }

  try {
    const project = await Project.findById(projectId);
    const canReadProject =
      project &&
      (await hasDatabaseProjectPermission(
        project,
        socket.data.user.id,
        PROJECT_PERMISSIONS.READ_PROJECT,
      ));

    if (!canReadProject) {
      acknowledge(callback, {
        ok: false,
        message: "Project not found",
      });
      return;
    }

    await socket.join(getProjectRoom(project.id));

    acknowledge(callback, {
      ok: true,
      projectId: project.id,
    });
  } catch {
    acknowledge(callback, {
      ok: false,
      message: "Unable to join real-time Project updates",
    });
  }
}

function leaveProject(socket, payload, callback) {
  const projectId = payload?.projectId;

  if (typeof projectId !== "string" || !projectId) {
    acknowledge(callback, {
      ok: false,
      message: "A valid Project ID is required",
    });
    return;
  }

  void socket.leave(getProjectRoom(projectId));
  acknowledge(callback, { ok: true, projectId });
}

export function initializeRealtimeServer(httpServer, app) {
  const allowedOrigins = getAllowedOrigins();
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin, allowedOrigins)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin is not allowed by CORS"));
      },
    },
    allowRequest(request, callback) {
      callback(
        null,
        isAllowedOrigin(request.headers.origin, allowedOrigins),
      );
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on("project:join", (payload, callback) => {
      void joinProject(socket, payload, callback);
    });

    socket.on("project:leave", (payload, callback) => {
      leaveProject(socket, payload, callback);
    });
  });

  app.set("io", io);

  return io;
}
