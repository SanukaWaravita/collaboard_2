# CollaBoard

CollaBoard is a collaborative Kanban task-management application developed as a third-year group project. It organizes work using a **Workspace → Project → Workflow Status → Task** hierarchy and provides role-based access for internal members and guests.

Users can create Workspaces and Projects, manage Project access, customize workflows, assign Tasks to eligible members, and work in either Kanban or List view.

## Current status

The current development build provides a React client connected to a protected Express REST API.

Implemented:

- user registration and login;
- password hashing and JWT authentication;
- protected client and server routes;
- Workspace creation, viewing, editing, and deletion;
- Workspace Owner, Admin, Member, and Guest roles;
- Workspace-wide member and Project-access management;
- Project creation, viewing, editing, and deletion;
- open and private Project visibility;
- Project Owner, Contributor, and Reviewer roles;
- Project invitations for internal users and guests;
- Workspace-level bulk invitations across multiple Projects;
- independent Contributor or Reviewer roles for each invited Project;
- invitation acceptance, decline, and cancellation;
- customizable Project workflow statuses;
- Kanban and List task views;
- Task creation, viewing, editing, movement, and deletion;
- drag-and-drop Task movement;
- multiple Task Assignees;
- Task Due Dates and due-state indicators;
- Task-version conflict detection;
- consistent JSON error responses;
- optional development seed data;
- responsive layouts.

## Domain model

```text
Workspace
├── Workspace members
│   ├── Owner
│   ├── Admin
│   ├── Member
│   └── Guest
└── Projects
    ├── Project members
    │   ├── Owner
    │   ├── Contributor
    │   └── Reviewer
    ├── Workflow statuses
    └── Tasks
        ├── Assignees
        ├── Due Date
        └── Version
```

A Workspace can represent a department, team, or other organizational unit. Projects contain their own membership rules, workflows, and Tasks.

## Access model

### Workspace roles

| Role   | Purpose                                                            |
| ------ | ------------------------------------------------------------------ |
| Owner  | Full control of the Workspace and its access model                 |
| Admin  | Manages Workspace members and access, subject to owner protections |
| Member | Internal Workspace user who may inherit access to open Projects    |
| Guest  | External Workspace user who requires explicit Project access       |

### Project roles

| Role        | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| Owner       | Full Project control, including access and workflow management |
| Contributor | Creates, edits, moves, and completes Tasks                     |
| Reviewer    | Read-only Project access                                       |

### Open and private Projects

- **Open Project:** internal Workspace members can discover and read it even without explicit Project membership. Their inherited access is equivalent to read-only Reviewer access.
- **Private Project:** only explicit Project members can access it.
- **Guests:** never inherit access to open Projects. A guest must be explicitly added to each Project they need to access.
- **Task Assignees:** Project Owners and Contributors are eligible Assignees. Reviewers are not assignable.

### Members & Access

Workspace Owners and Admins can open the **Members & Access** page to:

- view every internal member and guest in the Workspace;
- see each member's Workspace role and relationship type;
- inspect every Project the member can access;
- distinguish explicit access from inherited open-Project access;
- inspect the member's effective Project role and permissions;
- change eligible Workspace roles;
- grant explicit Project access;
- change a Project member between Contributor and Reviewer;
- remove explicit Project access without removing inherited open-Project access;
- invite internal members or guests to multiple Projects in one operation;
- assign an independent Contributor or Reviewer role to every selected Project;
- review and cancel pending internal and guest invitations;
- remove a Workspace member, subject to ownership protections.

Removing a Workspace member also removes that user from the Workspace's Projects, clears their Task assignments in those Projects, and cleans up applicable pending invitations. Workspace and Project owners must be reassigned before they can be removed or changed in a way that would leave owned resources without an owner.

## Technology stack

| Area                       | Technology                                           |
| -------------------------- | ---------------------------------------------------- |
| Client                     | React                                                |
| Build tool                 | Vite                                                 |
| Routing                    | React Router                                         |
| Styling                    | CSS                                                  |
| Server                     | Node.js and Express                                  |
| Authentication             | JSON Web Tokens                                      |
| Password hashing           | bcrypt.js                                            |
| Current data storage       | Temporary in-memory store                            |
| Client session persistence | `localStorage`                                       |
| Database                   | MongoDB and Mongoose — planned                       |
| Testing                    | Jest, Supertest, and React Testing Library — planned |
| Real-time updates          | Socket.IO — planned                                  |
| Deployment                 | Docker Compose and public hosting — planned          |

