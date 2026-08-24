import { Link } from "react-router";

function ProjectHeader({
  project,
  taskCount,
  backTo,
  manageAccessTo,
  onAddTask,
  canAddTask = false,
  canManageMembers = false,
}) {
  const taskCountLabel = `${taskCount} ${taskCount === 1 ? "Task" : "Tasks"}`;

  return (
    <header className="board-header">
      <div className="board-header__identity">
        <Link
          to={backTo}
          className="project-header__back"
          aria-label="Back to Projects"
          title="Back to Projects"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>

        <div className="board-header__details">
          <div className="project-title-row">
            <h1>{project.name}</h1>

            <span className="project-task-count">{taskCountLabel}</span>
          </div>

          <div
            className="project-header__metadata"
            aria-label="Project information"
          >
            <span className="project-header__key">{project.projectKey}</span>

            <span aria-hidden="true">·</span>

            <span className="project-header__visibility">
              {project.visibility}
            </span>

            <span aria-hidden="true">·</span>

            <span className="project-header__role">
              {project.currentUserRole}
            </span>
          </div>
        </div>
      </div>

      <div className="board-header__actions">
        {canManageMembers && (
          <Link
            to={manageAccessTo}
            className={"button button--secondary " + "board-header__access"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6" />
              <path d="M22 11h-6" />
            </svg>

            <span>Manage Access</span>
          </Link>
        )}

        {canAddTask && (
          <button
            type="button"
            className={"button button--primary " + "board-header__add-task"}
            onClick={() => onAddTask()}
          >
            <span className="board-header__add-icon" aria-hidden="true">
              +
            </span>
            Add Task
          </button>
        )}
      </div>
    </header>
  );
}

export default ProjectHeader;
