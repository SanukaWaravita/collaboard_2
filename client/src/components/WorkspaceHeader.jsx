import { Link } from "react-router";

function WorkspaceHeader({
  workspace,
  projectCount,
  backTo,
  membersTo,
  onCreateProject,
  canManageMembers = false,
  canCreateProject = false,
}) {
  const projectCountLabel =
    `${projectCount} ` +
    `${projectCount === 1 ? "Project" : "Projects"}`;

  return (
    <header className="board-header workspace-project-header">
      <div className="board-header__identity">
        <Link
  to={backTo}
  className="workspace-project-header__back"
  aria-label="Back to My Workspaces"
  title="My Workspaces"
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
            <h1>{workspace.name}</h1>

            <span className="project-task-count">
              {projectCountLabel}
            </span>
          </div>

          <div
            className="project-header__metadata"
            aria-label="Workspace information"
          >
            <span className="project-header__key">
              {workspace.slug}
            </span>

            <span aria-hidden="true">·</span>

            <span className="project-header__role">
              {workspace.currentUserRole}
            </span>
          </div>
        </div>
      </div>

      <div className="board-header__actions">
        {canManageMembers && (
          <Link
            to={membersTo}
            className={
              "button button--secondary " +
              "workspace-project-header__access"
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="3" />
              <path d="M3 19v-2a6 6 0 0 1 12 0v2" />
              <path d="M16 11a4 4 0 0 1 5 4v2" />
            </svg>

            <span>Members &amp; Access</span>
          </Link>
        )}

        {canCreateProject && (
          <button
            type="button"
            className={
              "button button--primary " +
              "workspace-project-header__create"
            }
            onClick={() => onCreateProject()}
          >
            <span
              className="board-header__add-icon"
              aria-hidden="true"
            >
              +
            </span>

            <span>Create Project</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default WorkspaceHeader;