function TaskCard({ task, onEdit }) {
  const statusLabels = {
    todo: "To Do",
    doing: "Doing",
    done: "Done",
  };

  return (
    <article className="task-card">
      <div className="task-card__header">
        <h3>{task.title}</h3>

        <span className={`task-status task-status--${task.status}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      <p>{task.description}</p>

      <div className="task-card__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => onEdit(task)}
        >
          Edit
        </button>

        <button type="button" className="button button--danger">
          Delete
        </button>
      </div>
    </article>
  );
}

export default TaskCard;