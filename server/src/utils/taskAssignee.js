import {
  PROJECT_ROLES,
} from "../constants/access.js";

const assignableProjectRoles =
  new Set([
    PROJECT_ROLES.OWNER,
    PROJECT_ROLES.CONTRIBUTOR,
  ]);

export function isAssignableProjectRole(
  role,
) {
  return assignableProjectRoles.has(
    role,
  );
}

export function isValidAssigneeIdsValue(
  value,
) {
  if (value === null) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  const normalizedIds = [];

  for (const userId of value) {
    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return false;
    }

    normalizedIds.push(
      userId.trim(),
    );
  }

  return (
    new Set(normalizedIds).size ===
    normalizedIds.length
  );
}

export function normalizeAssigneeIds(
  value,
) {
  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return value;
  }

  return value.map(
    (userId) => userId.trim(),
  );
}