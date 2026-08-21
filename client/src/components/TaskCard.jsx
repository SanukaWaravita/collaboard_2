import {
  getDueDateLabel,
  getDueDateState,
} from "../utils/taskDueDate";
import {
  resolveTaskAssignees,
} from "../utils/taskAssignee";

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
  const taskAssignees = resolveTaskAssignees(
  task.assigneeIds,
  projectMembers,
);

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
  className="task-assignee-list"
  aria-label="Task Assignees"
>
  {taskAssignees.length === 0 ? (
    <div
      className={
        "task-assignee " +
        "task-assignee--unassigned"
      }
      title="Unassigned"
    >
      <span
        className="task-assignee__avatar"
        aria-hidden="true"
      >
        —
      </span>

      <span className="task-assignee__name">
        Unassigned
      </span>
    </div>
  ) : (
    taskAssignees.map((assignee) => (
      <div
        key={assignee.userId}
        className="task-assignee"
        title={assignee.email ?? assignee.name}
      >
        <span
          className="task-assignee__avatar"
          aria-hidden="true"
        >
          {assignee.initial}
        </span>

        <span className="task-assignee__name">
          {assignee.name}
        </span>
      </div>
    ))
  )}
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