# CollabBoard REST API Contract

## 1. Purpose

This document defines the HTTP endpoints used by the CollabBoard React client.

During Milestone 2, boards, tasks, and users are initially stored in server memory. MongoDB persistence will replace the temporary storage during Milestone 3.

## 2. Base URL

During local development:

```text
http://localhost:5000/api
```

Requests and responses use JSON unless otherwise stated.

## 3. Authentication

Protected endpoints require a JWT in the request header:

```http
Authorization: Bearer <token>
```

Authentication will be implemented after the initial Board and Task CRUD endpoints.

## 4. Standard error response

API errors use the following structure:

```json
{
  "message": "Description of the error"
}
```

Common status codes:

| Status | Meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | A resource was created |
| `204 No Content` | A resource was deleted |
| `400 Bad Request` | Invalid or missing request data |
| `401 Unauthorized` | Authentication is required or invalid |
| `403 Forbidden` | The user cannot access the resource |
| `404 Not Found` | The requested resource does not exist |
| `409 Conflict` | The resource was modified by another request |
| `500 Internal Server Error` | An unexpected server error occurred |

## 5. User structure

```json
{
  "id": "user-identifier",
  "name": "Alex Silva",
  "email": "alex@example.com"
}
```

Passwords must never be returned by the API.

## 6. Board structure

```json
{
  "id": "board-identifier",
  "name": "CollabBoard Development",
  "description": "Plan and monitor project development.",
  "ownerId": "user-identifier",
  "taskCount": 5,
  "createdAt": "2026-08-14T10:30:00.000Z",
  "updatedAt": "2026-08-14T10:30:00.000Z"
}
```

## 7. Task structure

```json
{
  "id": "task-identifier",
  "boardId": "board-identifier",
  "title": "Create login page",
  "description": "Build the initial login interface.",
  "status": "todo",
  "version": 1,
  "createdAt": "2026-08-14T10:30:00.000Z",
  "updatedAt": "2026-08-14T10:30:00.000Z"
}
```

Allowed task statuses:

```text
todo
doing
done
```

The `version` field will later help detect conflicting updates.

## 8. Authentication endpoints

### Register a user

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "Alex Silva",
  "email": "alex@example.com",
  "password": "secret123"
}
```

Successful response: `201 Created`

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-identifier",
    "name": "Alex Silva",
    "email": "alex@example.com"
  }
}
```

### Log in

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "alex@example.com",
  "password": "secret123"
}
```

Successful response: `200 OK`

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-identifier",
    "name": "Alex Silva",
    "email": "alex@example.com"
  }
}
```

## 9. Board endpoints

All board endpoints will eventually require authentication.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/boards` | List the current user's boards |
| `POST` | `/api/boards` | Create a board |
| `GET` | `/api/boards/:boardId` | Get one board and its tasks |
| `PATCH` | `/api/boards/:boardId` | Update a board |
| `DELETE` | `/api/boards/:boardId` | Delete a board |

### Create a board

Request:

```json
{
  "name": "Group Assignment",
  "description": "Tasks for our group assignment."
}
```

Successful response: `201 Created`

```json
{
  "board": {
    "id": "board-identifier",
    "name": "Group Assignment",
    "description": "Tasks for our group assignment.",
    "ownerId": "user-identifier",
    "taskCount": 0,
    "createdAt": "2026-08-14T10:30:00.000Z",
    "updatedAt": "2026-08-14T10:30:00.000Z"
  }
}
```

### Get one board

Successful response: `200 OK`

```json
{
  "board": {
    "id": "board-identifier",
    "name": "Group Assignment",
    "description": "Tasks for our group assignment.",
    "ownerId": "user-identifier",
    "taskCount": 1,
    "createdAt": "2026-08-14T10:30:00.000Z",
    "updatedAt": "2026-08-14T10:30:00.000Z"
  },
  "tasks": []
}
```

### Update a board

Request fields are optional, but at least one must be supplied:

```json
{
  "name": "Updated Board Name",
  "description": "Updated description."
}
```

Successful response: `200 OK`

### Delete a board

Successful response:

```text
204 No Content
```

Deleting a board also deletes its tasks.

## 10. Task endpoints

All task endpoints will eventually require authentication.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/boards/:boardId/tasks` | Create a task in a board |
| `GET` | `/api/tasks/:taskId` | Get one task |
| `PATCH` | `/api/tasks/:taskId` | Edit or move a task |
| `DELETE` | `/api/tasks/:taskId` | Delete a task |

### Create a task

Request:

```json
{
  "title": "Create login page",
  "description": "Build the initial login interface.",
  "status": "todo"
}
```

Successful response: `201 Created`

```json
{
  "task": {
    "id": "task-identifier",
    "boardId": "board-identifier",
    "title": "Create login page",
    "description": "Build the initial login interface.",
    "status": "todo",
    "version": 1,
    "createdAt": "2026-08-14T10:30:00.000Z",
    "updatedAt": "2026-08-14T10:30:00.000Z"
  }
}
```

### Update or move a task

The same endpoint handles editing and movement between columns:

```http
PATCH /api/tasks/:taskId
```

Example request:

```json
{
  "title": "Complete login page",
  "description": "Finish the login interface.",
  "status": "doing",
  "version": 1
}
```

Successful response: `200 OK`

The server increments the task version after each update.

If the supplied version is outdated, the server will eventually return:

```text
409 Conflict
```

### Delete a task

Successful response:

```text
204 No Content
```

## 11. Health endpoint

```http
GET /api/health
```

Successful response: `200 OK`

```json
{
  "status": "ok",
  "message": "CollabBoard API is running",
  "timestamp": "2026-08-14T10:30:00.000Z"
}
```
