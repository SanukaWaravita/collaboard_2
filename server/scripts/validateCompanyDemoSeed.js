import "dotenv/config";
import {
  createDevelopmentSeed,
} from "../src/data/developmentSeed.js";

const seedData = createDevelopmentSeed();

const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function findDuplicateIds(items) {
  const seenIds = new Set();
  const duplicateIds = [];

  items.forEach((item) => {
    if (seenIds.has(item.id)) {
      duplicateIds.push(item.id);
      return;
    }

    seenIds.add(item.id);
  });

  return duplicateIds;
}

const companyUsers = seedData.users.filter((user) =>
  user.email.endsWith("@aurora.example"),
);

const companyWorkspaces = seedData.workspaces.filter((workspace) =>
  workspace.slug.startsWith("aurora-"),
);

const companyProjects = seedData.projects.filter((project) =>
  project.id.startsWith("aurora-project-"),
);

const companyTasks = seedData.tasks.filter((task) =>
  task.id.startsWith("aurora-task-"),
);

const companyWorkspaceIds = new Set(
  companyWorkspaces.map((workspace) => workspace.id),
);

const companyProjectIds = new Set(companyProjects.map((project) => project.id));

const companyWorkspaceMembers = seedData.workspaceMembers.filter((membership) =>
  companyWorkspaceIds.has(membership.workspaceId),
);

const companyProjectMembers = seedData.projectMembers.filter((membership) =>
  companyProjectIds.has(membership.projectId),
);

check(
  companyUsers.length === 7,
  `Expected 7 company users; ` + `received ${companyUsers.length}`,
);

check(
  companyWorkspaces.length === 6,
  `Expected 6 company Workspaces; ` + `received ${companyWorkspaces.length}`,
);

check(
  companyWorkspaceMembers.length === 12,
  `Expected 12 company Workspace memberships; ` +
    `received ${companyWorkspaceMembers.length}`,
);

check(
  companyProjects.length === 18,
  `Expected 18 company Projects; ` + `received ${companyProjects.length}`,
);

check(
  companyProjectMembers.length === 36,
  `Expected 36 company Project memberships; ` +
    `received ${companyProjectMembers.length}`,
);

check(
  companyTasks.length === 90,
  `Expected 90 company Tasks; ` + `received ${companyTasks.length}`,
);

const collections = {
  users: seedData.users,
  workspaces: seedData.workspaces,
  workspaceMembers: seedData.workspaceMembers,
  projects: seedData.projects,
  projectMembers: seedData.projectMembers,
  projectInvitations: seedData.projectInvitations,
  tasks: seedData.tasks,
};

Object.entries(collections).forEach(([collectionName, items]) => {
  const duplicateIds = findDuplicateIds(items);

  check(
    duplicateIds.length === 0,
    `Duplicate IDs in ${collectionName}: ` + `${duplicateIds.join(", ")}`,
  );
});

const userIds = new Set(seedData.users.map((user) => user.id));

const workspaceIds = new Set(seedData.workspaces.map((workspace) => workspace.id));

const projectIds = new Set(seedData.projects.map((project) => project.id));

const representative = companyUsers.find(
  (user) => user.email === "company.rep@aurora.example",
);

check(Boolean(representative), "Company representative was not found");

companyWorkspaces.forEach((workspace) => {
  const memberships = companyWorkspaceMembers.filter(
    (membership) => membership.workspaceId === workspace.id,
  );

  const projectCount = companyProjects.filter(
    (project) => project.workspaceId === workspace.id,
  ).length;

  check(
    userIds.has(workspace.ownerId),
    `${workspace.name} has an invalid Owner`,
  );

  check(
    workspace.ownerId === representative?.id,
    `${workspace.name} is not owned by ` + "the company representative",
  );

  check(memberships.length === 2, `${workspace.name} should have 2 members`);

  check(
    memberships.some(
      (membership) =>
        membership.userId === workspace.ownerId && membership.role === "OWNER",
    ),
    `${workspace.name} is missing its ` + "Owner membership",
  );

  check(
    memberships.filter((membership) => membership.role === "ADMIN").length ===
      1,
    `${workspace.name} should have ` + "one department Administrator",
  );

  check(
    projectCount === 3,
    `${workspace.name} should have ` + `3 Projects; received ${projectCount}`,
  );
});

