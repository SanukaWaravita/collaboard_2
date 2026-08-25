# CollaBoard REST API Contract

## 1. Purpose

This document declares the REST API used by the CollaBoard React client.

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
        ├── References one immutable creator
        ├── References one assignable Reporter
        └── Optionally references multiple Assignees
```

Every Project owns an ordered collection of Workflow Statuses.

A Task’s `status` property stores the identifier of one Workflow Status belonging to the same Project.

A Task’s `assigneeIds` property stores an array containing zero, one, or multiple assignable Project-member user IDs.

Every Assignee must:

- be an explicit member of the Task’s Project;
- exist as a registered user;
- have the `OWNER` or `CONTRIBUTOR` Project role.

Project reviewers, implicit viewers of open Projects, and users without Project access cannot be assigned.

A Task’s `createdById` property records the authenticated user who originally created it. This value is immutable.

A Task’s `reporterId` property identifies its current Reporter. The Reporter must be an explicit member of the same Project when selected, but may have the `OWNER`, `CONTRIBUTOR`, or `REVIEWER` Project role. Reporter assignment does not grant Task-editing permissions and is independent of `assigneeIds`.

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

The first registered user becomes the owner of the starter Workspace and starter Projects. The starter Tasks are also updated so that this user replaces the temporary creator and Reporter references.

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

| Role     | Description                                  |
| -------- | -------------------------------------------- |
| `OWNER`  | Full Workspace control, including deletion   |
| `ADMIN`  | Workspace and member administration          |
| `MEMBER` | Ordinary internal Workspace member           |
| `GUEST`  | Can access only explicitly assigned Projects |

---

## 6. Project roles

| Role | Description | Assignable as Assignee | Eligible as Reporter |
| --- | --- | ---: | ---: |
| `OWNER` | Full Project, Task, workflow, and membership control | Yes | Yes |
| `CONTRIBUTOR` | Can read the Project and manage Tasks | Yes | Yes |
| `REVIEWER` | Read-only Project and Task access | No | Yes |

Assignee and Reporter eligibility are different. Reviewers cannot be Assignees, but an explicit Reviewer may be selected as a Reporter because Reporter assignment grants no additional permissions.

An internal Workspace member with only implicit access to an open Project is treated as a non-member reviewer and cannot be selected as an Assignee or Reporter.

A guest with explicit `CONTRIBUTOR` membership may be selected as either an Assignee or Reporter. A guest with explicit `REVIEWER` membership may be selected only as a Reporter.

---

## 7. Project visibility

| Visibility | Behaviour                                                            |
| ---------- | -------------------------------------------------------------------- |
| `open`     | Ordinary internal Workspace members receive implicit reviewer access |
| `private`  | Explicit Project membership is required                              |

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

### List and manage Workspace members

```http
GET /api/workspaces/:workspaceId/members
```
Requires Workspace member-management permission.

The response includes:

- the Workspace summary;
- every Workspace member;
- every Project in the Workspace;
- each member's effective Project access;
- pending internal and guest invitations;
- the authenticated user's ID.

Example response:

```json
{
  "workspace": {
    "id": "collaboard-workspace",
    "name": "CollaBoard Workspace",
    "slug": "collaboard-workspace",
    "ownerId": "owner-user-id"
  },
  "members": [
    {
      "userId": "member-user-id",
      "name": "Member Name",
      "email": "member@example.com",
      "workspaceRole": "MEMBER",
      "memberType": "INTERNAL",
      "workspacePermissions": [],
      "isWorkspaceOwner": false,
      "projectAccess": [
        {
          "projectId": "collabboard-development",
          "projectKey": "CBD",
          "name": "CollaBoard Development",
          "visibility": "open",
          "hasAccess": true,
          "accessSource": "EXPLICIT",
          "projectRole": "CONTRIBUTOR",
          "permissions": [],
          "isProjectMember": true,
          "isProjectOwner": false
        }
      ]
    }
  ],
  "projects": [
    {
      "id": "collabboard-development",
      "projectKey": "CBD",
      "name": "CollaBoard Development",
      "visibility": "open"
    }
  ],
  "pendingInvitations": [],
  "currentUserId": "owner-user-id",
  "canManageMembers": true
}
```

### Change a Workspace member's role

```http
PATCH /api/workspaces/:workspaceId/members/:userId
```

Request:

```json
{
  "role": "MEMBER"
}
```

Editable roles are:

```text
ADMIN
MEMBER
GUEST
```

Rules:

- the Workspace Owner's role cannot be changed;
- users cannot change their own Workspace role;
- only the Workspace Owner can grant or remove `ADMIN`;
- a Project Owner cannot become a guest until Project ownership is transferred;
- changing between internal and guest access recalculates inherited open-Project access.

### Grant or update explicit Project access

```http
PUT /api/workspaces/:workspaceId/members/:userId/projects/:projectId
```

Request:

```json
{
  "role": "CONTRIBUTOR"
}
```

Allowed roles:

```text
CONTRIBUTOR
REVIEWER
```

The endpoint creates explicit Project membership when none exists and updates the role when membership already exists.

Changing a contributor to a reviewer clears that user's affected Task assignments. It does not change any Task’s immutable creator or current Reporter.

### Remove explicit Project access

```http
DELETE /api/workspaces/:workspaceId/members/:userId/projects/:projectId
```

Removing explicit access:

- preserves inherited Reviewer access to an open Project for internal members;
- removes Task assignments in that Project;
- preserves Task `createdById` and `reporterId` references;
- removes an unused guest Workspace membership when the guest has no remaining Project membership;
- cannot remove a Project Owner.

Inherited access cannot be removed individually.

### Remove a Workspace member

```http
DELETE /api/workspaces/:workspaceId/members/:userId
```

Removing a Workspace member also:

- removes their Project memberships in the Workspace;
- clears their Task assignments in those Projects;
- preserves historical Task creator and Reporter references;
- cancels applicable pending invitations;
- removes inherited access to open Projects.

The Workspace Owner cannot be removed. Project ownership must be transferred before removing a Project Owner.

### Create Workspace-level Project invitations

```http
POST /api/workspaces/:workspaceId/invitations
```

Requires Workspace member-management permission.

The endpoint creates one Project invitation for every valid Project selection.

Request:

```json
{
  "email": "developer@example.com",
  "memberType": "GUEST",
  "projects": [
    {
      "projectId": "collabboard-development",
      "role": "CONTRIBUTOR"
    },
    {
      "projectId": "m1-planning",
      "role": "REVIEWER"
    }
  ]
}
```

Rules:

- a valid email address is required;
- the inviter cannot invite themselves;
- `memberType` must be `INTERNAL` or `GUEST`;
- at least one Project must be selected;
- every selected Project must belong to the Workspace;
- a Project cannot be selected more than once;
- each role must be `CONTRIBUTOR` or `REVIEWER`;
- Project ownership cannot be granted through an invitation;
- existing Project members are skipped;
- duplicate pending invitations are skipped;
- valid selections are still created when another selection is skipped;
- an existing non-guest Workspace member is treated as `INTERNAL`.

Successful response:

```http
201 Created
```

Example:

```json
{
  "message": "1 invitation created",
  "invitations": [
    {
      "id": "generated-invitation-id",
      "workspaceId": "collaboard-workspace",
      "projectId": "collabboard-development",
      "email": "developer@example.com",
      "role": "CONTRIBUTOR",
      "memberType": "GUEST",
      "status": "PENDING",
      "project": {
        "id": "collabboard-development",
        "projectKey": "CBD",
        "name": "CollaBoard Development",
        "visibility": "open"
      }
    }
  ],
  "skippedProjects": [
    {
      "projectId": "m1-planning",
      "projectKey": "M1",
      "projectName": "Milestone 1 Planning",
      "reason": "PENDING_INVITATION_EXISTS",
      "message": "A pending invitation already exists"
    }
  ]
}
```

When every selection is skipped:

```http
409 Conflict
```

### Cancel a pending Workspace invitation

```http
DELETE /api/workspaces/:workspaceId/invitations/:invitationId
```

Requires Workspace member-management permission.

The invitation must:

- belong to the selected Workspace;
- currently have `PENDING` status.

Successful cancellation changes the status to:

```text
CANCELLED
```

and records the response time in `respondedAt`.

Attempting to cancel an invitation that is no longer pending returns:

```http
404 Not Found
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

