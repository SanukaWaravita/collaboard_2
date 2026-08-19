import TaskCard from "./TaskCard";

function TaskColumn({
  title,
  status,
  tasks,
  onEditTask,
  onDeleteTask,
  canEditTasks = false,
  canDeleteTasks = false,
  deletingTaskId,
}) {
  const columnTasks = tasks.filter(
    (task) => task.status === status,
  );

  return (
    <section className={`task-column task-column--${status}`}>
      <header className="task-column__header">
        <h2>{title}</h2>

        <span className="task-column__count">
          {columnTasks.length}
        </span>
      </header>

      <div className="task-column__content">
        {columnTasks.length > 0 ? (
          columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              canEdit={canEditTasks}
              canDelete={canDeleteTasks}
              isDeleting={deletingTaskId === task.id}
            />
          ))
        ) : (
          <p className="task-column__empty">
            No tasks in this column.
          </p>
        )}
      </div>
    </section>
  );
}

export default TaskColumn;