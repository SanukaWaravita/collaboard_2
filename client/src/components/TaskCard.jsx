import { getDueDateLabel, getDueDateState } from "../utils/taskDueDate";
import {
  getAssigneeInitial,
  resolveTaskAssignees,
} from "../utils/taskAssignee";

function TaskCard({
  task,
  workflowStatus,
  projectMembers = [],
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  canEdit = false,
  editLabel = "Edit Task",
  canDelete = false,
  canDrag = false,
  isDeleting = false,
  isDragging = false,
  isMoving = false,
}) {
  const taskAssignees = resolveTaskAssignees(task.assigneeIds, projectMembers);

  const reporterName = task.reporter?.name ?? "Unknown reporter";

  const reporterEmail = task.reporter?.email ?? null;

  const statusName = workflowStatus?.name ?? "Unknown Status";

  const statusColor = workflowStatus?.color ?? "#64748b";

  const isCompleted = workflowStatus?.isCompleted ?? false;

  const dueDateState = getDueDateState(task.dueDate, isCompleted);

  const dueDateLabel = getDueDateLabel(task.dueDate, isCompleted);

  const isBusy = isDeleting || isMoving;

  const busyLabel = isDeleting ? "Deleting..." : isMoving ? "Moving..." : "";

  const taskCardClassName = [
    "task-card",
    isDragging ? "task-card--dragging" : "",
    isMoving ? "task-card--moving" : "",
    isDeleting ? "task-card--deleting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={taskCardClassName}
      draggable={canDrag && !isBusy}
      onDragStart={(event) => onDragStart?.(event, task)}
      onDragEnd={onDragEnd}
      data-task-id={task.id}
    >
      {canDrag && !isBusy && (
        <div className="task-card__drag-handle" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="9" cy="7" r="1.5" />

            <circle cx="15" cy="7" r="1.5" />

            <circle cx="9" cy="12" r="1.5" />

            <circle cx="15" cy="12" r="1.5" />

            <circle cx="9" cy="17" r="1.5" />

            <circle cx="15" cy="17" r="1.5" />
          </svg>
        </div>
      )}

      <div className="task-card__top">
        <span
          className="task-status"
          style={{
            "--status-color": statusColor,
          }}
        >
          <span className="task-status__dot" aria-hidden="true" />

          {statusName}
        </span>

        {busyLabel && (
          <span className="task-card__moving-status" role="status">
            {busyLabel}
          </span>
        )}
      </div>

      <h3>{task.title}</h3>

      {task.description && (
        <p className="task-card__description">{task.description}</p>
      )}

      <div className="task-card__metadata">
        {task.dueDate && (
          <span className={"task-due-date " + `task-due-date--${dueDateState}`}>
            {dueDateLabel}
          </span>
        )}

        <div className="task-assignee-list" aria-label="Task Assignees">
          {taskAssignees.length === 0 ? (
            <div
              className={"task-assignee " + "task-assignee--unassigned"}
              title="Unassigned"
            >
              <span className="task-assignee__avatar" aria-hidden="true">
                —
              </span>

              <span className="task-assignee__name">Unassigned</span>
            </div>
          ) : (
            taskAssignees.map((assignee) => (
              <div
                key={assignee.userId}
                className="task-assignee"
                title={assignee.email ?? assignee.name}
              >
                <span className="task-assignee__avatar" aria-hidden="true">
                  {assignee.initial}
                </span>

                <span className="task-assignee__name">{assignee.name}</span>
              </div>
            ))
          )}
        </div>
        <div
          className={"task-reporter " + "task-reporter--card"}
          title={reporterEmail ?? reporterName}
          aria-label={`Reported by ${reporterName}`}
        >
          <span className="task-reporter__avatar" aria-hidden="true">
            {getAssigneeInitial(reporterName)}
          </span>

          <span className="task-reporter__identity">
            <small className="task-reporter__label">Reported by</small>

            <span className="task-reporter__name">{reporterName}</span>
          </span>
        </div>
      </div>

      {(canEdit || canDelete) && (
        <footer className="task-card__footer">
          <div className="task-card__actions">
            {canEdit && (
              <button
                type="button"
                className="task-card__icon-button"
                onClick={() => onEdit(task)}
                disabled={isBusy}
                aria-label={`${editLabel}: ${task.title}`}
title={editLabel}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />

                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                className={
                  "task-card__icon-button " + "task-card__icon-button--danger"
                }
                onClick={() => onDelete(task)}
                disabled={isBusy}
                aria-label={
                  isDeleting ? `Deleting ${task.title}` : `Delete ${task.title}`
                }
                title={isDeleting ? "Deleting Task" : "Delete Task"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M4 7h16" />

                  <path d="M9 7V4h6v3" />

                  <path d="m6 7 1 14h10l1-14" />
                </svg>
              </button>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}

export default TaskCard;