Deleting a Project also deletes its Tasks, Project memberships, and invitations.

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
      "userId": "owner-user-id",
      "name": "Ayesha Perera",
      "email": "owner@collaboard.test",
      "projectRole": "OWNER",
      "canBeAssigned": true,
      "workspaceRole": "OWNER",
      "memberType": "INTERNAL",
      "joinedAt": "2026-08-21T00:00:00.000Z"
    },
    {
      "userId": "contributor-user-id",
      "name": "Dilan Fernando",
      "email": "contributor@collaboard.test",
      "projectRole": "CONTRIBUTOR",
      "canBeAssigned": true,
      "workspaceRole": "MEMBER",
      "memberType": "INTERNAL",
      "joinedAt": "2026-08-21T00:00:00.000Z"
    },
    {
      "userId": "reviewer-user-id",
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

The `canBeAssigned` property is calculated by the server and describes Assignee eligibility only. It is `true` only for Project Owners and Contributors. Reporter selection uses explicit Project membership instead, so an explicit Reviewer may still be offered as a Reporter.

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
    "userId": "contributor-user-id",
    "name": "Dilan Fernando",
    "projectRole": "REVIEWER",
    "canBeAssigned": false
  },
  "unassignedTaskCount": 2
}
```

Changing a contributor to a reviewer automatically:

- removes that user’s ID from every assigned Task;
- preserves other Assignees on those Tasks;
- preserves Task creator and Reporter references;
- increments each affected Task version;
- updates each affected Task’s `updatedAt` timestamp.

Restoring the user to `CONTRIBUTOR` does not automatically add them back to previous Tasks.

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

Removing a Project member:

- removes that user’s ID from every assigned Task;
- preserves other Assignees;
- preserves Task `createdById` and `reporterId` references;
- increments each affected Task version.

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

Both `OWNER` and `CONTRIBUTOR` are assignable roles, so ownership transfer does not remove either user from Task assignments.

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

| Property      | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `id`          | Stable identifier stored by Tasks                   |
| `name`        | User-facing status and column name                  |
| `color`       | Six-digit hexadecimal display colour                |
| `position`    | Current position in the Project workflow            |
| `isCompleted` | Indicates whether Tasks in the status are completed |

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

New custom statuses are inserted immediately before the first completed status.

Workflow Status rules:

- a Project can contain a maximum of 12 statuses;
- names cannot exceed 40 characters;
- names must be unique inside the Project;
- duplicate-name checking is case-insensitive;
- colours must be six-digit hexadecimal values;
- newly created custom statuses are non-completed.

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

### Reorder Workflow Statuses

```http
PUT /api/projects/:projectId/statuses/order
```

Request:

```json
{
  "statusIds": ["todo", "review-status-id", "doing", "done"]
}
```

Reordering rules:

- the complete Workflow Status collection is required;
- identifiers must be non-empty strings;
- identifiers cannot be duplicated;
- every identifier must belong to the same Project;
- every current status must appear exactly once;
- completed statuses must remain after active statuses;
- positions are reassigned from zero;
- Task status identifiers do not change;
- Task versions do not increment;
- the Project’s `updatedAt` timestamp is updated.

### Delete a Workflow Status

```http
DELETE /api/projects/:projectId/statuses/:statusId
```

An empty status can be deleted using:

```json
{}
```

When the status contains Tasks, a replacement is required:

```json
{
  "replacementStatusId": "doing"
}
```

Deletion rules:

- a Project must retain at least one Workflow Status;
- the only completed status cannot be deleted;
- the replacement must belong to the same Project;
- affected Tasks move to the replacement status;
- every moved Task version increments;
- positions are normalized.

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
  "assigneeIds": [
    "owner-user-id",
    "contributor-user-id"
  ],
  "createdById": "creator-user-id",
  "reporterId": "reporter-user-id",
  "reporter": {
    "userId": "reporter-user-id",
    "name": "Riley Reviewer",
    "email": "internal.reviewer@collaboard.dev"
  },
  "canAssignReporter": true,
  "version": 3,
  "createdAt": "2026-08-21T00:00:00.000Z",
  "updatedAt": "2026-08-21T02:00:00.000Z"
}
```

