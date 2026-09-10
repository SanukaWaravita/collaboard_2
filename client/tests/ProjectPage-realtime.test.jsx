import { beforeEach, expect, jest, test } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

const listeners = new Map();
let remoteTask = null;
let connectImmediately = true;

const apiRequest = jest.fn(async (path) => {
  if (path === "/projects/p1") {
    return {
      project: {
        id: "p1",
        workspaceId: "w1",
        name: "Realtime Project",
        projectKey: "RT",
        visibility: "private",
        currentUserRole: "REVIEWER",
        permissions: ["READ_PROJECT"],
        workflowStatuses: [
          {
            id: "todo",
            name: "To Do",
            color: "#64748b",
            position: 0,
            isCompleted: false,
          },
          {
            id: "done",
            name: "Done",
            color: "#16a34a",
            position: 1,
            isCompleted: true,
          },
        ],
      },
      tasks: [],
    };
  }

  if (path === "/projects/p1/members") {
    return { members: [] };
  }

  if (path.startsWith("/tasks/") && remoteTask) {
    return { task: { ...remoteTask } };
  }

  const error = new Error("Task not found");
  error.status = 404;
  throw error;
});

const socket = {
  connected: false,
  on: jest.fn((eventName, listener) => {
    const eventListeners = listeners.get(eventName) ?? new Set();
    eventListeners.add(listener);
    listeners.set(eventName, eventListeners);
    return socket;
  }),
  off: jest.fn((eventName, listener) => {
    listeners.get(eventName)?.delete(listener);
    return socket;
  }),
  emit: jest.fn((eventName, _payload, callback) => {
    if (eventName === "project:join") {
      callback?.({ ok: true, projectId: "p1" });
    }
    return socket;
  }),
  connect: jest.fn(() => {
    if (connectImmediately) {
      socket.connected = true;
      listeners.get("connect")?.forEach((listener) => listener());
    }

    return socket;
  }),
};

jest.unstable_mockModule("../src/services/api", () => ({
  apiRequest,
  clearSession: jest.fn(),
  getCurrentUser: () => ({
    id: "reviewer",
    name: "Project Reviewer",
    email: "reviewer@example.com",
  }),
}));

jest.unstable_mockModule("../src/services/realtime", () => ({
  getRealtimeSocket: () => socket,
  disconnectRealtimeSocket: jest.fn(() => {
    socket.connected = false;
  }),
}));

const { default: ProjectPage } = await import(
  "../src/pages/ProjectPage.jsx"
);

beforeEach(() => {
  listeners.clear();
  remoteTask = null;
  connectImmediately = true;
  socket.connected = false;
});

async function sendServerEvent(eventName, payload) {
  await act(async () => {
    await Promise.all(
      [...(listeners.get(eventName) ?? [])].map((listener) =>
        listener(payload),
      ),
    );
  });
}

test("applies remote Task creation, update, movement, and deletion", async () => {
  render(
    <MemoryRouter initialEntries={["/workspaces/w1/projects/p1"]}>
      <Routes>
        <Route
          path="/workspaces/:workspaceId/projects/:projectId"
          element={<ProjectPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Realtime Project" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("Live")).toBeInTheDocument();

  remoteTask = {
    id: "task-remote",
    projectId: "p1",
    title: "Created remotely",
    description: "",
    status: "todo",
    dueDate: null,
    assigneeIds: [],
    reporterId: "reviewer",
    reporter: { name: "Project Reviewer" },
    version: 1,
    canAssignReporter: false,
  };

  await sendServerEvent("task:created", {
    projectId: "p1",
    taskId: "task-remote",
    version: 1,
  });
  expect(screen.getByText("Created remotely")).toBeInTheDocument();

  remoteTask = {
    ...remoteTask,
    title: "Updated remotely",
    status: "done",
    version: 2,
  };

  await sendServerEvent("task:updated", {
    projectId: "p1",
    taskId: "task-remote",
    version: 2,
  });
  expect(screen.getByText("Updated remotely")).toBeInTheDocument();
  expect(screen.queryByText("Created remotely")).not.toBeInTheDocument();

  await sendServerEvent("task:deleted", {
    projectId: "p1",
    taskId: "task-remote",
    version: 2,
  });
  expect(screen.queryByText("Updated remotely")).not.toBeInTheDocument();
});

test("shows connection loss and returns to Live after reconnecting", async () => {
  connectImmediately = false;

  render(
    <MemoryRouter initialEntries={["/workspaces/w1/projects/p1"]}>
      <Routes>
        <Route
          path="/workspaces/:workspaceId/projects/:projectId"
          element={<ProjectPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Realtime Project" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("Connecting")).toBeInTheDocument();

  socket.connected = true;
  await sendServerEvent("connect");
  expect(await screen.findByText("Live")).toBeInTheDocument();

  socket.connected = false;
  await sendServerEvent("disconnect", "transport close");
  expect(await screen.findByText("Reconnecting")).toBeInTheDocument();

  socket.connected = true;
  await sendServerEvent("connect");
  expect(await screen.findByText("Live")).toBeInTheDocument();

  const projectJoinCalls = socket.emit.mock.calls.filter(
    ([eventName]) => eventName === "project:join",
  );
  expect(projectJoinCalls).toHaveLength(2);
  expect(projectJoinCalls[0][1]).toEqual({ projectId: "p1" });
  expect(projectJoinCalls[1][1]).toEqual({ projectId: "p1" });
});

test("shows Offline after a connection error and recovers", async () => {
  connectImmediately = false;

  render(
    <MemoryRouter initialEntries={["/workspaces/w1/projects/p1"]}>
      <Routes>
        <Route
          path="/workspaces/:workspaceId/projects/:projectId"
          element={<ProjectPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Realtime Project" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("Connecting")).toBeInTheDocument();

  await sendServerEvent("connect_error", new Error("network unavailable"));
  expect(await screen.findByText("Offline")).toBeInTheDocument();

  socket.connected = true;
  await sendServerEvent("connect");
  expect(await screen.findByText("Live")).toBeInTheDocument();
});
