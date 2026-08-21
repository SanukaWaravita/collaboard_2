import TaskCard from "./TaskCard";

function TaskColumn({
  workflowStatus,
  tasks,
  projectMembers = [],
  onEditTask,
  onDeleteTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onTaskDragLeave,
  onTaskDrop,
  canEditTasks = false,
  canDeleteTasks = false,
  deletingTaskId = null,
  draggingTaskId = null,
  movingTaskId = null,
  dropTargetStatusId = null,
}) {
  const columnTasks = tasks.filter((task) => task.status === workflowStatus.id);

  const isDropTarget = dropTargetStatusId === workflowStatus.id;

  const columnClassName = [
    "task-column",
    isDropTarget ? "task-column--drop-target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={columnClassName}
      style={{
        "--status-color": workflowStatus.color,
      }}
      aria-label={`${workflowStatus.name} status column`}
      onDragOver={(event) => onTaskDragOver(event, workflowStatus.id)}
      onDragLeave={(event) => onTaskDragLeave(event, workflowStatus.id)}
      onDrop={(event) => onTaskDrop(event, workflowStatus.id)}
    >
      <header className="task-column__header">
        <h2>{workflowStatus.name}</h2>

        <span className="task-column__count">{columnTasks.length}</span>
      </header>

      <div className="task-column__content">
        {columnTasks.length > 0 ? (
          columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              workflowStatus={workflowStatus}
              projectMembers={projectMembers}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
              canEdit={canEditTasks}
              canDelete={canDeleteTasks}
              canDrag={canEditTasks && movingTaskId === null}
              isDeleting={deletingTaskId === task.id}
              isDragging={draggingTaskId === task.id}
              isMoving={movingTaskId === task.id}
            />
          ))
        ) : (
          <p className="task-column__empty">
            {isDropTarget ? "Drop task here." : "No tasks in this column."}
          </p>
        )}
      </div>
    </section>
  );
}

export default TaskColumn;
