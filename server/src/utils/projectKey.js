import { store } from "../data/inMemoryStore.js";

const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export function normalizeProjectKey(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function validateProjectKey(value) {
  return PROJECT_KEY_PATTERN.test(
    normalizeProjectKey(value),
  );
}

export function projectKeyExists(
  workspaceId,
  projectKey,
) {
  return store.projects.some(
    (project) =>
      project.workspaceId === workspaceId &&
      project.projectKey === projectKey,
  );
}

export function generateProjectKey(
  workspaceId,
  projectName,
) {
  const words = String(projectName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let base =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : words[0]?.slice(0, 4) ?? "PRJ";

  base = normalizeProjectKey(base).slice(0, 10);

  if (base.length < 2) {
    base = `${base}P`.slice(0, 10);
  }

  let candidate = base;
  let suffix = 2;

  while (projectKeyExists(workspaceId, candidate)) {
    const suffixText = String(suffix);
    const availableLength = 10 - suffixText.length;

    candidate =
      `${base.slice(0, availableLength)}${suffixText}`;

    suffix += 1;
  }

  return candidate;
}