const STATUS_LABELS = {
  todo: "To Do",
  doing: "Doing",
  done: "Done",
};

function TaskList({
  tasks,
  onEditTask,
  onDeleteTask,
  canEditTasks = false,
  canDeleteTasks = false,
  deletingTaskId = null,
}) {
  if (tasks.length === 0) {
    return (
      <section className="task-list-empty">
        <h2>No tasks yet</h2>

        <p>
          Tasks created in this project will appear here.
        </p>
      </section>
    );
  }

  return (
    <section
      className="task-list"
      aria-labelledby="task-list-title"
    >
      <header className="task-list__header">
        <h2 id="task-list-title">All Tasks</h2>

        <span className="task-list__count">
          {tasks.length}
        </span>
      </header>

      <div className="task-list__table-wrapper">
        <table className="task-list__table">
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Description</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const isDeleting =
                deletingTaskId === task.id;

              return (
                <tr key={task.id}>
                  <td className="task-list__title">
                    {task.title}
                  </td>

                  <td className="task-list__description">
                    {task.description || "No description"}
                  </td>

                  <td>
                    <span
                      className={
                        `task-status ` +
                        `task-status--${task.status}`
                      }
                    >
                      {STATUS_LABELS[task.status] ??
                        task.status}
                    </span>
                  </td>

                  <td>
                    {(canEditTasks ||
                      canDeleteTasks) && (
                      <div className="task-list__actions">
                        {canEditTasks && (
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() =>
                              onEditTask(task)
                            }
                            aria-label={
                              `Edit ${task.title}`
                            }
                            disabled={isDeleting}
                          >
                            Edit
                          </button>
                        )}

                        {canDeleteTasks && (
                          <button
                            type="button"
                            className="button button--danger"
                            onClick={() =>
                              onDeleteTask(task)
                            }
                            aria-label={
                              `Delete ${task.title}`
                            }
                            disabled={isDeleting}
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    )}

                    {!canEditTasks &&
                      !canDeleteTasks && (
                        <span className="task-list__read-only">
                          Read only
                        </span>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TaskList;