## Prerequisites

Install:

- Node.js 22 or newer;
- npm;
- Git.

## Installation

Clone the repository:

```bash
git clone https://github.com/SanukaWaravita/collaboard_2.git
cd collaboard_2
```

Install client dependencies:

```bash
cd client
npm install
cd ..
```

Install server dependencies:

```bash
cd server
npm install
cd ..
```

If the repository URL changes, use the exact URL shown under the GitHub repository's **Code** button.

## Server configuration

Create a local environment file from the example:

```bash
cd server
cp .env.example .env
```

Configure the following values in `server/.env`:

```dotenv
PORT=5000
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=1h
SEED_DEVELOPMENT_DATA=true
DEVELOPMENT_SEED_PASSWORD=CollaBoard123!
```

Generate a random development JWT secret with:

```bash
openssl rand -hex 32
```

Replace the placeholder `JWT_SECRET` with the generated value. Do not commit the real `.env` file; the required variable names belong in `server/.env.example`.

## Development seed data

Because CollaBoard currently uses an in-memory store, optional seed data is available for repeatable local testing.

Enable it in the ignored `server/.env` file:

```dotenv
SEED_DEVELOPMENT_DATA=true
DEVELOPMENT_SEED_PASSWORD=CollaBoard123!
```

The seed is development-only and will not load when `NODE_ENV=production`.

Unless `DEVELOPMENT_SEED_PASSWORD` is changed, all sample accounts use:

```text
CollaBoard123!
```

### Sample accounts

| User                     | Email                                 | Testing purpose                           |
| ------------------------ | ------------------------------------- | ----------------------------------------- |
| Olivia Owner             | `owner@collaboard.dev`                | Workspace and Project ownership           |
| Adrian Admin             | `admin@collaboard.dev`                | Workspace administration                  |
| Casey Contributor        | `internal.contributor@collaboard.dev` | Internal contribution and Task assignment |
| Riley Reviewer           | `internal.reviewer@collaboard.dev`    | Explicit internal Reviewer restrictions   |
| Morgan Observer          | `observer@collaboard.dev`             | Inherited access to open Projects         |
| Jordan Guest Contributor | `guest.contributor@collaboard.dev`    | Explicit guest Contributor access         |
| Taylor Guest Reviewer    | `guest.reviewer@collaboard.dev`       | Explicit guest Reviewer restrictions      |
| Avery Invitee            | `invitee@collaboard.dev`              | Pending invitation flow                   |

The seed includes:

- two Workspaces;
- open and private Projects;
- internal and guest memberships;
- explicit and inherited Project access;
- default and custom workflows;
- Tasks across multiple statuses;
- unassigned, singly assigned, and multiply assigned Tasks;
- relative Due Dates representing overdue, due-soon, and later work;
- a pending invitation.

Restarting the API resets runtime changes and restores the original seed state.

To run with an empty development store instead, set:

```dotenv
SEED_DEVELOPMENT_DATA=false
```

### Aurora Digital Solutions demo accounts

The company demonstration data represents a fictional organization with departmental Workspaces.

| User                | Email                            | Testing purpose                                                |
| ------------------- | -------------------------------- | -------------------------------------------------------------- |
| Nadia Perera        | `company.rep@aurora.example`     | Company representative and Owner of every department Workspace |
| Ashan Silva         | `product.lead@aurora.example`    | Product & Engineering administration                           |
| Dinithi Jayasinghe  | `marketing.lead@aurora.example`  | Marketing & Growth administration                              |
| Kavindu Fernando    | `sales.lead@aurora.example`      | Sales & Partnerships administration                            |
| Malsha Wijeratne    | `success.lead@aurora.example`    | Customer Success administration                                |
| Nethmi Karunaratne  | `people.lead@aurora.example`     | People & Culture administration                                |
| Tharindu Senanayake | `operations.lead@aurora.example` | Finance & Operations administration                            |

Unless `DEVELOPMENT_SEED_PASSWORD` is changed, all company demo accounts use:

```text
CollaBoard123!
```

The Aurora company demonstration includes:

- one company-representative account;
- six department-lead accounts;
- six department Workspaces;
- two members per Workspace;
- three Projects per department;
- 18 Projects altogether;
- open and private Project visibility;
- default To Do, Doing and Done workflows;
- five Tasks per Project;
- 90 realistic Tasks altogether;
- completed, overdue, current, upcoming and unset Due Dates;
- unassigned, singly assigned and multiply assigned Tasks;
- explicit Workspace and Project memberships.

