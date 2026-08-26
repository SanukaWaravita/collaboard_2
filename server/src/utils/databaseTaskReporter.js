import {
  PROJECT_ROLES,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import {
  Project,
  ProjectMember,
  User,
  WorkspaceMember,
} from "../models/index.js";

export async function findEligibleDatabaseTaskReporter(
  projectId,
  userId,
) {
  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return null;
  }

  const normalizedUserId =
    userId.trim();

  const membership =
    await ProjectMember.findOne({
      projectId,
      userId: normalizedUserId,
    });

  if (!membership) {
    return null;
  }

  const user = await User.findById(
    normalizedUserId,
  );

  if (!user) {
    return null;
  }

  return {
    membership,
    user,
  };
}

export async function canAssignDatabaseTaskReporter(
  task,
  project,
  userId,
) {
  const projectMembership =
    await ProjectMember.findOne({
      projectId: project.id,
      userId,
    });

  const isCurrentTaskCreator =
    task.createdById === userId &&
    Boolean(projectMembership);

  const managesProject =
    project.ownerId === userId ||
    projectMembership?.role ===
      PROJECT_ROLES.OWNER;

  const workspaceMembership =
    await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId,
    });

  const managesWorkspace =
    workspaceMembership?.role ===
      WORKSPACE_ROLES.OWNER ||
    workspaceMembership?.role ===
      WORKSPACE_ROLES.ADMIN;

  return (
    isCurrentTaskCreator ||
    managesProject ||
    managesWorkspace
  );
}

export async function presentDatabaseTask(
  task,
  viewerUserId = null,
  knownProject = null,
) {
  const plainTask =
    typeof task.toJSON === "function"
      ? task.toJSON()
      : {
          ...task,
        };

  const reporter = await User.findById(
    plainTask.reporterId,
  );

  const project =
    knownProject ??
    (await Project.findById(
      plainTask.projectId,
    ));

  const canAssignReporter =
    Boolean(
      viewerUserId &&
        project &&
        (await canAssignDatabaseTaskReporter(
          plainTask,
          project,
          viewerUserId,
        )),
    );

  return {
    ...plainTask,

    reporter: reporter
      ? {
          userId: reporter.id,
          name: reporter.name,
          email: reporter.email,
        }
      : null,

    canAssignReporter,
  };
}