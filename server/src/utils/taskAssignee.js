import { PROJECT_ROLES } from "../constants/access.js";
import { store } from "../data/inMemoryStore.js";

const assignableProjectRoles = new Set([
  PROJECT_ROLES.OWNER,
  PROJECT_ROLES.CONTRIBUTOR,
]);

export function isAssignableProjectRole(role) {
  return assignableProjectRoles.has(role);
}

export function isValidAssigneeIdsValue(value) {
  if (value === null) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  const normalizedIds = [];

  for (const userId of value) {
    if (typeof userId !== "string" || !userId.trim()) {
      return false;
    }

    normalizedIds.push(userId.trim());
  }

  return new Set(normalizedIds).size === normalizedIds.length;
}

export function normalizeAssigneeIds(value) {
  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((userId) => userId.trim());
}

export function findAssignableProjectMember(projectId, userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    return null;
  }

  const normalizedUserId = userId.trim();

  const membership = store.projectMembers.find(
    (currentMembership) =>
      currentMembership.projectId === projectId &&
      currentMembership.userId === normalizedUserId &&
      isAssignableProjectRole(currentMembership.role),
  );

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

export function findInvalidAssigneeId(projectId, assigneeIds) {
  return (
    assigneeIds.find(
      (userId) => !findAssignableProjectMember(projectId, userId),
    ) ?? null
  );
}

export function removeUserFromTaskAssignments(projectId, userId) {
  const timestamp = new Date().toISOString();
  let unassignedTaskCount = 0;

  for (const task of store.tasks) {
    if (task.projectId !== projectId || !task.assigneeIds.includes(userId)) {
      continue;
    }

    task.assigneeIds = task.assigneeIds.filter(
      (currentAssigneeId) => currentAssigneeId !== userId,
    );

    task.version = (task.version ?? 0) + 1;
    task.updatedAt = timestamp;
    unassignedTaskCount += 1;
  }

  return unassignedTaskCount;
}