### Validate the company demo seed

Ensure development seed data is enabled, then run:

```bash
cd server
npm run validate:company-seed
```

The validator checks:

- expected company data totals;
- duplicate identifiers;
- Workspace ownership and memberships;
- Project ownership and memberships;
- Project workflow statuses;
- Task-to-Project relationships;
- Task assignee memberships;
- Task status, version and Due Date values.

## Running the application

The client and server run in separate terminals.

### Terminal 1: API server

```bash
cd server
npm run dev
```

The API normally runs at:

```text
http://localhost:5000
```

### Terminal 2: React client

```bash
cd client
npm run dev
```

Open the URL displayed by Vite, normally:

```text
http://localhost:5173
```

## Available scripts

### Client scripts

Run from `client`:

| Command           | Purpose                              |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run lint`    | Check client code with ESLint        |
| `npm run build`   | Create the production client build   |
| `npm run preview` | Preview the production build locally |

### Server scripts

Run from `server`:

| Command       | Purpose                    |
| ------------- | -------------------------- |
| `npm run dev` | Start the API with Nodemon |
| `npm start`   | Start the API with Node.js |

Automated test scripts are planned but are not yet part of the current repository.

## Client routes

| Route                                                 | Access                               | Screen                             |
| ----------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| `/login`                                              | Public                               | Login                              |
| `/register`                                           | Public                               | Registration                       |
| `/workspaces`                                         | Protected                            | Accessible Workspaces              |
| `/workspaces/:workspaceId/projects`                   | Protected                            | Workspace Projects                 |
| `/workspaces/:workspaceId/members`                    | Workspace management permission      | Members & Access                   |
| `/workspaces/:workspaceId/projects/:projectId`        | Project access required              | Kanban/List Project view           |
| `/workspaces/:workspaceId/projects/:projectId/access` | Project access management permission | Project members and invitations    |
| `/invitations`                                        | Protected                            | Current user's pending invitations |

## API overview

Local API base URL:

```text
http://localhost:5000/api
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

### Public endpoints

| Method | Endpoint             | Purpose          |
| ------ | -------------------- | ---------------- |
| `POST` | `/api/auth/register` | Register a user  |
| `POST` | `/api/auth/login`    | Log in           |
| `GET`  | `/api/health`        | Check API health |

### Workspace endpoints

| Method   | Endpoint                                | Purpose                                 |
| -------- | --------------------------------------- | --------------------------------------- |
| `GET`    | `/api/workspaces`                       | List accessible Workspaces              |
| `POST`   | `/api/workspaces`                       | Create a Workspace                      |
| `GET`    | `/api/workspaces/:workspaceId`          | Get a Workspace                         |
| `PATCH`  | `/api/workspaces/:workspaceId`          | Update a Workspace                      |
| `DELETE` | `/api/workspaces/:workspaceId`          | Delete a Workspace and its related data |
| `GET`    | `/api/workspaces/:workspaceId/projects` | List accessible Projects in a Workspace |
| `POST`   | `/api/workspaces/:workspaceId/projects` | Create a Project                        |

### Workspace member and access endpoints

| Method   | Endpoint                                                           | Purpose                                               |
| -------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `GET`    | `/api/workspaces/:workspaceId/members`                             | List Workspace members and effective Project access   |
| `PATCH`  | `/api/workspaces/:workspaceId/members/:userId`                     | Change an eligible Workspace role                     |
| `DELETE` | `/api/workspaces/:workspaceId/members/:userId`                     | Remove a Workspace member and related access          |
| `PUT`    | `/api/workspaces/:workspaceId/members/:userId/projects/:projectId` | Grant or update explicit Project access               |
| `DELETE` | `/api/workspaces/:workspaceId/members/:userId/projects/:projectId` | Remove explicit Project access                        |
| `POST`   | `/api/workspaces/:workspaceId/invitations`                         | Create invitations for one or more Workspace Projects |
| `DELETE` | `/api/workspaces/:workspaceId/invitations/:invitationId`           | Cancel a pending Workspace invitation                 |

### Project endpoints