| Property | Required | Purpose |
| --- | ---: | --- |
| `id` | Yes | Stable Task identifier |
| `projectId` | Yes | Project containing the Task |
| `title` | Yes | Task title |
| `description` | Yes | Task description, which may be empty |
| `status` | Yes | Workflow Status identifier belonging to the same Project |
| `dueDate` | No | Optional `YYYY-MM-DD` deadline or `null` |
| `assigneeIds` | Yes | Duplicate-free array of eligible Project-member user IDs |
| `createdById` | Yes | Immutable user ID of the authenticated user who originally created the Task |
| `reporterId` | Yes | User ID of the currently assigned Reporter |
| `reporter` | API response | Display-ready Reporter identity containing `userId`, `name`, and `email` |
| `canAssignReporter` | API response | Whether the authenticated user may reassign this Task’s Reporter |
| `version` | Yes | Optimistic-concurrency version |
| `createdAt` | Yes | Creation timestamp |
| `updatedAt` | Yes | Last-update timestamp |

`createdById` is assigned automatically from the authenticated user and cannot be changed.

`reporterId` identifies the currently assigned Reporter. It is independent of both the original Task creator and the Task’s Assignees.

`reporter` is generated for API responses by resolving `reporterId` against the user collection. It is not separately stored or supplied by clients.

