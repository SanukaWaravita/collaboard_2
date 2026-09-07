import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";
import { request as httpRequest } from "node:http";

const frontendOrigins = [
  "https://collaboard-staging-2026.firebaseapp.com",
  "https://collaboard-staging-2026.web.app",
];

// Deliberately exclude the API origin: same-origin Swagger must work
// independently of the configured cross-origin frontend allowlist.
process.env.CORS_ALLOWED_ORIGINS = frontendOrigins.join(",");
const { default: app } = await import("../src/app.js");
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test("Swagger HTML, initialization, and local assets load without authentication", async () => {
  for (const [path, contentType] of [
    ["/api/docs/", "text/html"],
    ["/api/docs/swagger-ui.css", "text/css"],
    ["/api/docs/swagger-ui-bundle.js", "javascript"],
    ["/api/docs/swagger-ui-standalone-preset.js", "javascript"],
    ["/api/docs/swagger-ui-init.js", "javascript"],
  ]) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get("content-type").includes(contentType), path);
    const body = await response.text();
    assert.ok(body.length > 0, path);
    if (path.endsWith("swagger-ui-init.js")) {
      assert.ok(body.includes('"url": "/api"'));
      assert.ok(!body.includes("collaboard-team-api"));
    }
  }
});

test("OpenAPI resolves against either backend and retains bearer authentication", async () => {
  const response = await fetch(baseUrl + "/api/openapi.json");
  assert.equal(response.status, 200);
  const document = await response.json();
  assert.equal(document.servers[0].url, "/api");
  for (const origin of [baseUrl, "https://collaboard-api-staging.onrender.com"]) {
    const api = new URL(document.servers[0].url, origin + "/api/openapi.json");
    assert.equal(api.href + "/health", origin + "/api/health");
  }
  assert.equal(document.components.securitySchemes.bearerAuth.scheme, "bearer");
  assert.deepEqual(document.security, [{ bearerAuth: [] }]);
  assert.deepEqual(document.paths["/auth/login"].post.security, []);
  assert.deepEqual(document.paths["/health"].get.security, []);
  assert.ok(document.components.schemas.TaskUpdate.required.includes("version"));
  for (const path of ["/workspaces/{workspaceId}", "/projects/{projectId}", "/tasks/{taskId}"]) {
    assert.ok(document.paths[path].delete.responses[204]);
    assert.equal(document.paths[path].delete.responses[204].content, undefined);
  }
});

test("local same-origin JSON POST reaches validation instead of CORS rejection", async () => {
  const response = await fetch(baseUrl + "/api/auth/register", {
    method: "POST",
    headers: { Origin: baseUrl, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "Name is required");
});

test("Render HTTPS proxy same-origin JSON POST reaches validation", async () => {
  // Use node:http to preserve the proxy's Host header; fetch can replace it.
  const response = await new Promise((resolve, reject) => {
    const request = httpRequest(baseUrl + "/api/auth/register", {
      method: "POST",
      headers: {
        Host: "collaboard-api-staging.onrender.com",
        Origin: "https://collaboard-api-staging.onrender.com",
        "X-Forwarded-Proto": "https",
        "Content-Type": "application/json",
      },
    }, incoming => {
      let body = "";
      incoming.setEncoding("utf8");
      incoming.on("data", chunk => { body += chunk; });
      incoming.on("error", reject);
      incoming.on("end", () => resolve({ status: incoming.statusCode, body: JSON.parse(body) }));
    });
    request.on("error", reject);
    request.end("{}");
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Name is required");
});

for (const origin of frontendOrigins) {
  test(`Firebase preflight accepts ${origin}`, async () => {
    const response = await fetch(baseUrl + "/api/workspaces", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.ok(response.headers.get("access-control-allow-headers").includes("authorization"));
  });
}

test("unlisted cross-origin requests are still rejected", async () => {
  const response = await fetch(baseUrl + "/api/health", {
    headers: { Origin: "https://unlisted.example" },
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("protected routes still require authentication", async () => {
  const response = await fetch(baseUrl + "/api/workspaces");
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "Authentication required");
});

test("disconnected database health remains 503", async () => {
  const response = await fetch(baseUrl + "/api/health");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).database, "disconnected");
});
