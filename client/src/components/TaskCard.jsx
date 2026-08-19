function TaskCard({
  task,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isDeleting = false,
}) {
  const statusLabels = {
    todo: "To Do",
    doing: "Doing",
    done: "Done",
  };

  return (
    <article className="task-card">
      <div className="task-card__header">
        <h3>{task.title}</h3>

        <span
          className={`task-status task-status--${task.status}`}
        >
          {statusLabels[task.status]}
        </span>
      </div>

      <p>{task.description}</p>

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
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default TaskCard;