`canAssignReporter` is calculated for the authenticated user and is not stored with the Task.

Changing a Reporter does not:

- change `createdById`;
- add the Reporter to `assigneeIds`;
- grant the Reporter additional permissions;
- change the title, description, status, Due Date, or Assignees.

An unassigned Task stores:

```json
{
  "assigneeIds": []
}
```

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
  "assigneeIds": [
    "owner-user-id"
  ],
  "reporterId": "reporter-user-id"
}
```

Only `title` is always required.

If `description` is omitted, it defaults to an empty string.

If `status` is omitted, the server selects the first non-completed Workflow Status according to its position.

If `dueDate` is omitted, empty, or `null`, it is stored as `null`.

If `assigneeIds` is omitted or `null`, it is stored as an empty array.

`reporterId` is optional. If it is omitted, the authenticated creator becomes the Reporter.

The supplied `status` must belong to the same Project.

Every supplied Assignee ID must identify an explicit owner or contributor in the same Project.

The supplied Reporter must be a registered, explicit member of the same Project. Project Owners, Contributors, and Reviewers may be selected as Reporters. Implicit viewers of open Projects and users from other Projects are not eligible.

The server always sets:

```json
{
  "createdById": "authenticated-user-id"
}
```

Clients must not supply `createdById`. Attempts return:

```http
400 Bad Request
```

```json
{
  "message": "Task creator is assigned automatically from the authenticated user"
}
```

An invalid, removed, or non-member Reporter returns:

```http
400 Bad Request
```

```json
{
  "message": "Reporter must be a current Project member"
}
```

Successful response:

```json
{
  "task": {
    "id": "task-identifier",
    "projectId": "project-identifier",
    "title": "Create API documentation",
    "description": "Document all Project routes.",
    "status": "doing",
    "dueDate": "2026-08-30",
    "assigneeIds": [
      "owner-user-id"
    ],
    "createdById": "authenticated-user-id",
    "reporterId": "reporter-user-id",
    "reporter": {
      "userId": "reporter-user-id",
      "name": "Riley Reviewer",
      "email": "internal.reviewer@collaboard.dev"
    },
    "canAssignReporter": true,
    "version": 1,
    "createdAt": "2026-08-21T00:00:00.000Z",
    "updatedAt": "2026-08-21T00:00:00.000Z"
  }
}
```

### Due Date validation

A non-empty Due Date must:

- be a string;
- use exact `YYYY-MM-DD` format;
- represent a real calendar date;
- use a four-digit year of at least `1000`.

Invalid Due Dates return:

```http
400 Bad Request
```

### Multiple-Assignee validation

`assigneeIds` may be:

- an empty array;
- an array containing one eligible user ID;
- an array containing multiple eligible user IDs;
- `null`, which normalizes to an empty array.

The array must:

- contain only non-empty strings;
- contain no duplicate IDs;
- contain only registered users;
- contain only explicit members of the Task’s Project;
- contain only owners or contributors.

The API rejects:

- a single string instead of an array;
- numbers;
- objects;
- duplicate IDs;
- reviewers;
- implicit open-Project viewers;
- members of another Project;
- removed or unknown users.

Example invalid response:

```json
{
  "message": "Every Assignee must be an owner or contributor in this project"
}
```

### Open a Task

```http
GET /api/tasks/:taskId
```

The response includes the resolved `reporter` and the authenticated user’s `canAssignReporter` capability.

### Update a Task

```http
PATCH /api/tasks/:taskId
```

Ordinary Task-field update:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "review-status-id",
  "dueDate": "2026-09-05",
  "assigneeIds": [
    "owner-user-id",
    "another-contributor-id"
  ],
  "version": 1
}
```

Reporter-only update:

```json
{
  "reporterId": "new-reporter-user-id",
  "version": 1
}
```

At least one editable property or a different Reporter must be provided:

```text
title
description
status
dueDate
assigneeIds
reporterId
```

A valid current `version` is required for every update.

The ordinary `UPDATE_TASK` permission controls changes to `title`, `description`, `status`, `dueDate`, and `assigneeIds`.

The Reporter may be reassigned by:

- the original Task creator, while still an explicit Project member;
- the Project Owner;
- the Workspace Owner;
- a Workspace Admin.

Other Contributors may edit ordinary Task fields but cannot reassign the Reporter on a Task created by someone else.

A user who can reassign only the Reporter may submit `reporterId` and `version`, but cannot use that authorization to change ordinary Task fields.

