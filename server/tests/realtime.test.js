import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { io as createClient } from "socket.io-client";

const findProjectById = jest.fn();
const findUserById = jest.fn();
const hasDatabaseProjectPermission = jest.fn();

jest.unstable_mockModule("../src/models/index.js", () => ({
  Project: { findById: findProjectById },
  User: { findById: findUserById },
}));

jest.unstable_mockModule(
  "../src/utils/databaseProjectAccess.js",
  () => ({ hasDatabaseProjectPermission }),
);

const { initializeRealtimeServer } = await import(
  "../src/realtime/projectRooms.js"
);
const { emitTaskEvent, TASK_REALTIME_EVENTS } = await import(
  "../src/realtime/taskEvents.js"
);

const appSettings = new Map();
const app = {
  get(key) {
    return appSettings.get(key);
  },
  set(key, value) {
    appSettings.set(key, value);
  },
};

let httpServer;
let io;
let serverUrl;

function tokenFor(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });
}

function waitForConnection(socket) {
  return new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
}

function waitForConnectionError(socket) {
  return new Promise((resolve) => {
    socket.once("connect_error", resolve);
  });
}

function waitForEvent(socket, eventName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 3000);

    socket.once(eventName, (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

function joinProject(socket, projectId) {
  return new Promise((resolve) => {
    socket.emit("project:join", { projectId }, resolve);
  });
}

function connect(token) {
  return createClient(serverUrl, {
    auth: token ? { token } : {},
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
  });
}

beforeAll(async () => {
  httpServer = createServer();
  io = initializeRealtimeServer(httpServer, app);

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  serverUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  appSettings.clear();

  await new Promise((resolve) => {
    io.close(resolve);
  });
});

beforeEach(() => {
  findUserById.mockImplementation(async (userId) => ({
    id: userId,
    name: `User ${userId}`,
    email: `${userId}@example.com`,
  }));
  findProjectById.mockImplementation(async (projectId) =>
    projectId === "project"
      ? { id: "project", workspaceId: "workspace" }
      : null,
  );
  hasDatabaseProjectPermission.mockImplementation(
    async (_project, userId) => userId !== "outsider",
  );
});

describe("Authenticated real-time Project rooms", () => {
  test("rejects a socket connection without a bearer token", async () => {
    const socket = connect();
    const error = await waitForConnectionError(socket);

    expect(error.message).toBe("Authentication required");
    socket.disconnect();
  });

  test("allows readers to join but hides the Project from outsiders", async () => {
    const reviewerSocket = connect(tokenFor("reviewer"));
    const outsiderSocket = connect(tokenFor("outsider"));

    await Promise.all([
      waitForConnection(reviewerSocket),
      waitForConnection(outsiderSocket),
    ]);

    await expect(joinProject(reviewerSocket, "project")).resolves.toEqual({
      ok: true,
      projectId: "project",
    });
    await expect(joinProject(outsiderSocket, "project")).resolves.toEqual({
      ok: false,
      message: "Project not found",
    });

    reviewerSocket.disconnect();
    outsiderSocket.disconnect();
  });

  test("broadcasts permission-safe Task invalidations to the Project room", async () => {
    const socket = connect(tokenFor("reviewer"));
    await waitForConnection(socket);
    await joinProject(socket, "project");

    const createdEvent = waitForEvent(
      socket,
      TASK_REALTIME_EVENTS.CREATED,
    );

    emitTaskEvent(
      { app },
      TASK_REALTIME_EVENTS.CREATED,
      {
        id: "task-1",
        projectId: "project",
        title: "Sensitive Task title",
        version: 1,
      },
    );

    await expect(createdEvent).resolves.toEqual({
      projectId: "project",
      taskId: "task-1",
      version: 1,
    });

    socket.disconnect();
  });
});
