import "dotenv/config";
import mongoose from "mongoose";
import {
  connectDatabase,
  disconnectDatabase,
} from "../src/config/database.js";
import {
  createDevelopmentSeed,
} from "../src/data/developmentSeed.js";
import {
  Project,
  ProjectInvitation,
  ProjectMember,
  Task,
  User,
  Workspace,
  WorkspaceMember,
} from "../src/models/index.js";

const confirmationArgument =
  "--confirm-reset";

const models = [
  User,
  Workspace,
  WorkspaceMember,
  Project,
  ProjectMember,
  ProjectInvitation,
  Task,
];

function isEnabled(value) {
  return (
    value?.trim().toLowerCase() ===
    "true"
  );
}

function assertSeedPermission() {
  const runtimeEnvironment =
    process.env.NODE_ENV
      ?.trim()
      .toLowerCase();

  if (runtimeEnvironment === "production") {
    throw new Error(
      "Database seeding is disabled in production",
    );
  }

  if (
    !isEnabled(
      process.env.SEED_DEVELOPMENT_DATA,
    )
  ) {
    throw new Error(
      "Set SEED_DEVELOPMENT_DATA=true before seeding",
    );
  }

  if (
    !process.argv.includes(
      confirmationArgument,
    )
  ) {
    throw new Error(
      `Run the seed command with ${confirmationArgument}`,
    );
  }
}

function assertDatabaseName() {
  const expectedDatabaseName =
    process.env.MONGODB_DATABASE_NAME?.trim();

  if (!expectedDatabaseName) {
    throw new Error(
      "MONGODB_DATABASE_NAME is not configured",
    );
  }

  const connectedDatabaseName =
    mongoose.connection.name;

  if (
    connectedDatabaseName !==
    expectedDatabaseName
  ) {
    throw new Error(
      "Database seed was blocked because " +
        `the connected database is "${connectedDatabaseName}" ` +
        `instead of "${expectedDatabaseName}"`,
    );
  }

  const protectedDatabaseNames =
    new Set([
      "admin",
      "config",
      "local",
      "test",
    ]);

  if (
    protectedDatabaseNames.has(
      connectedDatabaseName,
    )
  ) {
    throw new Error(
      `Database "${connectedDatabaseName}" cannot be seeded`,
    );
  }
}

function convertRecords(records) {
  return records.map((record) => {
    const {
      id,
      ...document
    } = record;

    if (
      typeof id !== "string" ||
      !id.trim()
    ) {
      throw new Error(
        "Every seed record requires a string ID",
      );
    }

    return {
      _id: id,
      ...document,
    };
  });
}

function prepareSeedData(seed) {
  return {
    users: convertRecords(seed.users),

    workspaces: convertRecords(
      seed.workspaces,
    ),

    workspaceMembers: convertRecords(
      seed.workspaceMembers,
    ),

    projects: convertRecords(
      seed.projects,
    ),

    projectMembers: convertRecords(
      seed.projectMembers,
    ),

    projectInvitations: convertRecords(
      seed.projectInvitations,
    ),

    tasks: convertRecords(seed.tasks),
  };
}

async function validateDocuments(
  Model,
  documents,
) {
  await Promise.all(
    documents.map((document) =>
      new Model(document).validate(),
    ),
  );
}

async function validateSeedData(seedData) {
  await validateDocuments(
    User,
    seedData.users,
  );

  await validateDocuments(
    Workspace,
    seedData.workspaces,
  );

  await validateDocuments(
    WorkspaceMember,
    seedData.workspaceMembers,
  );

  await validateDocuments(
    Project,
    seedData.projects,
  );

  await validateDocuments(
    ProjectMember,
    seedData.projectMembers,
  );

  await validateDocuments(
    ProjectInvitation,
    seedData.projectInvitations,
  );

  await validateDocuments(
    Task,
    seedData.tasks,
  );
}

async function initializeIndexes() {
  await Promise.all(
    models.map((Model) => Model.init()),
  );
}

async function clearDatabase() {
  await Task.deleteMany({});

  await ProjectInvitation.deleteMany({});

  await ProjectMember.deleteMany({});

  await Project.deleteMany({});

  await WorkspaceMember.deleteMany({});

  await Workspace.deleteMany({});

  await User.deleteMany({});
}

async function insertSeedData(seedData) {
  await User.insertMany(
    seedData.users,
  );

  await Workspace.insertMany(
    seedData.workspaces,
  );

  await WorkspaceMember.insertMany(
    seedData.workspaceMembers,
  );

  await Project.insertMany(
    seedData.projects,
  );

  await ProjectMember.insertMany(
    seedData.projectMembers,
  );

  await ProjectInvitation.insertMany(
    seedData.projectInvitations,
  );

  await Task.insertMany(
    seedData.tasks,
  );
}

async function getDatabaseCounts() {
  return {
    users: await User.countDocuments(),

    workspaces:
      await Workspace.countDocuments(),

    workspaceMembers:
      await WorkspaceMember.countDocuments(),

    projects:
      await Project.countDocuments(),

    projectMembers:
      await ProjectMember.countDocuments(),

    projectInvitations:
      await ProjectInvitation.countDocuments(),

    tasks: await Task.countDocuments(),
  };
}

async function seedDatabase() {
  try {
    assertSeedPermission();

    await connectDatabase();

    assertDatabaseName();

    const seed =
      createDevelopmentSeed();

    const seedData =
      prepareSeedData(seed);

    console.log(
      "Validating development seed data...",
    );

    await validateSeedData(seedData);

    await initializeIndexes();

    console.log(
      `Resetting database: ${mongoose.connection.name}`,
    );

    await clearDatabase();

    console.log(
      "Writing development seed data...",
    );

    await insertSeedData(seedData);

    const counts =
      await getDatabaseCounts();

    console.log(
      "Development database seed completed.",
    );

    console.table(counts);
  } catch (error) {
    console.error(
      "Development database seed failed:",
      error.message,
    );

    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void seedDatabase();