companyProjects.forEach((project) => {
  const memberships = companyProjectMembers.filter(
    (membership) => membership.projectId === project.id,
  );

  const projectTasks = companyTasks.filter(
    (task) => task.projectId === project.id,
  );

  check(
    workspaceIds.has(project.workspaceId),
    `${project.name} references an ` + "invalid Workspace",
  );

  check(userIds.has(project.ownerId), `${project.name} has an invalid Owner`);

  check(
    project.ownerId === representative?.id,
    `${project.name} is not owned by ` + "the company representative",
  );

  check(
    memberships.length === 2,
    `${project.name} should have ` + "2 Project members",
  );

  check(
    memberships.some(
      (membership) =>
        membership.userId === project.ownerId && membership.role === "OWNER",
    ),
    `${project.name} is missing its ` + "Owner membership",
  );

  check(
    memberships.filter((membership) => membership.role === "CONTRIBUTOR")
      .length === 1,
    `${project.name} should have ` + "one department Contributor",
  );

  check(
    project.workflowStatuses.length === 3,
    `${project.name} should have ` + "3 workflow statuses",
  );

  check(
    projectTasks.length === 5,
    `${project.name} should have ` +
      `5 Tasks; received ` +
      `${projectTasks.length}`,
  );
});

companyTasks.forEach((task) => {
  const project = companyProjects.find(
    (candidateProject) => candidateProject.id === task.projectId,
  );

  check(
    projectIds.has(task.projectId),
    `${task.title} references an ` + "invalid Project",
  );

  if (!project) {
    return;
  }

  const validStatusIds = new Set(
    project.workflowStatuses.map((status) => status.id),
  );

  const memberIds = new Set(
    companyProjectMembers
      .filter((membership) => membership.projectId === task.projectId)
      .map((membership) => membership.userId),
  );

  check(
    userIds.has(task.createdById),
    `${task.title} has an unknown Task creator`,
  );

  check(
    memberIds.has(task.createdById),
    `${task.title} has a Task creator who is not a Project member`,
  );

  check(userIds.has(task.reporterId), `${task.title} has an unknown Reporter`);

  check(
    memberIds.has(task.reporterId),
    `${task.title} has a Reporter who is not a Project member`,
  );

  check(validStatusIds.has(task.status), `${task.title} has an invalid status`);

  check(task.version === 1, `${task.title} should begin at version 1`);

  check(
    task.dueDate === null || /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate),
    `${task.title} has an invalid Due Date`,
  );

  task.assigneeIds.forEach((userId) => {
    check(
      memberIds.has(userId),
      `${task.title} contains an ` +
        "assignee who is not a " +
        "Project member",
    );
  });
});

const statusCounts = companyTasks.reduce((counts, task) => {
  counts[task.status] = (counts[task.status] ?? 0) + 1;

  return counts;
}, {});

check(
  statusCounts.done === 33,
  `Expected 33 Done Tasks; ` + `received ${statusCounts.done ?? 0}`,
);

check(
  statusCounts.doing === 23,
  `Expected 23 Doing Tasks; ` + `received ${statusCounts.doing ?? 0}`,
);

check(
  statusCounts.todo === 34,
  `Expected 34 To Do Tasks; ` + `received ${statusCounts.todo ?? 0}`,
);

check(
  companyTasks.filter((task) => task.assigneeIds.length === 0).length === 6,
  "Expected 6 unassigned Tasks",
);

check(
  companyTasks.filter((task) => task.assigneeIds.length > 1).length === 19,
  "Expected 19 multiply assigned Tasks",
);

check(
  companyTasks.filter((task) => task.dueDate === null).length === 3,
  "Expected 3 Tasks without Due Dates",
);

if (failures.length > 0) {
  console.error("Company demo seed validation failed:");

  failures.forEach((failure) => {
    console.error(`- ${failure}`);
  });

  process.exitCode = 1;
} else {
  console.log("Company demo seed validation passed.");

  console.log({
    users: companyUsers.length,
    workspaces: companyWorkspaces.length,
    workspaceMemberships: companyWorkspaceMembers.length,
    projects: companyProjects.length,
    projectMemberships: companyProjectMembers.length,
    tasks: companyTasks.length,
    statusCounts,
    unassignedTasks: 6,
    multipleAssigneeTasks: 19,
    tasksWithoutDueDates: 3,
  });
}
