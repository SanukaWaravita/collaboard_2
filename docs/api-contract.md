# CollaBoard REST API Contract

## 1. Purpose

This document defines the REST API used by the CollaBoard React client.

CollaBoard currently stores users, Workspaces, Projects, Workflow Statuses, memberships, invitations, and Tasks in server memory.

MongoDB persistence will replace the temporary in-memory store during a later milestone.

## 2. Domain model

CollaBoard uses the following hierarchy:

```text
Workspace
└── Project
    ├── Workflow Status
    └── Task
        ├── References one Workflow Status
        └── May contain an optional Due Date
```

Every Project owns an ordered collection of Workflow Statuses.

A Task's `status` property stores the identifier of one Workflow Status belonging to the same Project.

A Task's optional `dueDate` property stores a date-only value using:

```text
YYYY-MM-DD
```

A Project is displayed using Kanban and List views in the React interface. It is not a separate Board entity.

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

The first registered user becomes the owner of the seeded Workspace and seeded Projects.

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
|`OWNER`|Full Workspace control, including deletion|
|`ADMIN`|Workspace and member administration|
|`MEMBER`|Ordinary internal Workspace member|
|`GUEST`|Can access only explicitly assigned Projects|

## 6. Project roles

|Role|Description|
|---|---|
|`OWNER`|Full Project, workflow, membership, and Task control|
|`CONTRIBUTOR`|Can read the Project and manage Tasks|
|`REVIEWER`|Read-only Project and Task access|

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
- Workflow Statuses;
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

Every newly created Project receives its own default Workflow Statuses:

```text
To Do → Doing → Done
```

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
    "workflowStatuses": [
      {
        "id": "todo",
        "name": "To Do",
        "color": "#64748b",
        "position": 0,
        "isCompleted": false
      },
      {
        "id": "doing",
        "name": "Doing",
        "color": "#2563eb",
        "position": 1,
        "isCompleted": false
      },
      {
        "id": "done",
        "name": "Done",
        "color": "#16a34a",
        "position": 2,
        "isCompleted": true
      }
    ],
    "currentUserRole": "OWNER",
    "isMember": true,
    "permissions": [
      "READ_PROJECT",
      "UPDATE_PROJECT",
      "DELETE_PROJECT",
      "MANAGE_MEMBERS",
      "CREATE_TASK",
      "UPDATE_TASK",
      "DELETE_TASK"
    ]
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

Deleting a Project also deletes its:

- Workflow Statuses;
- Tasks;
- memberships;
- invitations.

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

## 13. Workflow Status endpoints

Workflow Statuses define the columns and stages belonging to an individual Project.

Each Workflow Status contains:

|Property|Purpose|
|---|---|
|`id`|Stable identifier stored by Tasks|
|`name`|User-facing status and column name|
|`color`|Six-digit hexadecimal display colour|
|`position`|Current position in the Project workflow|
|`isCompleted`|Indicates whether Tasks in the status are completed|

All users with Project read access can retrieve Workflow Statuses.

Only the Project owner can create, edit, reorder, or delete them.

### List Workflow Statuses

```http
GET /api/projects/:projectId/statuses
```

Response:

```json
{
  "workflowStatuses": [
    {
      "id": "todo",
      "name": "To Do",
      "color": "#64748b",
      "position": 0,
      "isCompleted": false
    },
    {
      "id": "doing",
      "name": "Doing",
      "color": "#2563eb",
      "position": 1,
      "isCompleted": false
    },
    {
      "id": "done",
      "name": "Done",
      "color": "#16a34a",
      "position": 2,
      "isCompleted": true
    }
  ]
}
```

Statuses are returned in ascending `position` order.

### Create a Workflow Status

```http
POST /api/projects/:projectId/statuses
```

Request:

```json
{
  "name": "Review",
  "color": "#f59e0b"
}
```

Response:

```json
{
  "workflowStatus": {
    "id": "generated-status-id",
    "name": "Review",
    "color": "#f59e0b",
    "position": 2,
    "isCompleted": false
  },
  "workflowStatuses": []
}
```

New custom statuses are inserted immediately before the first completed status.

Workflow Status rules:

- a Project can contain a maximum of 12 statuses;
- status names cannot exceed 40 characters;
- status names must be unique inside the Project;
- duplicate-name checking is case-insensitive;
- colours must be six-digit hexadecimal values;
- newly created custom statuses are non-completed statuses.

### Update a Workflow Status

```http
PATCH /api/projects/:projectId/statuses/:statusId
```

Request:

```json
{
  "name": "Quality Review",
  "color": "#8b5cf6"
}
```

The name and colour are independently optional, but at least one must be provided.

A status identifier does not change when its name or colour changes.

Tasks therefore do not need to be updated when a status is renamed.

### Reorder Workflow Statuses

```http
PUT /api/projects/:projectId/statuses/order
```

Only the Project owner can reorder Workflow Statuses.

The request must contain the complete ordered collection of status identifiers:

```json
{
  "statusIds": [
    "todo",
    "review-status-id",
    "doing",
    "done"
  ]
}
```

Response:

```json
{
  "workflowStatuses": [
    {
      "id": "todo",
      "name": "To Do",
      "color": "#64748b",
      "position": 0,
      "isCompleted": false
    },
    {
      "id": "review-status-id",
      "name": "Review",
      "color": "#f59e0b",
      "position": 1,
      "isCompleted": false
    },
    {
      "id": "doing",
      "name": "Doing",
      "color": "#2563eb",
      "position": 2,
      "isCompleted": false
    },
    {
      "id": "done",
      "name": "Done",
      "color": "#16a34a",
      "position": 3,
      "isCompleted": true
    }
  ]
}
```

