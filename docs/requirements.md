# CollabBoard Requirements

## 1. Project overview

CollabBoard is a collaborative Kanban task-management application. It allows registered users to create boards and organize tasks into three workflow stages:

- To Do
- Doing
- Done

The application will eventually support persistent storage, real-time updates, offline draft recovery, and simultaneous-edit conflict detection.

## 2. Target users

The target users are small teams that need a shared space for organizing and monitoring tasks.

## 3. Core functional requirements

### User authentication

- FR-01: A user shall be able to register an account.
- FR-02: A registered user shall be able to log in.
- FR-03: The system shall protect board and task operations from unauthenticated users.
- FR-04: A logged-in user shall be able to log out.

### Board management

- FR-05: A user shall be able to view their available boards.
- FR-06: A user shall be able to create a board.
- FR-07: A user shall be able to open a board and view its tasks.
- FR-08: A user shall be able to edit or delete a board.

### Task management

- FR-09: A user shall be able to create a task.
- FR-10: A user shall be able to edit a task.
- FR-11: A user shall be able to delete a task.
- FR-12: A user shall be able to move a task between To Do, Doing, and Done.
- FR-13: Each task shall contain a title, description, and status.

### Persistence and collaboration

- FR-14: Board and task information shall be stored in MongoDB.
- FR-15: The client shall preserve unfinished work using localStorage or IndexedDB.
- FR-16: Connected users shall receive task changes in real time.
- FR-17: The system shall detect conflicting simultaneous task updates.
- FR-18: The user shall be notified when another user has already changed the task being edited.

## 4. Non-functional requirements

- NFR-01: The interface should work on desktop and mobile screen sizes.
- NFR-02: The codebase should use reusable React components.
- NFR-03: The server should follow a routes, controllers, and models structure.
- NFR-04: Authentication credentials and protected data must be handled securely.
- NFR-05: The project must contain automated client and server tests.
- NFR-06: Tests must run through GitHub Actions.
- NFR-07: The complete application must be runnable using Docker Compose.
- NFR-08: The final application must be deployed to a publicly accessible URL.

## 5. Milestone 1 scope

Milestone 1 will include:

- a React application created with Vite;
- Login and Register page layouts;
- a Boards page;
- an individual Board page;
- three Kanban columns;
- reusable task-card components;
- temporary mock task data;
- basic responsive styling;
- wireframes;
- a component-tree diagram;
- a GitHub repository with meaningful commit history.

Milestone 1 will not include a working server, database, JWT authentication, or real-time communication. These will be introduced during later milestones.

## 6. Initial task data structure

Each temporary task will use the following structure:

```js
{
  id: 1,
  title: "Create login page",
  description: "Build the initial login interface",
  status: "todo"
}
```