The replacement Reporter must be a current explicit member of the same Project. Owners, Contributors, and Reviewers are eligible.

Unauthorized Reporter reassignment returns:

```http
403 Forbidden
```

```json
{
  "message": "You cannot assign the Reporter for this Task"
}
```

An invalid Reporter returns:

```http
400 Bad Request
```

```json
{
  "message": "Reporter must be a current Project member"
}
```

Clients must not supply `createdById`. Attempts return:

```http
400 Bad Request
```

```json
{
  "message": "A Task creator cannot be changed"
}
```

Submitting the existing Reporter without another update returns:

```http
400 Bad Request
```

```json
{
  "message": "Provide a title, description, status, Due Date, Assignees, or a different Reporter to update"
}
```

Changing the Reporter:

- leaves `createdById` unchanged;
- leaves `assigneeIds` unchanged;
- increments `version` once;
- updates `updatedAt`;
- returns the resolved new `reporter` and recalculated `canAssignReporter` capability.

Updating `assigneeIds` replaces the complete Assignee collection.

For example, if the Task currently contains:

```json
{
  "assigneeIds": [
    "user-one",
    "user-two"
  ]
}
```

and the update submits:

```json
{
  "assigneeIds": [
    "user-two",
    "user-three"
  ],
  "version": 2
}
```

the final collection becomes:

```json
{
  "assigneeIds": [
    "user-two",
    "user-three"
  ]
}
```

After any successful update, the Task version increments once regardless of how many fields, Assignees, or Reporter values changed.

### Removing a Due Date

A Due Date can be removed using `null` or an empty string:

```json
{
  "dueDate": null,
  "version": 2
}
```

### Removing all Assignees

Submit an empty array:

```json
{
  "assigneeIds": [],
  "version": 2
}
```

The API also accepts:

```json
{
  "assigneeIds": null,
  "version": 2
}
```

`null` is normalized to an empty array.

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
    "createdById": "creator-user-id",
    "reporterId": "reporter-user-id",
    "reporter": {
      "userId": "reporter-user-id",
      "name": "Riley Reviewer",
      "email": "internal.reviewer@collaboard.dev"
    },
    "canAssignReporter": true,
    "version": 2
  }
}
```

The client must load the returned current Task before trying again.

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

A Task cannot retain a user who no longer has an assignable role in its Project.

### Contributor downgraded to reviewer

When an assigned contributor becomes a reviewer:

- only that contributor’s ID is removed from `assigneeIds`;
- other Assignees remain;
- the affected Task version increments;
- the Task receives a new `updatedAt` timestamp.

Example:

```json
{
  "assigneeIds": ["owner-id", "contributor-id"]
}
```

becomes:

```json
{
  "assigneeIds": ["owner-id"]
}
```

### Project member removed

When an assigned member is removed:

- only that member’s ID is removed;
- other Assignees remain;
- each affected Task version increments;
- each affected Task receives a new `updatedAt` timestamp.

### Project ownership transferred

Ownership transfer does not remove assignments because:

- the new owner has the assignable `OWNER` role;
- the previous owner receives the assignable `CONTRIBUTOR` role.

Automatic Assignee cleanup does not:

- delete the Task;
- remove other eligible Assignees;
- change the title;
- change the description;
- change the workflow status;
- change the Due Date;
- change `createdById`;
- automatically change or clear `reporterId`.

If the current Reporter is removed from Project membership, the Task retains that historical Reporter reference and continues resolving the user’s display identity. An authorized user may later reassign the Task to a current Project member.

If the original creator is removed from Project membership, `createdById` remains unchanged for audit history. The removed creator no longer qualifies for creator-based Reporter reassignment unless they become an explicit Project member again.

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

| Status             | Meaning                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `200 OK`           | Successful read or update                                        |
| `201 Created`      | Resource created                                                 |
| `204 No Content`   | Resource deleted                                                 |
| `400 Bad Request`  | Invalid request data                                             |
| `401 Unauthorized` | Missing, invalid, or expired token                               |
| `403 Forbidden`    | Authenticated but insufficient permission                        |
| `404 Not Found`    | Resource or accessible resource not found                        |
| `409 Conflict`     | Duplicate resource, invalid transition, or Task version conflict |

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
- Task creator and Reporter changes;
- created, renamed, recoloured, reordered, and deleted Workflow Statuses.

Seeded Tasks use:

```json
{
  "dueDate": null,
  "assigneeIds": [],
  "createdById": "seed-creator-user-id",
  "reporterId": "seed-reporter-user-id",
  "version": 1
}
```

MongoDB persistence will replace this temporary behaviour in a later milestone.
