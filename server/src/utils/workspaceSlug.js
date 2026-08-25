import { store } from "../data/inMemoryStore.js";

const WORKSPACE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeWorkspaceSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateWorkspaceSlug(value) {
  const slug = normalizeWorkspaceSlug(value);

  return (
    slug.length >= 2 && slug.length <= 50 && WORKSPACE_SLUG_PATTERN.test(slug)
  );
}

export function workspaceSlugExists(slug) {
  return store.workspaces.some((workspace) => workspace.slug === slug);
}

export function generateWorkspaceSlug(name) {
  const base = normalizeWorkspaceSlug(name).slice(0, 45) || "workspace";

  let candidate = base;
  let suffix = 2;

  while (workspaceSlugExists(candidate)) {
    const suffixText = `-${suffix}`;

    candidate = `${base.slice(0, 50 - suffixText.length)}${suffixText}`;

    suffix += 1;
  }

  return candidate;
}