| Method   | Endpoint                                      | Purpose                                      |
| -------- | --------------------------------------------- | -------------------------------------------- |
| `GET`    | `/api/projects`                               | List Projects accessible to the current user |
| `GET`    | `/api/projects/:projectId`                    | Get a Project, workflow, and Tasks           |
| `PATCH`  | `/api/projects/:projectId`                    | Update a Project                             |
| `DELETE` | `/api/projects/:projectId`                    | Delete a Project and its related data        |
| `GET`    | `/api/projects/:projectId/members`            | List explicit Project members                |
| `PATCH`  | `/api/projects/:projectId/members/:userId`    | Change a Project member's role               |
| `DELETE` | `/api/projects/:projectId/members/:userId`    | Remove explicit Project membership           |
| `POST`   | `/api/projects/:projectId/transfer-ownership` | Transfer Project ownership                   |

### Invitation endpoints

| Method   | Endpoint                                             | Purpose                               |
| -------- | ---------------------------------------------------- | ------------------------------------- |
| `GET`    | `/api/projects/:projectId/invitations`               | List pending Project invitations      |
| `POST`   | `/api/projects/:projectId/invitations`               | Invite an internal user or guest      |
| `DELETE` | `/api/projects/:projectId/invitations/:invitationId` | Cancel an invitation                  |
| `GET`    | `/api/invitations`                                   | List invitations for the current user |
| `POST`   | `/api/invitations/:invitationId/accept`              | Accept an invitation                  |
| `POST`   | `/api/invitations/:invitationId/decline`             | Decline an invitation                 |

### Workflow status endpoints

| Method   | Endpoint                                      | Purpose                            |
| -------- | --------------------------------------------- | ---------------------------------- |
| `GET`    | `/api/projects/:projectId/statuses`           | List Project workflow statuses     |
| `POST`   | `/api/projects/:projectId/statuses`           | Create a workflow status           |
| `PATCH`  | `/api/projects/:projectId/statuses/:statusId` | Update a workflow status           |
| `DELETE` | `/api/projects/:projectId/statuses/:statusId` | Delete an eligible workflow status |
| `PUT`    | `/api/projects/:projectId/statuses/order`     | Reorder workflow statuses          |

### Task endpoints

| Method   | Endpoint                         | Purpose             |
| -------- | -------------------------------- | ------------------- |
| `POST`   | `/api/projects/:projectId/tasks` | Create a Task       |
| `GET`    | `/api/tasks/:taskId`             | Get a Task          |
| `PATCH`  | `/api/tasks/:taskId`             | Edit or move a Task |
| `DELETE` | `/api/tasks/:taskId`             | Delete a Task       |

See the [complete API contract](docs/api-contract.md) for request bodies, responses, permissions, status codes, and conflict behavior.

## Project structure

```text
collaboard_2/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── api-contract.md
│   ├── component-tree.md
│   ├── requirements.md
│   └── wireframes.md
├── .gitignore
└── README.md
```

## Current architecture

```mermaid
flowchart TD
    User[User] --> Client[React client]
    Client -->|REST + JWT| API[Express API]
    API --> Auth[Authentication and access checks]
    Auth --> Controllers[Controllers]
    Controllers --> Store[In-memory store]
```

The server enforces permissions independently of the client. Hiding a client control is not treated as authorization; protected operations are validated again by the API.

## Task conflict detection

Each Task contains a numeric `version`.

When a client edits a Task, it submits the version it originally loaded. The server compares that value with the current stored version:

- matching versions allow the update;
- the server increments the version after a successful update;
- an outdated version returns `409 Conflict`;
- the client displays the newest Task instead of silently overwriting it.

This provides the initial approach to concurrent edits. Real-time update delivery is planned with Socket.IO.

## Documentation

- [Requirements](docs/requirements.md)
- [Wireframes](docs/wireframes.md)
- [Component tree](docs/component-tree.md)
- [REST API contract](docs/api-contract.md)

## Current limitations

- All users, Workspaces, Projects, memberships, invitations, workflows, and Tasks are stored only in server memory.
- Restarting the server discards runtime changes.
- When development seeding is enabled, restarting restores the original seeded dataset.
- JWTs are stored in browser `localStorage`.
- MongoDB persistence is not implemented yet.
- Automated client and server tests are not implemented yet.
- Real-time Socket.IO updates are not implemented yet.
- Docker and public deployment are not implemented yet.

These limitations are intended to be addressed in later milestones.

## Development workflow

The repository uses:

- `main` for stable milestone releases;
- `develop` for integrated development;
- `feature/*`, `fix/*`, and `docs/*` for isolated changes.

Changes are merged through pull requests with meaningful incremental commit history. Before opening a pull request, run the relevant lint, build, syntax, and manual access-control checks and review the staged diff.
