import { getDueDateLabel, getDueDateState } from "../utils/taskDueDate";
import {
  getAssigneeInitial,
  resolveTaskAssignees,
} from "../utils/taskAssignee";

function TaskList({
  tasks,
  workflowStatuses = [],
  projectMembers = [],
  onEditTask,
  onDeleteTask,
  canEditTasks = false,
  canDeleteTasks = false,
  deletingTaskId = null,
}) {
  const statusesById = new Map(
    workflowStatuses.map((status) => [status.id, status]),
  );

  if (tasks.length === 0) {
    return (
      <section className="task-list-empty">
        <h2>No tasks yet</h2>

        <p>Tasks created in this project will appear here.</p>
      </section>
    );
  }

  return (
    <section className="task-list" aria-labelledby="task-list-title">
      <header className="task-list__header">
        <h2 id="task-list-title">All Tasks</h2>

        <span className="task-list__count">{tasks.length}</span>
      </header>

      <div className="task-list__table-wrapper">
        <table role="table" className="task-list__table">
          <thead>
            <tr role="row">
              <th role="columnheader" scope="col">Task</th>
              <th role="columnheader" scope="col">Description</th>
              <th role="columnheader" scope="col">Status</th>
              <th role="columnheader" scope="col">Assignee</th>
              <th role="columnheader" scope="col">Reporter</th>
              <th role="columnheader" scope="col">Due date</th>
              <th role="columnheader" scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const isDeleting = deletingTaskId === task.id;

              const canOpenTaskForm = canEditTasks || task.canAssignReporter;

              const workflowStatus = statusesById.get(task.status);

              const statusName = workflowStatus?.name ?? "Unknown status";

              const statusColor = workflowStatus?.color ?? "#64748b";

              const dueDateState = getDueDateState(
                task.dueDate,
                workflowStatus?.isCompleted ?? false,
              );

              const taskAssignees = resolveTaskAssignees(
                task.assigneeIds,
                projectMembers,
              );

              const reporterName = task.reporter?.name ?? "Unknown reporter";

              const reporterEmail = task.reporter?.email ?? null;

              const dueDateLabel = getDueDateLabel(
                task.dueDate,
                workflowStatus?.isCompleted ?? false,
              );

              return (
                <tr role="row" key={task.id}>
                  <td role="cell" className="task-list__title"><span className="mobile-cell-label" aria-hidden="true">Task</span>{task.title}</td>

                  <td role="cell" className="task-list__description"><span className="mobile-cell-label" aria-hidden="true">Description</span>
                    {task.description || "No description"}
                  </td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Status</span>
                    <span
                      className="task-status"
                      style={{
                        "--status-color": statusColor,
                      }}
                    >
                      {statusName}
                    </span>
                  </td>

                  <td role="cell" className="task-list__assignee"><span className="mobile-cell-label" aria-hidden="true">Assignee</span>
                    <div
                      className="task-assignee-list"
                      aria-label="Task Assignees"
                    >
                      {taskAssignees.length === 0 ? (
                        <div
                          className={
                            "task-assignee " + "task-assignee--unassigned"
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
                  </td>

                  <td role="cell" className="task-list__reporter"><span className="mobile-cell-label" aria-hidden="true">Reporter</span>
                    <div
                      className="task-reporter"
                      title={reporterEmail ?? reporterName}
                      aria-label={`Reporter: ${reporterName}`}
                    >
                      <span
                        className="task-reporter__avatar"
                        aria-hidden="true"
                      >
                        {getAssigneeInitial(reporterName)}
                      </span>

                      <span className="task-reporter__identity">
                        <span className="task-reporter__name">
                          {reporterName}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td role="cell" className="task-list__due-date"><span className="mobile-cell-label" aria-hidden="true">Due date</span>
                    <span
                      className={
                        `task-due-date ` + `task-due-date--${dueDateState}`
                      }
                    >
                      {dueDateLabel}
                    </span>
                  </td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Actions</span>
                    {(canOpenTaskForm || canDeleteTasks) && (
                      <div className="task-list__actions">
                        {canOpenTaskForm && (
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => onEditTask(task)}
                            aria-label={`Edit ${task.title}`}
                            disabled={isDeleting}
                          >
                            {canEditTasks ? "Edit" : "Change Reporter"}
                          </button>
                        )}

                        {canDeleteTasks && (
                          <button
                            type="button"
                            className="button button--danger"
                            onClick={() => onDeleteTask(task)}
                            aria-label={`Delete ${task.title}`}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    )}

                    {!canOpenTaskForm && !canDeleteTasks && (
                      <span className="task-list__read-only">Read only</span>
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
