# CollaBoard REST API Contract

## 1. Purpose

This document defines the REST API used by the CollaBoard React client.

CollaBoard currently stores users, Workspaces, Projects, workflow statuses, memberships, invitations, and Tasks in server memory.

MongoDB persistence will replace the temporary in-memory store during a later milestone.

---

## 2. Domain model

CollaBoard uses the following hierarchy:

```text
Workspace
└── Project
    ├── Workflow Status
    ├── Project Member
    └── Task
        ├── References one Workflow Status
        └── Optionally references one Assignee
```

Every Project owns an ordered collection of Workflow Statuses.

A Task’s `status` property stores the identifier of one Workflow Status belonging to the same Project.

A Task’s optional `assigneeId` property stores the identifier of one assignable Project member.

A valid Assignee must:

- be an explicit member of the Task’s Project;
- exist as a registered user;
- have the `OWNER` or `CONTRIBUTOR` Project role.

Project reviewers, implicit viewers of open Projects, and users without Project access cannot be assigned.

A Project is displayed using Kanban and List views in the React interface. It is not a separate Board entity.

---

## 3. Base URL

During local development:

```text
http://localhost:5000/api
```

Requests and responses use JSON unless otherwise stated.

---

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
  "name": "Ayesha Perera",
  "email": "owner@collaboard.test",
  "password": "CollaBoard@2026"
}
```

Response:

```json
{
  "token": "...",
  "user": {
    "id": "user-identifier",
    "name": "Ayesha Perera",
    "email": "owner@collaboard.test"
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
  "email": "owner@collaboard.test",
  "password": "CollaBoard@2026"
}
```

Response:

```json
{
  "token": "...",
  "user": {
    "id": "user-identifier",
    "name": "Ayesha Perera",
    "email": "owner@collaboard.test"
  }
}
```

---

## 5. Workspace roles

|Role|Description|
|---|---|
|`OWNER`|Full Workspace control, including deletion|
|`ADMIN`|Workspace and member administration|
|`MEMBER`|Ordinary internal Workspace member|
|`GUEST`|Can access only explicitly assigned Projects|

---

## 6. Project roles

|Role|Description|Assignable to Tasks|
|---|---|--:|
|`OWNER`|Full Project, Task, workflow, and membership control|Yes|
|`CONTRIBUTOR`|Can read the Project and manage Tasks|Yes|
|`REVIEWER`|Read-only Project and Task access|No|

An internal Workspace member with implicit access to an open Project is treated as a non-member reviewer and cannot be assigned.

A guest with explicit `CONTRIBUTOR` Project membership can be assigned.

---

## 7. Project visibility

|Visibility|Behaviour|
|---|---|
|`open`|Ordinary internal Workspace members receive implicit reviewer access|
|`private`|Explicit Project membership is required|

Guest users do not automatically receive access to open Projects.

---

## 8. Workspace endpoints

### List the current user’s Workspaces

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

---

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
    "description": "Main development project",
    "visibility": "open",
    "ownerId": "owner-user-id",
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

Deleting a Project also deletes its:

- Tasks;
- Project memberships;
- Project invitations.

Successful deletion returns:

```http
204 No Content
```

---

## 10. Project-member endpoints

### List Project members

```http
GET /api/projects/:projectId/members
```

Response:

```json
{
  "members": [
    {
      "userId": "user-identifier",
      "name": "Dilan Fernando",
      "email": "contributor@collaboard.test",
      "projectRole": "CONTRIBUTOR",
      "canBeAssigned": true,
      "workspaceRole": "MEMBER",
      "memberType": "INTERNAL",
      "joinedAt": "2026-08-21T00:00:00.000Z"
    },
    {
      "userId": "reviewer-identifier",
      "name": "Nethmi Silva",
      "email": "reviewer@collaboard.test",
      "projectRole": "REVIEWER",
      "canBeAssigned": false,
      "workspaceRole": "MEMBER",
      "memberType": "INTERNAL",
      "joinedAt": "2026-08-21T00:00:00.000Z"
    }
  ],
  "canManageMembers": true
}
```

The `canBeAssigned` property is calculated by the server.

It is `true` only for Project owners and contributors.

### Change a Project member’s role

```http
PATCH /api/projects/:projectId/members/:userId
```

Request:

```json
{
  "role": "REVIEWER"
}
```

The editable roles are:

```text
CONTRIBUTOR
REVIEWER
```

The Project owner cannot be demoted through this endpoint.

Response:

```json
{
  "member": {
    "userId": "user-identifier",
    "name": "Dilan Fernando",
    "projectRole": "REVIEWER",
    "canBeAssigned": false
  },
  "unassignedTaskCount": 2
}
```

Changing a member from `CONTRIBUTOR` to `REVIEWER` automatically:

- clears that user from every assigned Task in the Project;
- changes each affected Task’s `assigneeId` to `null`;
- increments each affected Task version;
- updates each affected Task’s `updatedAt` timestamp.

Restoring the user to `CONTRIBUTOR` does not automatically reassign previous Tasks.

### Remove a Project member

```http
DELETE /api/projects/:projectId/members/:userId
```

The Project owner cannot be removed.

Response:

```json
{
  "message": "Project member removed",
  "userId": "removed-user-id",
  "unassignedTaskCount": 2,
  "workspaceGuestRemoved": false
}
```

Removing a Project member automatically unassigns every Task assigned to that user.

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

Both `OWNER` and `CONTRIBUTOR` are assignable roles, so ownership transfer does not automatically unassign Tasks.

---

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
  "email": "member@collaboard.test",
  "role": "CONTRIBUTOR",
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

Accepting a contributor invitation makes the user eligible for Task assignment.

Accepting a reviewer invitation does not make the user assignable.

### Cancel a pending invitation

```http
DELETE /api/projects/:projectId/invitations/:invitationId
```

The invitation status becomes:

```text
CANCELLED
```

---

## 12. Recipient invitation endpoints

### List the current user’s pending invitations

```http
GET /api/invitations
```

Invitations are matched using the authenticated user’s email address.

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

---

## 13. Workflow Status endpoints

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
- the Project’s `updatedAt` timestamp is updated.

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
- the Project’s only completed status cannot be deleted;
- the replacement must be another status in the same Project;
- affected Tasks move to the replacement status;
- every moved Task has its version incremented;
- positions are normalized after deletion.

---

## 14. Task model

A Task contains:

```json
{
  "id": "task-identifier",
  "projectId": "project-identifier",
  "title": "Create API documentation",
  "description": "Document all Project routes.",
  "status": "doing",
  "dueDate": "2026-08-30",
  "assigneeId": "user-identifier",
  "version": 3,
  "createdAt": "2026-08-21T00:00:00.000Z",
  "updatedAt": "2026-08-21T02:00:00.000Z"
}
```

|Property|Required|Purpose|
|---|--:|---|
|`id`|Yes|Stable Task identifier|
|`projectId`|Yes|Project containing the Task|
|`title`|Yes|Task title|
|`description`|Yes|Task description, which may be empty|
|`status`|Yes|Workflow Status identifier|
|`dueDate`|No|Optional `YYYY-MM-DD` deadline or `null`|
|`assigneeId`|No|Optional eligible Project-member user ID or `null`|
|`version`|Yes|Optimistic concurrency version|
|`createdAt`|Yes|Creation timestamp|
|`updatedAt`|Yes|Last update timestamp|

---

## 15. Task endpoints

### Create a Task

```http
POST /api/projects/:projectId/tasks
```

Request:

```json
{
  "title": "Create API documentation",
  "description": "Document all Project routes.",
  "status": "doing",
  "dueDate": "2026-08-30",
  "assigneeId": "user-identifier"
}
```

Only `title` is always required.

If `description` is omitted, it defaults to an empty string.

If `status` is omitted, the server selects the first non-completed Workflow Status according to its position.

If `dueDate` is omitted, empty, or `null`, it is stored as:

```json
{
  "dueDate": null
}
```

If `assigneeId` is omitted, empty, or `null`, it is stored as:

```json
{
  "assigneeId": null
}
```

The supplied `status` must identify a Workflow Status belonging to the same Project.

The supplied `assigneeId` must identify an explicit owner or contributor in the same Project.

Response:

```json
{
  "task": {
    "id": "task-identifier",
    "projectId": "project-identifier",
    "title": "Create API documentation",
    "description": "Document all Project routes.",
    "status": "doing",
    "dueDate": "2026-08-30",
    "assigneeId": "user-identifier",
    "version": 1,
    "createdAt": "2026-08-21T00:00:00.000Z",
    "updatedAt": "2026-08-21T00:00:00.000Z"
  }
}
```

### Due Date validation

A non-empty Due Date must:

- be a string;
- use exact `YYYY-MM-DD` format;
- represent a real calendar date;
- use a four-digit year of at least `1000`.

Examples accepted:

```text
2026-08-21
2030-12-31
```

Examples rejected:

```text
21-08-2026
2026/08/21
2026-02-30
tomorrow
```

Invalid Due Dates return:

```http
400 Bad Request
```

### Assignee validation

The Assignee value may be:

- a valid Project-member user ID;
- an empty string;
- `null`.

A non-null Assignee must:

- exist as a registered user;
- have explicit membership in the Task’s Project;
- have the `OWNER` or `CONTRIBUTOR` Project role.

The following users cannot be assigned:

- reviewers;
- implicit viewers of open Projects;
- members of another Project;
- unknown users;
- removed Project members.

Invalid Assignees return:

```http
400 Bad Request
```

Example response:

```json
{
  "message": "Assignee must be an owner or contributor in this project"
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
    "id": "task-identifier",
    "projectId": "project-identifier",
    "title": "Create API documentation",
    "description": "Document all Project routes.",
    "status": "doing",
    "dueDate": "2026-08-30",
    "assigneeId": "user-identifier",
    "version": 1
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
  "status": "review-status-id",
  "dueDate": "2026-09-05",
  "assigneeId": "another-user-id",
  "version": 1
}
```

At least one editable property must be provided:

```text
title
description
status
dueDate
assigneeId
```

A valid current `version` is required for every update.

After a successful update, the server:

- applies the supplied changes;
- increments the Task version;
- updates the Task’s `updatedAt` timestamp;
- returns the updated Task.

### Removing a Due Date

A Due Date can be removed using:

```json
{
  "dueDate": null,
  "version": 2
}
```

or:

```json
{
  "dueDate": "",
  "version": 2
}
```

Both values are normalized to:

```json
{
  "dueDate": null
}
```

### Removing an Assignee

An Assignee can be removed using:

```json
{
  "assigneeId": null,
  "version": 2
}
```

or:

```json
{
  "assigneeId": "",
  "version": 2
}
```

Both values are normalized to:

```json
{
  "assigneeId": null
}
```

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

---

## 16. Automatic Assignee cleanup

A Task cannot remain assigned to a user who no longer has an assignable role in its Project.

### Contributor downgraded to reviewer

When an assigned contributor becomes a reviewer:

- the Project membership remains;
- `canBeAssigned` becomes `false`;
- every Task assigned to that user receives `assigneeId: null`;
- every affected Task version increments;
- every affected Task receives a new `updatedAt` timestamp.

### Project member removed

When an assigned member is removed:

- the Project membership is deleted;
- every Task assigned to that user receives `assigneeId: null`;
- every affected Task version increments;
- every affected Task receives a new `updatedAt` timestamp.

### Project ownership transferred

Ownership transfer does not clear assignments because:

- the new owner has the assignable `OWNER` role;
- the previous owner receives the assignable `CONTRIBUTOR` role.

Automatic unassignment does not:

- delete the Task;
- change its title;
- change its description;
- change its workflow status;
- change its Due Date.

---

## 17. Invitation statuses

```text
PENDING
ACCEPTED
DECLINED
CANCELLED
```

---

## 18. Common HTTP responses

|Status|Meaning|
|---|---|
|`200 OK`|Successful read or update|
|`201 Created`|Resource created|
|`204 No Content`|Resource deleted|
|`400 Bad Request`|Invalid request data|
|`401 Unauthorized`|Missing, invalid, or expired token|
|`403 Forbidden`|Authenticated but insufficient permission|
|`404 Not Found`|Resource or accessible resource not found|
|`409 Conflict`|Duplicate resource, invalid transition, or Task version conflict|

Error responses use:

```json
{
  "message": "Explanation of the error"
}
```

---

## 19. In-memory limitation

All application data is currently stored in server memory.

Restarting the Express server removes:

- registered users;
- created Workspaces;
- created Projects;
- memberships;
- invitations;
- created Tasks;
- Task updates;
- Task Due Dates;
- Task Assignees;
- created, renamed, recoloured, reordered, and deleted Workflow Statuses.

The seeded Workspaces, Projects, Tasks, and default Workflow Statuses are recreated when the server starts.

Seeded Tasks use:

```json
{
  "dueDate": null,
  "assigneeId": null,
  "version": 1
}
```

MongoDB persistence will replace this temporary behaviour in a later milestone.