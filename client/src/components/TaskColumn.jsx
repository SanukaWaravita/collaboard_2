import TaskCard from "./TaskCard";

function TaskColumn({
  workflowStatus,
  tasks,
  projectMembers = [],
  onEditTask,
  onDeleteTask,
  onAddTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onTaskDragLeave,
  onTaskDrop,
  canAddTasks = false,
  canEditTasks = false,
  canDeleteTasks = false,
  deletingTaskId = null,
  draggingTaskId = null,
  movingTaskId = null,
  dropTargetStatusId = null,
}) {
  const columnTasks = tasks.filter(
    (task) => task.status === workflowStatus.id,
  );

  const isDropTarget =
    dropTargetStatusId === workflowStatus.id;

  const statusColor =
    workflowStatus.color ?? "#64748b";

  const columnClassName = [
    "task-column",
    isDropTarget
      ? "task-column--drop-target"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={columnClassName}
      style={{
        "--status-color": statusColor,
      }}
      aria-label={
        `${workflowStatus.name} status column`
      }
      onDragOver={(event) =>
        onTaskDragOver(
          event,
          workflowStatus.id,
        )
      }
      onDragLeave={(event) =>
        onTaskDragLeave(
          event,
          workflowStatus.id,
        )
      }
      onDrop={(event) =>
        onTaskDrop(
          event,
          workflowStatus.id,
        )
      }
    >
      <header className="task-column__header">
        <div className="task-column__title">
          <span
            className="task-column__status-dot"
            aria-hidden="true"
          />

          <h2>{workflowStatus.name}</h2>

          <span
            className="task-column__count"
            aria-label={
              `${columnTasks.length} ` +
              `${
                columnTasks.length === 1
                  ? "Task"
                  : "Tasks"
              }`
            }
          >
            {columnTasks.length}
          </span>
        </div>

        {canAddTasks && (
          <button
            type="button"
            className="task-column__add"
            onClick={() =>
              onAddTask?.(
                workflowStatus.id,
              )
            }
            aria-label={
              `Add Task to ` +
              `${workflowStatus.name}`
            }
            title={
              `Add Task to ` +
              `${workflowStatus.name}`
            }
          >
            <span aria-hidden="true">+</span>
          </button>
        )}
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
              canDrag={
                canEditTasks &&
                movingTaskId === null
              }
              isDeleting={
                deletingTaskId === task.id
              }
              isDragging={
                draggingTaskId === task.id
              }
              isMoving={
                movingTaskId === task.id
              }
            />
          ))
        ) : (
          <div
            className="task-column__empty"
            aria-live="polite"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="3"
              />

              <path d="M12 8v8" />

              <path d="M8 12h8" />
            </svg>

            <span>
              {isDropTarget
                ? "Drop Task Here"
                : "No Tasks Yet"}
            </span>
          </div>
        )}
      </div>

      {canAddTasks && (
        <button
          type="button"
          className="task-column__footer-add"
          onClick={() =>
            onAddTask?.(
              workflowStatus.id,
            )
          }
        >
          <span aria-hidden="true">+</span>

          Add Task
        </button>
      )}
    </section>
  );
}

export default TaskColumn;