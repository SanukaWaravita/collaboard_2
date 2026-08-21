import {
  createDefaultWorkflowStatuses,
} from "../utils/workflowStatuses.js";

export const store = {
  users: [],

  workspaces: [
    {
      id: "collaboard-workspace",
      name: "CollaBoard Workspace",
      slug: "collaboard-workspace",
      ownerId: "temporary-user",
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
  ],

  workspaceMembers: [],

  projects: [
    {
      id: "collabboard-development",
      workspaceId: "collaboard-workspace",
      projectKey: "CBD",
      name: "CollaBoard Development",
      description:
        "Plan and monitor the development of the group project.",
      visibility: "open",
      ownerId: "temporary-user",
      workflowStatuses: createDefaultWorkflowStatuses(),
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
    {
      id: "m1-planning",
      workspaceId: "collaboard-workspace",
      projectKey: "M1",
      name: "Milestone 1 Planning",
      description:
        "Track the interface, documentation, and repository setup.",
      visibility: "private",
      ownerId: "temporary-user",
      workflowStatuses: createDefaultWorkflowStatuses(),
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
  ],

  projectMembers: [],

  projectInvitations: [],

  tasks: [
    {
      id: "task-1",
      projectId: "collabboard-development",
      title: "Create project repository",
      description:
        "Initialize the repository and invite group members.",
      status: "done",
      dueDate: null,
      version: 1,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
    {
      id: "task-2",
      projectId: "collabboard-development",
      title: "Prepare M1 documentation",
      description:
        "Document requirements, wireframes, and the component tree.",
      status: "done",
      dueDate: null,
      version: 1,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
    {
      id: "task-3",
      projectId: "collabboard-development",
      title: "Build board layout",
      description:
        "Create the To Do, Doing, and Done columns.",
      status: "doing",
      dueDate: null,
      version: 1,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
    {
      id: "task-4",
      projectId: "collabboard-development",
      title: "Create task card",
      description:
        "Build a reusable task display component.",
      status: "todo",
      dueDate: null,
      version: 1,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
    {
      id: "task-5",
      projectId: "collabboard-development",
      title: "Add task form",
      description:
        "Create a form for adding tasks to the project.",
      status: "todo",
      dueDate: null,
      version: 1,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    },
  ],
};