import { useState } from "react";
import { getAssigneeInitial } from "../utils/taskAssignee";

function TaskForm({
  initialTask = null,
  initialStatusId = null,
  workflowStatuses = [],
  assignees = [],
  currentUser = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = "",
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "");

  const [description, setDescription] = useState(
    initialTask?.description ?? "",
  );

  const [status, setStatus] = useState(
    initialTask?.status ?? initialStatusId ?? workflowStatuses[0]?.id ?? "",
  );

  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? "");

  const [assigneeIds, setAssigneeIds] = useState(
    initialTask?.assigneeIds ?? [],
  );

  const isEditing = Boolean(initialTask);

  const reporter = isEditing ? (initialTask?.reporter ?? null) : currentUser;

  const hasWorkflowStatuses = workflowStatuses.length > 0;

  function toggleAssignee(userId) {
    setAssigneeIds((currentAssigneeIds) =>
      currentAssigneeIds.includes(userId)
        ? currentAssigneeIds.filter((currentUserId) => currentUserId !== userId)
        : [...currentAssigneeIds, userId],
    );
  }
  function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle || !status || isSubmitting) {
      return;
    }

    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      status,
      dueDate: dueDate || null,
      assigneeIds,
    });
  }

  return (
    <div className="modal-backdrop">
      <form
        className="task-form"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
      >
        <header className="task-form__header">
          <div>
            <p className="task-form__eyebrow">
              {isEditing ? "Edit task" : "New task"}
            </p>

            <h2 id="task-form-title">
              {isEditing ? "Update task" : "Create a task"}
            </h2>
          </div>

          <button
            type="button"
            className="task-form__close"
            onClick={onCancel}
            aria-label="Close task form"
            disabled={isSubmitting}
          >
            ×
          </button>
        </header>

        <div className="task-form__field">
          <label htmlFor="task-title">Title</label>

          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter a task title"
            required
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        <div className="task-form__field">
          <label htmlFor="task-description">Description</label>

          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the task"
            rows="4"
            disabled={isSubmitting}
          />
        </div>
        <div className="task-form__field">
          <label htmlFor="task-due-date">Due date</label>

          <div className="task-form__due-date-control">
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={isSubmitting}
            />

            <button
              type="button"
              className={"button button--secondary " + "task-form__clear-date"}
              onClick={() => setDueDate("")}
              disabled={!dueDate || isSubmitting}
            >
              Clear
            </button>
          </div>

          <small>Optional. Leave this empty if the Task has no deadline.</small>
        </div>
        <div className="task-form__field">
          <span className="task-form__field-label">Reporter</span>

          {reporter ? (
            <div
              className={"task-reporter " + "task-reporter--form"}
              title={reporter.email ?? reporter.name}
            >
              <span className="task-reporter__avatar" aria-hidden="true">
                {getAssigneeInitial(reporter.name)}
              </span>

              <span className="task-reporter__identity">
                <strong className="task-reporter__name">{reporter.name}</strong>

                {reporter.email && (
                  <small className="task-reporter__email">
                    {reporter.email}
                  </small>
                )}
              </span>
            </div>
          ) : (
            <p className="task-reporter__unavailable">
              Reporter information is unavailable.
            </p>
          )}

          <small>
            {isEditing
              ? "The Reporter is the person who created this Task and cannot be changed."
              : "You will automatically become the Reporter when this Task is created."}
          </small>
        </div>
        <fieldset
          className={"task-form__field " + "task-form__assignees"}
          disabled={isSubmitting}
        >
          <legend>Assignees</legend>

          {assignees.length === 0 ? (
            <p className="task-form__assignees-empty">
              No assignable Project members are available.
            </p>
          ) : (
            <div
              className="task-form__assignee-options"
              role="group"
              aria-label="Select Task Assignees"
            >
              {assignees.map((assignee) => {
                const isSelected = assigneeIds.includes(assignee.userId);

                return (
                  <label
                    key={assignee.userId}
                    className={
                      `task-form__assignee-option ` +
                      `${
                        isSelected ? "task-form__assignee-option--selected" : ""
                      }`
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAssignee(assignee.userId)}
                    />

                    <span className="task-assignee__avatar" aria-hidden="true">
                      {getAssigneeInitial(assignee.name)}
                    </span>

                    <span className="task-form__assignee-details">
                      <strong>{assignee.name}</strong>

                      {assignee.email && <small>{assignee.email}</small>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="task-form__assignee-summary">
            <small>
              {assigneeIds.length === 0
                ? "No one is currently assigned."
                : `${assigneeIds.length} ${
                    assigneeIds.length === 1 ? "person" : "people"
                  } selected.`}
            </small>

            <button
              type="button"
              className="button button--secondary"
              onClick={() => setAssigneeIds([])}
              disabled={isSubmitting || assigneeIds.length === 0}
            >
              Clear all
            </button>
          </div>
        </fieldset>

        <div className="task-form__field">
          <label htmlFor="task-status">Status</label>

          <select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={isSubmitting || !hasWorkflowStatuses}
            required
          >
            {!hasWorkflowStatuses && (
              <option value="">No workflow statuses available</option>
            )}

            {workflowStatuses.map((workflowStatus) => (
              <option key={workflowStatus.id} value={workflowStatus.id}>
                {workflowStatus.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        )}

        <div className="task-form__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="button button--primary"
            disabled={isSubmitting || !hasWorkflowStatuses}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;