Reordering rules:

- the complete Workflow Status collection is required;
- every identifier must be a non-empty string;
- identifiers cannot be duplicated;
- every identifier must belong to the same Project;
- every current Project status must appear exactly once;
- completed statuses must remain after active statuses;
- positions are reassigned from zero after validation;
- Task status identifiers are not changed;
- Task versions are not incremented;
- the Project's `updatedAt` timestamp is updated.

The React client exposes reordering through accessible Move Up and Move Down controls.

The first active Workflow Status becomes the default status when creating a Task.

### Delete a Workflow Status

```http
DELETE /api/projects/:projectId/statuses/:statusId
```

An empty status can be deleted using an empty request body:

```json
{}
```

When the status contains Tasks, a replacement status is required:

```json
{
  "replacementStatusId": "doing"
}
```

Response:

```json
{
  "deletedStatusId": "deleted-status-id",
  "replacementStatusId": "doing",
  "movedTaskCount": 2,
  "workflowStatuses": []
}
```

Deletion rules:

- a Project must retain at least one Workflow Status;
- the Project's only completed status cannot be deleted;
- the replacement must be another status in the same Project;
- all affected Tasks are moved to the replacement status;
- every moved Task has its version incremented;
- positions are normalized after deletion.

## 14. Task endpoints

Each Task contains:

|Property|Purpose|
|---|---|
|`id`|Stable Task identifier|
|`projectId`|Project containing the Task|
|`title`|Short Task name|
|`description`|Detailed Task information|
|`status`|Identifier of a Workflow Status in the same Project|
|`dueDate`|Optional date-only deadline or `null`|
|`version`|Optimistic-concurrency version|
|`createdAt`|Creation timestamp|
|`updatedAt`|Latest modification timestamp|

### Create a Task

```http
POST /api/projects/:projectId/tasks
```

Request:

```json
{
  "title": "Create API documentation",
  "description": "Document all Project routes.",
  "status": "todo",
  "dueDate": "2026-08-30"
}
```

The `status` property is optional.

When supplied, it must identify a Workflow Status belonging to the same Project.

If `status` is omitted, the server selects the first non-completed Workflow Status according to its position.

The `dueDate` property is optional.

It may contain:

```text
YYYY-MM-DD
```

or:

```json
null
```

If `dueDate` is omitted, the server stores:

```json
{
  "dueDate": null
}
```

Response:

```json
{
  "task": {
    "id": "task-id",
    "projectId": "project-id",
    "title": "Create API documentation",
    "description": "Document all Project routes.",
    "status": "todo",
    "dueDate": "2026-08-30",
    "version": 1,
    "createdAt": "2026-08-21T00:00:00.000Z",
    "updatedAt": "2026-08-21T00:00:00.000Z"
  }
}
```

### Open a Task

```http
GET /api/tasks/:taskId
```

Response:

```json
{
  "task": {
    "id": "task-id",
    "projectId": "project-id",
    "title": "Create API documentation",
    "description": "Document all Project routes.",
    "status": "todo",
    "dueDate": "2026-08-30",
    "version": 1,
    "createdAt": "2026-08-21T00:00:00.000Z",
    "updatedAt": "2026-08-21T00:00:00.000Z"
  }
}
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
  "dueDate": "2026-09-05",
  "version": 1
}
```

The client may update any combination of:

```text
title
description
status
dueDate
```

At least one of those properties must be provided.

When changing a Task's status, the supplied identifier must belong to the Task's Project.

An unknown status or a status belonging only to another Project is rejected with:

```http
400 Bad Request
```

The Due Date may be removed by sending:

```json
{
  "dueDate": null,
  "version": 1
}
```

An empty Due Date string is also normalized to `null`:

```json
{
  "dueDate": "",
  "version": 1
}
```

### Due Date rules

Due Dates:

- are optional;
- use the `YYYY-MM-DD` date-only format;
- are stored without a time or timezone;
- must represent a real calendar date;
- may be in the past;
- may be changed or removed;
- are included in optimistic-concurrency checks.

Invalid examples include:

```text
30-08-2026
2026/08/30
2026-02-30
tomorrow
```

Invalid Due Dates return:

```http
400 Bad Request
```

Response:

```json
{
  "message": "Due date must use YYYY-MM-DD format or be null"
}
```

### Task versioning

The version submitted by the client must match the current server version.

After a successful update, the server increments the Task version.

Updating only the Due Date still increments the version.

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

## 15. Invitation statuses

```text
PENDING
ACCEPTED
DECLINED
CANCELLED
```

## 16. Common HTTP responses

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

## 17. In-memory limitation

All application data is currently stored in server memory.

Restarting the Express server deletes:

- registered users;
- created Workspaces;
- created Projects;
- memberships;
- invitations;
- created, renamed, recoloured, reordered, and deleted Workflow Statuses;
- created Tasks;
- Task Due Dates;
- Task updates.

The two seeded Projects and their seeded Tasks are recreated when the server starts.

Each seeded Project is recreated with the default Workflow Statuses:

```text
To Do → Doing → Done
```

Seeded Tasks are recreated with:

```json
{
  "dueDate": null
}
```

MongoDB persistence will replace this temporary behaviour during a later milestone.