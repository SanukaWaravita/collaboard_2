import { PROJECT_ROLES } from "../constants/access.js";
import { store } from "../data/inMemoryStore.js";

const assignableProjectRoles = new Set([
  PROJECT_ROLES.OWNER,
  PROJECT_ROLES.CONTRIBUTOR,
]);

export function isAssignableProjectRole(role) {
  return assignableProjectRoles.has(role);
}

export function isValidAssigneeIdValue(value) {
  return (
    value === null ||
    value === "" ||
    (typeof value === "string" &&
      value.trim().length > 0)
  );
}

export function normalizeAssigneeId(value) {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}

export function findAssignableProjectMember(
  projectId,
  userId,
) {
  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return null;
  }

  const normalizedUserId = userId.trim();

  const membership = store.projectMembers.find(
    (currentMembership) =>
      currentMembership.projectId === projectId &&
      currentMembership.userId === normalizedUserId &&
      isAssignableProjectRole(
        currentMembership.role,
      ),
  );

  if (!membership) {
    return null;
  }

  const user = store.users.find(
    (currentUser) =>
      currentUser.id === normalizedUserId,
  );

  if (!user) {
    return null;
  }

  return {
    membership,
    user,
  };
}

export function clearTaskAssignmentsForUser(
  projectId,
  userId,
) {
  const timestamp = new Date().toISOString();
  let unassignedTaskCount = 0;

  for (const task of store.tasks) {
    if (
      task.projectId !== projectId ||
      task.assigneeId !== userId
    ) {
      continue;
    }

    task.assigneeId = null;
    task.version = (task.version ?? 0) + 1;
    task.updatedAt = timestamp;
    unassignedTaskCount += 1;
  }

  return unassignedTaskCount;
}