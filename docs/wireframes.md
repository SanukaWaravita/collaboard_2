# CollabBoard Wireframes

These wireframes describe the initial layout of the Milestone 1 interface. They represent structure and functionality rather than final colours, typography, or branding.

## 1. Login page

```mermaid
flowchart TD
    Brand["CollabBoard"]
    Title["Log in to your account"]
    Email["Email address input"]
    Password["Password input"]
    Submit["Log In button"]
    Register["Link: Create an account"]

    Brand --> Title
    Title --> Email
    Email --> Password
    Password --> Submit
    Submit --> Register
```

The login form will be displayed in a centred card.

## 2. Register page

```mermaid
flowchart TD
    Brand["CollabBoard"]
    Title["Create an account"]
    Name["Name input"]
    Email["Email address input"]
    Password["Password input"]
    Confirm["Confirm password input"]
    Submit["Register button"]
    Login["Link: Already have an account?"]

    Brand --> Title
    Title --> Name
    Name --> Email
    Email --> Password
    Password --> Confirm
    Confirm --> Submit
    Submit --> Login
```

The registration form will use the same visual structure as the login form.

## 3. Boards page

```mermaid
flowchart TD
    Nav["Navigation bar: Logo | Boards | User"]
    Heading["My Boards"]
    Create["Create Board button"]

    subgraph Grid["Board grid"]
        B1["Board card: Website Project"]
        B2["Board card: Group Assignment"]
        B3["Board card: Personal Tasks"]
    end

    Nav --> Heading
    Heading --> Create
    Create --> Grid
```

Each board card will display:

- board name;
- short description;
- last-updated information;
- button or link for opening the board.

## 4. Individual board page

```mermaid
flowchart TD
    Nav["Navigation bar"]
    Header["Board name | Add Task button"]

    subgraph Kanban["Kanban board"]
        direction LR

        subgraph Todo["To Do"]
            T1["Task card"]
            T2["Task card"]
        end

        subgraph Doing["Doing"]
            D1["Task card"]
        end

        subgraph Done["Done"]
            C1["Task card"]
        end
    end

    Nav --> Header
    Header --> Kanban
```

Each task card will display:

- task title;
- short description;
- current status;
- Edit button;
- Delete button.

Selecting **Add Task** will display the task form.

## 5. Task form

```mermaid
flowchart TD
    Title["Create or edit task"]
    Name["Task title input"]
    Description["Description input"]
    Status["Status selector"]
    Actions["Cancel button | Save Task button"]

    Title --> Name
    Name --> Description
    Description --> Status
    Status --> Actions
```

The form may be displayed as a modal or as a panel on the board page.

## 6. Initial navigation flow

```mermaid
flowchart LR
    Login["Login"] --> Boards["Boards"]
    Register["Register"] --> Boards
    Boards --> Board["Individual Board"]
    Board --> TaskForm["Create/Edit Task"]
    TaskForm --> Board
```

These wireframes may be refined as implementation progresses, while preserving the required screens and core functionality.