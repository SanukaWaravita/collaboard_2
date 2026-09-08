import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { Project, ProjectMember, Task, User, Workspace, WorkspaceMember } from "../src/models/index.js";
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from "./helpers/database.js";

beforeAll(startTestDatabase, 120000);
afterAll(stopTestDatabase);

let ownerToken;
let reviewerToken;
let project;

beforeEach(async () => {
  await clearTestDatabase();
  await User.create([
    { _id: "owner", name: "Project Owner", email: "owner@example.com", passwordHash: "unused-in-task-tests" },
    { _id: "reviewer", name: "Project Reviewer", email: "reviewer@example.com", passwordHash: "unused-in-task-tests" },
  ]);
  await Workspace.create({ _id: "workspace", name: "Test workspace", slug: "test-workspace", ownerId: "owner" });
  await WorkspaceMember.create([
    { workspaceId: "workspace", userId: "owner", role: "OWNER" },
    { workspaceId: "workspace", userId: "reviewer", role: "MEMBER" },
  ]);
  project = await Project.create({
    _id: "project", workspaceId: "workspace", projectKey: "M4", name: "Test project", ownerId: "owner",
  });
  await ProjectMember.create([
    { projectId: project.id, userId: "owner", role: "OWNER" },
    { projectId: project.id, userId: "reviewer", role: "REVIEWER" },
  ]);
  ownerToken = jwt.sign({}, process.env.JWT_SECRET, { subject: "owner", expiresIn: "1h" });
  reviewerToken = jwt.sign({}, process.env.JWT_SECRET, { subject: "reviewer", expiresIn: "1h" });
});

async function createTask(overrides = {}) {
  const response = await request(app)
    .post(`/api/projects/${project.id}/tasks`)
    .auth(ownerToken, { type: "bearer" })
    .send({ title: "Write M4 tests", ...overrides })
    .expect(201);
  return response.body.task;
}

describe("Task API with an isolated MongoDB database", () => {
  test("rejects task creation without authentication and writes nothing", async () => {
    await request(app).post(`/api/projects/${project.id}/tasks`).send({ title: "Unauthorised task" }).expect(401);
    expect(await Task.countDocuments()).toBe(0);
  });

  test("creates a task, persists metadata, and returns it through GET", async () => {
    const task = await createTask({ title: "  Write M4 tests  ", dueDate: "2026-09-30", assigneeIds: ["owner"] });
    expect(task).toMatchObject({
      title: "Write M4 tests", projectId: "project", status: "todo",
      createdById: "owner", reporterId: "owner", version: 1,
    });
    const stored = await Task.findById(task.id);
    expect(stored.dueDate).toBe("2026-09-30");
    expect(stored.assigneeIds).toEqual(["owner"]);
    const response = await request(app).get(`/api/tasks/${task.id}`).auth(ownerToken, { type: "bearer" }).expect(200);
    expect(response.body.task).toMatchObject({ id: task.id, title: "Write M4 tests" });
  });

  test("reviewers can read tasks but cannot edit or delete them", async () => {
    const task = await createTask();
    await request(app).get(`/api/tasks/${task.id}`).auth(reviewerToken, { type: "bearer" }).expect(200);
    await request(app).patch(`/api/tasks/${task.id}`).auth(reviewerToken, { type: "bearer" })
      .send({ title: "Forbidden edit", version: 1 }).expect(403);
    await request(app).delete(`/api/tasks/${task.id}`).auth(reviewerToken, { type: "bearer" }).expect(403);
    expect((await Task.findById(task.id)).title).toBe("Write M4 tests");
  });

  test("rejects an impossible due date without creating a task", async () => {
    await request(app).post(`/api/projects/${project.id}/tasks`).auth(ownerToken, { type: "bearer" })
      .send({ title: "Invalid date", dueDate: "2026-02-30" }).expect(400);
    expect(await Task.countDocuments()).toBe(0);
  });

  test("moves a task and rejects a stale edit without overwriting the saved change", async () => {
    const task = await createTask();
    const updated = await request(app).patch(`/api/tasks/${task.id}`).auth(ownerToken, { type: "bearer" })
      .send({ status: "done", version: 1 }).expect(200);
    expect(updated.body.task).toMatchObject({ status: "done", version: 2 });
    const stale = await request(app).patch(`/api/tasks/${task.id}`).auth(ownerToken, { type: "bearer" })
      .send({ title: "Stale edit", version: 1 }).expect(409);
    expect(stale.body.task).toMatchObject({ title: "Write M4 tests", status: "done", version: 2 });
    expect((await Task.findById(task.id)).toJSON()).toMatchObject({ title: "Write M4 tests", status: "done", version: 2 });
  });

  test("only one of two competing edits with the same version succeeds", async () => {
    const task = await createTask();
    const responses = await Promise.all(["First edit", "Second edit"].map((title) =>
      request(app).patch(`/api/tasks/${task.id}`).auth(ownerToken, { type: "bearer" }).send({ title, version: 1 }),
    ));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const winner = responses.find((response) => response.status === 200).body.task;
    expect((await Task.findById(task.id)).toJSON()).toMatchObject({ title: winner.title, version: 2 });
  });

  test("the owner can delete a task and later GET returns 404", async () => {
    const task = await createTask();
    const deleted = await request(app).delete(`/api/tasks/${task.id}`).auth(ownerToken, { type: "bearer" }).expect(204);
    expect(deleted.text).toBe("");
    expect(await Task.findById(task.id)).toBeNull();
    await request(app).get(`/api/tasks/${task.id}`).auth(ownerToken, { type: "bearer" }).expect(404);
  });
});
