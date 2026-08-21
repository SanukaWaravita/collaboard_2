import {
  getDueDateLabel,
  getDueDateState,
} from "../utils/taskDueDate";

function TaskCard({
  task,
  workflowStatus,
  projectMembers = [],
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isDeleting = false,
}) {
  const assignee = task.assigneeId
  ? projectMembers.find(
      (member) =>
        member.userId === task.assigneeId,
    )
  : null;

const assigneeName = task.assigneeId
  ? assignee?.name ?? "Unknown assignee"
  : "Unassigned";

const assigneeInitial = assignee?.name
  ?.trim()
  .charAt(0)
  .toUpperCase() ?? "—";

  const statusName =
    workflowStatus?.name ?? "Unknown status";

  const statusColor =
    workflowStatus?.color ?? "#64748b";

  const dueDateState = getDueDateState(
    task.dueDate,
    workflowStatus?.isCompleted ?? false,
  );

  const dueDateLabel = getDueDateLabel(
    task.dueDate,
    workflowStatus?.isCompleted ?? false,
  );

  return (
    <article className="task-card">
      <div className="task-card__header">
        <h3>{task.title}</h3>

        <span
          className="task-status"
          style={{
            "--status-color": statusColor,
          }}
        >
          {statusName}
        </span>
      </div>

      <p>{task.description}</p>

<div className="task-card__metadata">
  {task.dueDate && (
    <div
      className={
        `task-due-date ` +
        `task-due-date--${dueDateState}`
      }
    >
      {dueDateLabel}
    </div>
  )}

  <div
    className={
      `task-assignee ` +
      `${
        task.assigneeId
          ? ""
          : "task-assignee--unassigned"
      }`
    }
    title={assignee?.email ?? assigneeName}
  >
    <span
      className="task-assignee__avatar"
      aria-hidden="true"
    >
      {assigneeInitial}
    </span>

    <span className="task-assignee__name">
      {assigneeName}
    </span>
  </div>
</div>

{(canEdit || canDelete) && (
        <div className="task-card__actions">
          {canEdit && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onEdit(task)}
              disabled={isDeleting}
            >
              Edit
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="button button--danger"
              onClick={() => onDelete(task)}
              disabled={isDeleting}
            >
              {isDeleting
                ? "Deleting..."
                : "Delete"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default TaskCard;