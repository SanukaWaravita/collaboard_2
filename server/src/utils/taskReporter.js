import { PROJECT_ROLES, WORKSPACE_ROLES } from "../constants/access.js";
import { store } from "../data/inMemoryStore.js";

function findProjectMembership(projectId, userId) {
  return store.projectMembers.find(
    (membership) =>
      membership.projectId === projectId && membership.userId === userId,
  );
}

function findWorkspaceMembership(workspaceId, userId) {
  return store.workspaceMembers.find(
    (membership) =>
      membership.workspaceId === workspaceId && membership.userId === userId,
  );
}

export function findEligibleTaskReporter(projectId, userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    return null;
  }

  const normalizedUserId = userId.trim();

  const membership = findProjectMembership(projectId, normalizedUserId);

  if (!membership) {
    return null;
  }

  const user = store.users.find(
    (currentUser) => currentUser.id === normalizedUserId,
  );

  if (!user) {
    return null;
  }

  return {
    membership,
    user,
  };
}

export function canAssignTaskReporter(task, project, userId) {
  const projectMembership = findProjectMembership(project.id, userId);

  const isCurrentTaskCreator =
    task.createdById === userId && Boolean(projectMembership);

  const managesProject =
    project.ownerId === userId ||
    projectMembership?.role === PROJECT_ROLES.OWNER;

  const workspaceMembership = findWorkspaceMembership(
    project.workspaceId,
    userId,
  );

  const managesWorkspace =
    workspaceMembership?.role === WORKSPACE_ROLES.OWNER ||
    workspaceMembership?.role === WORKSPACE_ROLES.ADMIN;

  return isCurrentTaskCreator || managesProject || managesWorkspace;
}

export function presentTask(task, viewerUserId = null) {
  const reporter = store.users.find((user) => user.id === task.reporterId);

  const project = store.projects.find(
    (currentProject) => currentProject.id === task.projectId,
  );

  return {
    ...task,

    reporter: reporter
      ? {
          userId: reporter.id,
          name: reporter.name,
          email: reporter.email,
        }
      : null,

    canAssignReporter: Boolean(
      viewerUserId &&
      project &&
      canAssignTaskReporter(task, project, viewerUserId),
    ),
  };
}
