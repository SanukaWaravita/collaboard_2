# CollaBoard REST API Contract

## 1. Purpose

This document defines the REST API used by the CollaBoard React client.

CollaBoard currently stores users, workspaces, projects, memberships, invitations, and tasks in server memory.

MongoDB persistence will replace the temporary in-memory store during a later milestone.

## 2. Domain model

CollaBoard uses the following hierarchy:

```text
Workspace
└── Project
    └── Task
```

A Project is displayed as a Kanban-style task board in the React interface. It is not a separate Board entity.

## 3. Base URL

During local development:

```text
http://localhost:5000/api
```

Requests and responses use JSON unless otherwise stated.

## 4. Authentication

Protected endpoints require a JWT:

```http
Authorization: Bearer <token>
```

Tokens are returned by registration and login.

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "Sanuka",
  "email": "sanuka@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "name": "Sanuka",
    "email": "sanuka@example.com"
  }
}
```

The first registered user becomes the owner of the seeded workspace and seeded projects.

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "sanuka@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "name": "Sanuka",
    "email": "sanuka@example.com"
  }
}
```

## 5. Workspace roles

|Role|Description|
|---|---|
|`OWNER`|Full workspace control, including deletion|
|`ADMIN`|Workspace and member administration|
|`MEMBER`|Ordinary internal workspace member|
|`GUEST`|Can access only explicitly assigned projects|

## 6. Project roles

|Role|Description|
|---|---|
|`OWNER`|Full Project and membership control|
|`CONTRIBUTOR`|Can read the Project and manage tasks|
|`REVIEWER`|Read-only Project and task access|

## 7. Project visibility

|Visibility|Behaviour|
|---|---|
|`open`|Ordinary internal Workspace members receive implicit reviewer access|
|`private`|Explicit Project membership is required|

Guest users do not automatically receive access to open Projects.

## 8. Workspace endpoints

### List the current user's Workspaces

```http
GET /api/workspaces
```

Response:

```json
{
  "workspaces": []
}
```

### Create a Workspace

```http
POST /api/workspaces
```

Request:

```json
{
  "name": "Development Team",
  "slug": "development-team"
}
```

The slug is optional. If omitted, the server generates it from the name.

### Open a Workspace

```http
GET /api/workspaces/:workspaceId
```

### Update a Workspace

```http
PATCH /api/workspaces/:workspaceId
```

Request:

```json
{
  "name": "Updated Workspace Name"
}
```

Workspace slugs are immutable.

### Delete a Workspace

```http
DELETE /api/workspaces/:workspaceId
```

Deleting a Workspace also deletes its:

- Projects;
- Tasks;
- Project memberships;
- Workspace memberships;
- Project invitations.

Successful deletion returns:

```http
204 No Content
```

### List Workspace guest users

```http
GET /api/workspaces/:workspaceId/guests
```

This endpoint requires Workspace member-management permission.

Response:

```json
{
  "guests": [],
  "pendingGuestInvitations": []
}
```

## 9. Project endpoints

### List all accessible Projects

```http
GET /api/projects
```

Optional Workspace filter:

```http
GET /api/projects?workspaceId=:workspaceId
```

Response:

```json
{
  "projects": []
}
```

### List Projects inside a Workspace

```http
GET /api/workspaces/:workspaceId/projects
```

### Create a Project

Either endpoint can be used:

```http
POST /api/projects
POST /api/workspaces/:workspaceId/projects
```

Request:

```json
{
  "workspaceId": "workspace-id",
  "projectKey": "CBD",
  "name": "CollaBoard Development",
  "description": "Main development project",
  "visibility": "private"
}
```

When using the nested Workspace endpoint, `workspaceId` does not need to be included in the request body.

Project Keys:

- contain 2–10 uppercase letters or numbers;
- begin with a letter;
- are unique inside their Workspace;
- cannot be changed after Project creation.

### Open a Project

```http
GET /api/projects/:projectId
```

Response:

```json
{
  "project": {
    "id": "project-id",
    "workspaceId": "workspace-id",
    "projectKey": "CBD",
    "name": "CollaBoard Development",
    "visibility": "open",
    "currentUserRole": "OWNER",
    "isMember": true,
    "permissions": []
  },
  "tasks": []
}
```

### Update a Project

```http
PATCH /api/projects/:projectId
```

Request:

```json
{
  "name": "Updated Project",
  "description": "Updated description",
  "visibility": "private"
}
```

### Delete a Project

```http
DELETE /api/projects/:projectId
```

Deleting a Project also deletes its Tasks, memberships, and invitations.

Successful deletion returns:

```http
204 No Content
```

## 10. Project member endpoints

### List Project members

```http
GET /api/projects/:projectId/members
```

Response:

```json
{
  "members": [],
  "canManageMembers": true
}
```

### Change a Project member's role

```http
PATCH /api/projects/:projectId/members/:userId
```

Request:

```json
{
  "role": "CONTRIBUTOR"
}
```

The editable roles are:

```text
CONTRIBUTOR
REVIEWER
```

The Project owner cannot be demoted through this endpoint.

### Remove a Project member

```http
DELETE /api/projects/:projectId/members/:userId
```

The Project owner cannot be removed.

Removing a guest from their final assigned Project also removes their Workspace guest membership.

### Transfer Project ownership

```http
POST /api/projects/:projectId/transfer-ownership
```

Request:

```json
{
  "userId": "new-owner-user-id"
}
```

Rules:

- only the current Project owner can transfer ownership;
- the target must already be a Project member;
- the target must be an internal Workspace member;
- guest users cannot own Projects;
- the previous owner becomes a contributor.

## 11. Project invitation endpoints

### List invitations for a Project

```http
GET /api/projects/:projectId/invitations
```

Requires Project member-management permission.

### Invite a Project member

```http
POST /api/projects/:projectId/invitations
```

Request:

```json
{
  "email": "member@example.com",
  "role": "REVIEWER",
  "memberType": "INTERNAL"
}
```

Allowed roles:

```text
CONTRIBUTOR
REVIEWER
```

Allowed member types:

```text
INTERNAL
GUEST
```

### Cancel a pending invitation

```http
DELETE /api/projects/:projectId/invitations/:invitationId
```

The invitation status becomes:

```text
CANCELLED
```

## 12. Recipient invitation endpoints

### List the current user's pending invitations

```http
GET /api/invitations
```

Invitations are matched using the authenticated user's email address.

### Accept an invitation

```http
POST /api/invitations/:invitationId/accept
```

Accepting creates:

- a Workspace membership when required;
- a Project membership;
- the requested contributor or reviewer role.

### Decline an invitation

```http
POST /api/invitations/:invitationId/decline
```

## 13. Task endpoints

### Create a Task

```http
POST /api/projects/:projectId/tasks
```

Request:

```json
{
  "title": "Create API documentation",
  "description": "Document all Project routes.",
  "status": "todo"
}
```

### Open a Task

```http
GET /api/tasks/:taskId
```

### Update a Task

```http
PATCH /api/tasks/:taskId
```

Request:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "doing",
  "version": 1
}
```

The version submitted by the client must match the current server version.

After a successful update, the server increments the Task version.

### Task version conflict

If the submitted version is outdated, the server returns:

```http
409 Conflict
```

Response:

```json
{
  "message": "Task was modified by another request",
  "task": {
    "id": "task-id",
    "version": 2
  }
}
```

The client must load the returned current Task before trying the update again.

### Delete a Task

```http
DELETE /api/tasks/:taskId
```

Successful deletion returns:

```http
204 No Content
```

## 14. Invitation statuses

```text
PENDING
ACCEPTED
DECLINED
CANCELLED
```

## 15. Common HTTP responses

|Status|Meaning|
|---|---|
|`200 OK`|Successful read or update|
|`201 Created`|Resource created|
|`204 No Content`|Resource deleted|
|`400 Bad Request`|Invalid request data|
|`401 Unauthorized`|Missing, invalid, or expired token|
|`403 Forbidden`|Authenticated but insufficient permission|
|`404 Not Found`|Resource or accessible resource not found|
|`409 Conflict`|Duplicate resource, invalid state transition, or Task version conflict|

Error responses use:

```json
{
  "message": "Explanation of the error"
}
```

## 16. In-memory limitation

All application data is currently stored in server memory.

Restarting the Express server deletes:

- registered users;
- created Workspaces;
- created Projects;
- memberships;
- invitations;
- created Tasks;
- Task updates.

The two seeded Projects and their seeded Tasks are recreated when the server starts.

MongoDB persistence will replace this temporary behaviour in a later milestone.