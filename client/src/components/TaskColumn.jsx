import TaskCard from "./TaskCard";

function TaskColumn({
  workflowStatus,
  tasks,
  onEditTask,
  onDeleteTask,
  canEditTasks = false,
  canDeleteTasks = false,
  deletingTaskId,
}) {
  const columnTasks = tasks.filter(
    (task) => task.status === workflowStatus.id,
  );

  return (
    <section
      className="task-column"
      style={{
        "--status-color": workflowStatus.color,
      }}
    >
      <header className="task-column__header">
        <h2>{workflowStatus.name}</h2>

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
              workflowStatus={workflowStatus}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              canEdit={canEditTasks}
              canDelete={canDeleteTasks}
              isDeleting={
                deletingTaskId === task.id
              }
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