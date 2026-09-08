import { expect, test } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";

const frontendOrigins = [
  "https://collaboard-staging-2026.firebaseapp.com",
  "https://collaboard-staging-2026.web.app",
];

test("Swagger HTML, initialization, and local assets load without authentication", async () => {
  for (const [path, contentType] of [
    ["/api/docs/", "text/html"],
    ["/api/docs/swagger-ui.css", "text/css"],
    ["/api/docs/swagger-ui-bundle.js", "javascript"],
    ["/api/docs/swagger-ui-standalone-preset.js", "javascript"],
    ["/api/docs/swagger-ui-init.js", "javascript"],
  ]) {
    const response = await request(app).get(path).expect(200);
    expect(response.headers["content-type"]).toContain(contentType);
    expect(response.text.length).toBeGreaterThan(0);
    if (path.endsWith("swagger-ui-init.js")) {
      expect(response.text).toContain('"url": "/api"');
      expect(response.text).not.toContain("collaboard-team-api");
    }
  }
});

test("OpenAPI resolves against either backend and retains bearer authentication", async () => {
  const { body: document } = await request(app).get("/api/openapi.json").expect(200);
  expect(document.servers[0].url).toBe("/api");
  for (const origin of ["http://localhost:5000", "https://collaboard-api-staging.onrender.com"]) {
    const api = new URL(document.servers[0].url, origin + "/api/openapi.json");
    expect(api.href + "/health").toBe(origin + "/api/health");
  }
  expect(document.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
  expect(document.security).toEqual([{ bearerAuth: [] }]);
  expect(document.paths["/auth/login"].post.security).toEqual([]);
  expect(document.paths["/health"].get.security).toEqual([]);
  expect(document.components.schemas.TaskUpdate.required).toContain("version");
  for (const path of ["/workspaces/{workspaceId}", "/projects/{projectId}", "/tasks/{taskId}"]) {
    expect(document.paths[path].delete.responses[204]).toBeDefined();
    expect(document.paths[path].delete.responses[204].content).toBeUndefined();
  }
});

test("local same-origin JSON POST reaches validation instead of CORS rejection", async () => {
  const response = await request(app).post("/api/auth/register")
    .set("Host", "localhost:5000").set("Origin", "http://localhost:5000")
    .send({}).expect(400);
  expect(response.body.message).toBe("Name is required");
});

test("Render HTTPS proxy same-origin JSON POST reaches validation", async () => {
  const response = await request(app).post("/api/auth/register")
    .set("Host", "collaboard-api-staging.onrender.com")
    .set("Origin", "https://collaboard-api-staging.onrender.com")
    .set("X-Forwarded-Proto", "https").send({}).expect(400);
  expect(response.body.message).toBe("Name is required");
});

test.each(frontendOrigins)("Firebase preflight accepts %s", async (origin) => {
  const response = await request(app).options("/api/workspaces")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "authorization,content-type")
    .expect(204);
  expect(response.headers["access-control-allow-origin"]).toBe(origin);
  expect(response.headers["access-control-allow-headers"]).toContain("authorization");
});

test("unlisted cross-origin requests are still rejected", async () => {
  const response = await request(app).get("/api/health").set("Origin", "https://unlisted.example").expect(403);
  expect(response.headers["access-control-allow-origin"]).toBeUndefined();
});

test("protected routes still require authentication", async () => {
  const response = await request(app).get("/api/workspaces").expect(401);
  expect(response.body.message).toBe("Authentication required");
});

test("disconnected database health remains 503", async () => {
  const response = await request(app).get("/api/health").expect(503);
  expect(response.body.database).toBe("disconnected");
});
