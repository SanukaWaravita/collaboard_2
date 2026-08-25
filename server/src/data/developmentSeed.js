import bcrypt from "bcryptjs";
import { createCompanyDemoSeed } from "./companyDemoSeed.js";
import {
  INVITATION_STATUS,
  MEMBER_TYPES,
  PROJECT_ROLES,
  PROJECT_VISIBILITY,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import { createDefaultWorkflowStatuses } from "../utils/workflowStatuses.js";

const DEFAULT_DEVELOPMENT_PASSWORD = "CollaBoard123!";

const USER_IDS = Object.freeze({
  OWNER: "seed-user-owner",
  ADMIN: "seed-user-admin",
  INTERNAL_CONTRIBUTOR: "seed-user-internal-contributor",
  INTERNAL_REVIEWER: "seed-user-internal-reviewer",
  OPEN_OBSERVER: "seed-user-open-observer",
  GUEST_CONTRIBUTOR: "seed-user-guest-contributor",
  GUEST_REVIEWER: "seed-user-guest-reviewer",
  INVITEE: "seed-user-invitee",
});

const WORKSPACE_IDS = Object.freeze({
  COLLABOARD: "collaboard-workspace",
  RESEARCH: "product-research-workspace",
});

const PROJECT_IDS = Object.freeze({
  DEVELOPMENT: "collabboard-development",
  M1_PLANNING: "m1-planning",
  USER_RESEARCH: "user-research",
});

function createResearchWorkflowStatuses() {
  return [
    {
      id: "backlog",
      name: "Backlog",
      color: "#64748b",
      position: 0,
      isCompleted: false,
    },
    {
      id: "interviews",
      name: "Interviews",
      color: "#2563eb",
      position: 1,
      isCompleted: false,
    },
    {
      id: "synthesis",
      name: "Synthesis",
      color: "#9333ea",
      position: 2,
      isCompleted: false,
    },
    {
      id: "complete",
      name: "Complete",
      color: "#16a34a",
      position: 3,
      isCompleted: true,
    },
  ];
}

function getRelativeDateValue(dayOffset) {
  const date = new Date();

  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createUser(definition, passwordHash, timestamp) {
  return {
    ...definition,
    passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createWorkspaceMember(id, workspaceId, userId, role, timestamp) {
  return {
    id,
    workspaceId,
    userId,
    role,
    joinedAt: timestamp,
  };
}

function createProjectMember(id, projectId, userId, role, timestamp) {
  return {
    id,
    projectId,
    userId,
    role,
    joinedAt: timestamp,
  };
}

function getDefaultTaskReporterId(projectId) {
  return projectId === PROJECT_IDS.USER_RESEARCH
    ? USER_IDS.ADMIN
    : USER_IDS.OWNER;
}

function createTask(definition, timestamp) {
  return {
    ...definition,
    reporterId:
      definition.reporterId ?? getDefaultTaskReporterId(definition.projectId),
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createDevelopmentSeed() {
  const timestamp = new Date().toISOString();

  const configuredPassword = process.env.DEVELOPMENT_SEED_PASSWORD?.trim();

  const developmentPassword =
    configuredPassword || DEFAULT_DEVELOPMENT_PASSWORD;

  if (developmentPassword.length < 8) {
    throw new Error(
      "DEVELOPMENT_SEED_PASSWORD must contain at least 8 characters",
    );
  }

  const passwordHash = bcrypt.hashSync(developmentPassword, 10);

  const dueDates = {
    twoWeeksAgo: getRelativeDateValue(-14),
    tenDaysAgo: getRelativeDateValue(-10),
    oneWeekAgo: getRelativeDateValue(-7),
    yesterday: getRelativeDateValue(-1),
    overdue: getRelativeDateValue(-2),
    today: getRelativeDateValue(0),
    tomorrow: getRelativeDateValue(1),
    inTwoDays: getRelativeDateValue(2),
    inThreeDays: getRelativeDateValue(3),
    inFourDays: getRelativeDateValue(4),
    inFiveDays: getRelativeDateValue(5),
    nextWeek: getRelativeDateValue(7),
  };

  const companyDemoSeed = createCompanyDemoSeed({
    passwordHash,
    timestamp,
    dueDates,
  });

  const users = [
    createUser(
      {
        id: USER_IDS.OWNER,
        name: "Olivia Owner",
        email: "owner@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.ADMIN,
        name: "Adrian Admin",
        email: "admin@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.INTERNAL_CONTRIBUTOR,
        name: "Casey Contributor",
        email: "internal.contributor@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.INTERNAL_REVIEWER,
        name: "Riley Reviewer",
        email: "internal.reviewer@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.OPEN_OBSERVER,
        name: "Morgan Observer",
        email: "observer@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.GUEST_CONTRIBUTOR,
        name: "Jordan Guest Contributor",
        email: "guest.contributor@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.GUEST_REVIEWER,
        name: "Taylor Guest Reviewer",
        email: "guest.reviewer@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),

    createUser(
      {
        id: USER_IDS.INVITEE,
        name: "Avery Invitee",
        email: "invitee@collaboard.dev",
      },
      passwordHash,
      timestamp,
    ),
  ];

  const workspaces = [
    {
      id: WORKSPACE_IDS.COLLABOARD,
      name: "CollaBoard Workspace",
      slug: "collaboard-workspace",
      ownerId: USER_IDS.OWNER,
      createdAt: timestamp,
      updatedAt: timestamp,
    },

    {
      id: WORKSPACE_IDS.RESEARCH,
      name: "Product Research",
      slug: "product-research",
      ownerId: USER_IDS.ADMIN,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const workspaceMembers = [
    createWorkspaceMember(
      "seed-wm-collaboard-owner",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.OWNER,
      WORKSPACE_ROLES.OWNER,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-collaboard-admin",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.ADMIN,
      WORKSPACE_ROLES.ADMIN,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-collaboard-contributor",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.INTERNAL_CONTRIBUTOR,
      WORKSPACE_ROLES.MEMBER,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-collaboard-reviewer",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.INTERNAL_REVIEWER,
      WORKSPACE_ROLES.MEMBER,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-collaboard-observer",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.OPEN_OBSERVER,
      WORKSPACE_ROLES.MEMBER,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-collaboard-guest-contributor",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.GUEST_CONTRIBUTOR,
      WORKSPACE_ROLES.GUEST,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-collaboard-guest-reviewer",
      WORKSPACE_IDS.COLLABOARD,
      USER_IDS.GUEST_REVIEWER,
      WORKSPACE_ROLES.GUEST,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-research-owner",
      WORKSPACE_IDS.RESEARCH,
      USER_IDS.ADMIN,
      WORKSPACE_ROLES.OWNER,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-research-admin",
      WORKSPACE_IDS.RESEARCH,
      USER_IDS.OWNER,
      WORKSPACE_ROLES.ADMIN,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-research-reviewer",
      WORKSPACE_IDS.RESEARCH,
      USER_IDS.INTERNAL_REVIEWER,
      WORKSPACE_ROLES.MEMBER,
      timestamp,
    ),

    createWorkspaceMember(
      "seed-wm-research-guest-reviewer",
      WORKSPACE_IDS.RESEARCH,
      USER_IDS.GUEST_REVIEWER,
      WORKSPACE_ROLES.GUEST,
      timestamp,
    ),
  ];

  const projects = [
    {
      id: PROJECT_IDS.DEVELOPMENT,
      workspaceId: WORKSPACE_IDS.COLLABOARD,
      projectKey: "CBD",
      name: "CollaBoard Development",
      description: "Plan and monitor development of the group project.",
      visibility: PROJECT_VISIBILITY.OPEN,
      ownerId: USER_IDS.OWNER,
      workflowStatuses: createDefaultWorkflowStatuses(),
      createdAt: timestamp,
      updatedAt: timestamp,
    },

    {
      id: PROJECT_IDS.M1_PLANNING,
      workspaceId: WORKSPACE_IDS.COLLABOARD,
      projectKey: "M1",
      name: "Milestone 1 Planning",
      description: "Track interface, documentation, and repository work.",
      visibility: PROJECT_VISIBILITY.PRIVATE,
      ownerId: USER_IDS.OWNER,
      workflowStatuses: createDefaultWorkflowStatuses(),
      createdAt: timestamp,
      updatedAt: timestamp,
    },

    {
      id: PROJECT_IDS.USER_RESEARCH,
      workspaceId: WORKSPACE_IDS.RESEARCH,
      projectKey: "UXR",
      name: "User Research",
      description: "Plan interviews and evaluate CollaBoard usability.",
      visibility: PROJECT_VISIBILITY.OPEN,
      ownerId: USER_IDS.ADMIN,
      workflowStatuses: createResearchWorkflowStatuses(),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const projectMembers = [
    createProjectMember(
      "seed-pm-development-owner",
      PROJECT_IDS.DEVELOPMENT,
      USER_IDS.OWNER,
      PROJECT_ROLES.OWNER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-development-admin",
      PROJECT_IDS.DEVELOPMENT,
      USER_IDS.ADMIN,
      PROJECT_ROLES.CONTRIBUTOR,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-development-internal-contributor",
      PROJECT_IDS.DEVELOPMENT,
      USER_IDS.INTERNAL_CONTRIBUTOR,
      PROJECT_ROLES.CONTRIBUTOR,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-development-internal-reviewer",
      PROJECT_IDS.DEVELOPMENT,
      USER_IDS.INTERNAL_REVIEWER,
      PROJECT_ROLES.REVIEWER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-development-guest-contributor",
      PROJECT_IDS.DEVELOPMENT,
      USER_IDS.GUEST_CONTRIBUTOR,
      PROJECT_ROLES.CONTRIBUTOR,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-development-guest-reviewer",
      PROJECT_IDS.DEVELOPMENT,
      USER_IDS.GUEST_REVIEWER,
      PROJECT_ROLES.REVIEWER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-m1-owner",
      PROJECT_IDS.M1_PLANNING,
      USER_IDS.OWNER,
      PROJECT_ROLES.OWNER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-m1-contributor",
      PROJECT_IDS.M1_PLANNING,
      USER_IDS.INTERNAL_CONTRIBUTOR,
      PROJECT_ROLES.CONTRIBUTOR,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-m1-reviewer",
      PROJECT_IDS.M1_PLANNING,
      USER_IDS.INTERNAL_REVIEWER,
      PROJECT_ROLES.REVIEWER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-m1-guest-reviewer",
      PROJECT_IDS.M1_PLANNING,
      USER_IDS.GUEST_REVIEWER,
      PROJECT_ROLES.REVIEWER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-research-owner",
      PROJECT_IDS.USER_RESEARCH,
      USER_IDS.ADMIN,
      PROJECT_ROLES.OWNER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-research-contributor",
      PROJECT_IDS.USER_RESEARCH,
      USER_IDS.OWNER,
      PROJECT_ROLES.CONTRIBUTOR,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-research-internal-reviewer",
      PROJECT_IDS.USER_RESEARCH,
      USER_IDS.INTERNAL_REVIEWER,
      PROJECT_ROLES.REVIEWER,
      timestamp,
    ),

    createProjectMember(
      "seed-pm-research-guest-reviewer",
      PROJECT_IDS.USER_RESEARCH,
      USER_IDS.GUEST_REVIEWER,
      PROJECT_ROLES.REVIEWER,
      timestamp,
    ),
  ];

  const projectInvitations = [
    {
      id: "seed-invitation-m1-guest-contributor",
      workspaceId: WORKSPACE_IDS.COLLABOARD,
      projectId: PROJECT_IDS.M1_PLANNING,
      email: "invitee@collaboard.dev",
      role: PROJECT_ROLES.CONTRIBUTOR,
      memberType: MEMBER_TYPES.GUEST,
      status: INVITATION_STATUS.PENDING,
      invitedById: USER_IDS.OWNER,
      createdAt: timestamp,
      respondedAt: null,
    },
  ];
  const tasks = [
    createTask(
      {
        id: "seed-task-create-repository",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Create project repository",
        description:
          "Initialize the repository and configure the branch structure.",
        status: "done",
        dueDate: dueDates.twoWeeksAgo,
        assigneeIds: [USER_IDS.OWNER],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-api-contract",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Document the API contract",
        description:
          "Record the Workspace, Project, Task, and invitation endpoints.",
        status: "done",
        dueDate: dueDates.oneWeekAgo,
        assigneeIds: [USER_IDS.INTERNAL_CONTRIBUTOR],
        reporterId: USER_IDS.INTERNAL_CONTRIBUTOR,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-access-testing",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Test access-control combinations",
        description:
          "Verify internal, guest, contributor, and reviewer permissions.",
        status: "doing",
        dueDate: dueDates.today,
        assigneeIds: [USER_IDS.OWNER, USER_IDS.ADMIN],
        reporterId: USER_IDS.ADMIN,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-responsive-board",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Review responsive board layout",
        description:
          "Check the Kanban and List views at mobile and desktop widths.",
        status: "doing",
        dueDate: dueDates.inThreeDays,
        assigneeIds: [
          USER_IDS.INTERNAL_CONTRIBUTOR,
          USER_IDS.GUEST_CONTRIBUTOR,
        ],
        reporterId: USER_IDS.GUEST_CONTRIBUTOR,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-invitation-state",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Improve invitation empty state",
        description:
          "Make pending and completed invitation states easier to understand.",
        status: "todo",
        dueDate: dueDates.overdue,
        assigneeIds: [USER_IDS.GUEST_CONTRIBUTOR],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-demo",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Prepare the CollaBoard demonstration",
        description: "Prepare realistic data and rehearse the main user flows.",
        status: "todo",
        dueDate: dueDates.nextWeek,
        assigneeIds: [
          USER_IDS.OWNER,
          USER_IDS.INTERNAL_CONTRIBUTOR,
          USER_IDS.GUEST_CONTRIBUTOR,
        ],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-accessibility",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Review keyboard accessibility",
        description:
          "Check focus states and keyboard access across interactive controls.",
        status: "todo",
        dueDate: null,
        assigneeIds: [USER_IDS.ADMIN],
        reporterId: USER_IDS.INTERNAL_CONTRIBUTOR,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-unassigned",
        projectId: PROJECT_IDS.DEVELOPMENT,
        title: "Prioritize remaining feature ideas",
        description:
          "Review the backlog and select the next implementation slice.",
        status: "todo",
        dueDate: null,
        assigneeIds: [],
        reporterId: USER_IDS.GUEST_CONTRIBUTOR,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-m1-wireframes",
        projectId: PROJECT_IDS.M1_PLANNING,
        title: "Complete interface wireframes",
        description:
          "Document the main CollaBoard screens and navigation flow.",
        status: "done",
        dueDate: dueDates.tenDaysAgo,
        assigneeIds: [USER_IDS.INTERNAL_CONTRIBUTOR],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-m1-requirements",
        projectId: PROJECT_IDS.M1_PLANNING,
        title: "Refine functional requirements",
        description:
          "Confirm requirements against the implemented application.",
        status: "doing",
        dueDate: dueDates.tomorrow,
        assigneeIds: [USER_IDS.INTERNAL_CONTRIBUTOR],
        reporterId: USER_IDS.INTERNAL_CONTRIBUTOR,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-m1-report",
        projectId: PROJECT_IDS.M1_PLANNING,
        title: "Finalize the milestone report",
        description: "Complete the implementation and testing sections.",
        status: "todo",
        dueDate: dueDates.inFiveDays,
        assigneeIds: [USER_IDS.OWNER, USER_IDS.INTERNAL_CONTRIBUTOR],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-m1-invitation",
        projectId: PROJECT_IDS.M1_PLANNING,
        title: "Confirm pending contributor invitation",
        description:
          "Test accepting the seeded invitation using Avery's account.",
        status: "todo",
        dueDate: dueDates.inFourDays,
        assigneeIds: [],
        reporterId: USER_IDS.INTERNAL_CONTRIBUTOR,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-research-guide",
        projectId: PROJECT_IDS.USER_RESEARCH,
        title: "Prepare the interview guide",
        description: "Draft questions about Task creation and collaboration.",
        status: "backlog",
        dueDate: dueDates.inTwoDays,
        assigneeIds: [USER_IDS.ADMIN, USER_IDS.OWNER],
        reporterId: USER_IDS.ADMIN,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-recruit-participants",
        projectId: PROJECT_IDS.USER_RESEARCH,
        title: "Recruit test participants",
        description: "Select representative users for the usability sessions.",
        status: "interviews",
        dueDate: dueDates.today,
        assigneeIds: [USER_IDS.ADMIN],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-analyse-feedback",
        projectId: PROJECT_IDS.USER_RESEARCH,
        title: "Analyse usability feedback",
        description:
          "Group observations and identify recurring usability issues.",
        status: "synthesis",
        dueDate: dueDates.inFourDays,
        assigneeIds: [USER_IDS.OWNER],
        reporterId: USER_IDS.ADMIN,
      },
      timestamp,
    ),

    createTask(
      {
        id: "seed-task-archive-notes",
        projectId: PROJECT_IDS.USER_RESEARCH,
        title: "Archive initial research notes",
        description: "Organize the observations from the preliminary review.",
        status: "complete",
        dueDate: dueDates.yesterday,
        assigneeIds: [USER_IDS.ADMIN],
        reporterId: USER_IDS.OWNER,
      },
      timestamp,
    ),
  ];

  return {
    users: [...users, ...companyDemoSeed.users],

    workspaces: [...workspaces, ...companyDemoSeed.workspaces],

    workspaceMembers: [
      ...workspaceMembers,
      ...companyDemoSeed.workspaceMembers,
    ],

    projects: [...projects, ...companyDemoSeed.projects],

    projectMembers: [...projectMembers, ...companyDemoSeed.projectMembers],

    projectInvitations: [
      ...projectInvitations,
      ...companyDemoSeed.projectInvitations,
    ],

    tasks: [...tasks, ...companyDemoSeed.tasks],
  };
}
