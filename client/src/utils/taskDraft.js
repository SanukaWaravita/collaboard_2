const TASK_DRAFT_VERSION = 1;
const TASK_DRAFT_PREFIX = "collaboard:task-draft";

export function getTaskDraftStorageKey(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }

  return [
    TASK_DRAFT_PREFIX,
    `v${TASK_DRAFT_VERSION}`,
    encodeURIComponent(userId),
    encodeURIComponent(projectId),
  ].join(":");
}

export function readTaskDraft(storageKey) {
  if (!storageKey) {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return null;
    }

    const draft = JSON.parse(storedValue);

    if (!draft || draft.version !== TASK_DRAFT_VERSION) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return draft;
  } catch {
    // A damaged draft or unavailable storage should never block task creation.
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage access failures and continue without draft recovery.
    }

    return null;
  }
}

export function writeTaskDraft(storageKey, taskDraft) {
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: TASK_DRAFT_VERSION,
        savedAt: new Date().toISOString(),
        ...taskDraft,
      }),
    );
  } catch {
    // Draft recovery is progressive enhancement; the form remains usable.
  }
}

export function clearTaskDraft(storageKey) {
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // The task itself can still be created if browser storage is unavailable.
  }
}
