import { useState } from "react";

const DEFAULT_STATUS_COLOR = "#64748b";
const MAX_WORKFLOW_STATUSES = 12;

function WorkflowStatusManager({
  workflowStatuses,
  tasks,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
  onClose,
  isSaving = false,
  error = "",
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(
    DEFAULT_STATUS_COLOR,
  );

  const [editingStatusId, setEditingStatusId] =
    useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(
    DEFAULT_STATUS_COLOR,
  );

  const [deletingStatusId, setDeletingStatusId] =
    useState(null);
  const [
    replacementStatusId,
    setReplacementStatusId,
  ] = useState("");

  const taskCounts = new Map();

  tasks.forEach((task) => {
    taskCounts.set(
      task.status,
      (taskCounts.get(task.status) ?? 0) + 1,
    );
  });

  const deletingStatus =
    workflowStatuses.find(
      (status) => status.id === deletingStatusId,
    ) ?? null;

  const deletingStatusTaskCount =
    deletingStatus
      ? taskCounts.get(deletingStatus.id) ?? 0
      : 0;

  const replacementOptions =
    deletingStatus
      ? workflowStatuses.filter(
          (status) =>
            status.id !== deletingStatus.id,
        )
      : [];

  const hasReachedStatusLimit =
    workflowStatuses.length >=
    MAX_WORKFLOW_STATUSES;

  async function handleCreate(event) {
    event.preventDefault();

    const trimmedName = newName.trim();

    if (
      !trimmedName ||
      isSaving ||
      hasReachedStatusLimit
    ) {
      return;
    }

    const didCreate = await onCreateStatus({
      name: trimmedName,
      color: newColor,
    });

    if (didCreate) {
      setNewName("");
      setNewColor(DEFAULT_STATUS_COLOR);
    }
  }

  function startEditing(status) {
    setDeletingStatusId(null);
    setReplacementStatusId("");

    setEditingStatusId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
  }

  function cancelEditing() {
    if (isSaving) {
      return;
    }

    setEditingStatusId(null);
    setEditName("");
    setEditColor(DEFAULT_STATUS_COLOR);
  }

  async function handleUpdate(event) {
    event.preventDefault();

    const trimmedName = editName.trim();

    if (
      !editingStatusId ||
      !trimmedName ||
      isSaving
    ) {
      return;
    }

    const didUpdate = await onUpdateStatus(
      editingStatusId,
      {
        name: trimmedName,
        color: editColor,
      },
    );

    if (didUpdate) {
      cancelEditing();
    }
  }

  function startDeleting(status) {
    if (status.isCompleted) {
      return;
    }

    setEditingStatusId(null);
    setEditName("");
    setEditColor(DEFAULT_STATUS_COLOR);

    const firstReplacement =
      workflowStatuses.find(
        (currentStatus) =>
          currentStatus.id !== status.id,
      );

    setDeletingStatusId(status.id);
    setReplacementStatusId(
      firstReplacement?.id ?? "",
    );
  }

  function cancelDeleting() {
    if (isSaving) {
      return;
    }

    setDeletingStatusId(null);
    setReplacementStatusId("");
  }

  async function handleDelete() {
    if (!deletingStatus || isSaving) {
      return;
    }

    if (
      deletingStatusTaskCount > 0 &&
      !replacementStatusId
    ) {
      return;
    }

    const didDelete = await onDeleteStatus(
      deletingStatus.id,
      deletingStatusTaskCount > 0
        ? replacementStatusId
        : undefined,
    );

    if (didDelete) {
      cancelDeleting();
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        className="workflow-manager"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-manager-title"
      >
        <header className="workflow-manager__header">
          <div>
            <p className="workflow-manager__eyebrow">
              Project workflow
            </p>

            <h2 id="workflow-manager-title">
              Manage statuses
            </h2>

            <p>
              Add, rename, recolour, or remove the
              columns used by this Project.
            </p>
          </div>

          <button
            type="button"
            className="workflow-manager__close"
            onClick={onClose}
            aria-label="Close workflow manager"
            disabled={isSaving}
          >
            ×
          </button>
        </header>

        {error && (
          <p
            className="auth-form__error"
            role="alert"
          >
            {error}
          </p>
        )}

        <form
          className="workflow-manager__create"
          onSubmit={handleCreate}
        >
          <div className="workflow-manager__field">
            <label htmlFor="new-status-name">
              New status
            </label>

            <input
              id="new-status-name"
              type="text"
              value={newName}
              onChange={(event) =>
                setNewName(event.target.value)
              }
              placeholder="For example, Review"
              maxLength="40"
              disabled={
                isSaving || hasReachedStatusLimit
              }
              required
            />
          </div>

          <div className="workflow-manager__color-field">
            <label htmlFor="new-status-color">
              Colour
            </label>

            <input
              id="new-status-color"
              type="color"
              value={newColor}
              onChange={(event) =>
                setNewColor(event.target.value)
              }
              disabled={
                isSaving || hasReachedStatusLimit
              }
            />
          </div>

          <button
            type="submit"
            className="button button--primary"
            disabled={
              isSaving ||
              hasReachedStatusLimit ||
              !newName.trim()
            }
          >
            {isSaving ? "Saving..." : "Add Status"}
          </button>
        </form>

        <div className="workflow-manager__limit">
          <span>
            {workflowStatuses.length} of{" "}
            {MAX_WORKFLOW_STATUSES} statuses
          </span>

          {hasReachedStatusLimit && (
            <span>
              The maximum number of statuses has
              been reached.
            </span>
          )}
        </div>

        <ol className="workflow-manager__list">
          {workflowStatuses.map((status) => {
            const taskCount =
              taskCounts.get(status.id) ?? 0;

            const isEditing =
              editingStatusId === status.id;

            const isDeleting =
              deletingStatusId === status.id;

            return (
              <li
                key={status.id}
                className="workflow-status-row"
              >
                {isEditing ? (
                  <form
                    className="workflow-status-row__edit"
                    onSubmit={handleUpdate}
                  >
                    <input
                      type="color"
                      value={editColor}
                      onChange={(event) =>
                        setEditColor(
                          event.target.value,
                        )
                      }
                      aria-label={
                        `Colour for ${status.name}`
                      }
                      disabled={isSaving}
                    />

                    <input
                      type="text"
                      value={editName}
                      onChange={(event) =>
                        setEditName(
                          event.target.value,
                        )
                      }
                      aria-label="Status name"
                      maxLength="40"
                      disabled={isSaving}
                      required
                      autoFocus
                    />

                    <div className="workflow-status-row__actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={cancelEditing}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="button button--primary"
                        disabled={
                          isSaving || !editName.trim()
                        }
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="workflow-status-row__summary">
                      <span
                        className="workflow-status-row__swatch"
                        style={{
                          "--status-color":
                            status.color,
                        }}
                        aria-hidden="true"
                      />

                      <div>
                        <div className="workflow-status-row__name">
                          <strong>{status.name}</strong>

                          {status.isCompleted && (
                            <span className="workflow-status-row__badge">
                              Completed
                            </span>
                          )}
                        </div>

                        <span className="workflow-status-row__metadata">
                          Position {status.position + 1}
                          {" · "}
                          {taskCount}{" "}
                          {taskCount === 1
                            ? "task"
                            : "tasks"}
                        </span>
                      </div>
                    </div>

                    <div className="workflow-status-row__actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() =>
                          startEditing(status)
                        }
                        disabled={isSaving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() =>
                          startDeleting(status)
                        }
                        disabled={
                          isSaving ||
                          status.isCompleted
                        }
                        title={
                          status.isCompleted
                            ? "The completed status is required"
                            : undefined
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}

                {isDeleting && (
                  <div className="workflow-status-row__delete">
                    <p>
                      Delete{" "}
                      <strong>{status.name}</strong>?
                    </p>

                    {taskCount > 0 ? (
                      <div className="workflow-manager__field">
                        <label
                          htmlFor={
                            `replacement-${status.id}`
                          }
                        >
                          Move {taskCount}{" "}
                          {taskCount === 1
                            ? "task"
                            : "tasks"}{" "}
                          to
                        </label>

                        <select
                          id={
                            `replacement-${status.id}`
                          }
                          value={replacementStatusId}
                          onChange={(event) =>
                            setReplacementStatusId(
                              event.target.value,
                            )
                          }
                          disabled={isSaving}
                          required
                        >
                          {replacementOptions.map(
                            (replacementStatus) => (
                              <option
                                key={
                                  replacementStatus.id
                                }
                                value={
                                  replacementStatus.id
                                }
                              >
                                {
                                  replacementStatus.name
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    ) : (
                      <p>
                        This status does not contain any
                        Tasks.
                      </p>
                    )}

                    <div className="workflow-status-row__delete-actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={cancelDeleting}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="button button--danger"
                        onClick={handleDelete}
                        disabled={
                          isSaving ||
                          (taskCount > 0 &&
                            !replacementStatusId)
                        }
                      >
                        {isSaving
                          ? "Deleting..."
                          : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

export default WorkflowStatusManager;