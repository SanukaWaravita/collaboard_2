import { Link } from "react-router";
import { PROJECT_PERMISSIONS } from "../constants/access";

function ProjectCard({
  project,
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  const canEdit = project.permissions.includes(
    PROJECT_PERMISSIONS.UPDATE_PROJECT,
  );

  const canDelete = project.permissions.includes(
    PROJECT_PERMISSIONS.DELETE_PROJECT,
  );

  return (
    <article className="entity-card entity-card--project">
      <div className="entity-card__body">
        <div
          className="entity-card__icon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 7h6l2 2h8v10H4z" />
            <path d="M4 7V5h7l2 2" />
          </svg>
        </div>

        <div className="entity-card__content">
          <div className="entity-card__heading">
            <div>
              <span className="project-key">
                {project.projectKey}
              </span>

              <h2>{project.name}</h2>
            </div>

            <span
              className={
                `entity-badge ` +
                `entity-badge--${project.visibility}`
              }
            >
              {project.visibility}
            </span>
          </div>

          <p className="entity-card__description">
            {project.description ||
              "No description provided."}
          </p>

          <div className="entity-card__metadata">
            <span>
              Role: {project.currentUserRole ?? "None"}
            </span>

            {!project.isMember && (
              <>
                <span aria-hidden="true">•</span>

                <span>Open workspace access</span>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="entity-card__footer">
        <div className="entity-card__count">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M9 5h6" />
            <path d="M9 9h6" />
            <path d="M9 13h4" />

            <path
              d={
                "M5 3h14a2 2 0 0 1 2 2v14" +
                "a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" +
                "a2 2 0 0 1 2-2z"
              }
            />
          </svg>

          <span>
            {project.taskCount}{" "}
            {project.taskCount === 1
              ? "task"
              : "tasks"}
          </span>
        </div>

        <div className="entity-card__actions">
          {canEdit && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onEdit(project)}
              disabled={isDeleting}
            >
              Edit
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="button button--danger"
              onClick={() => onDelete(project)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          <Link
            to={
              `/workspaces/${project.workspaceId}` +
              `/projects/${project.id}`
            }
            className={
              `button button--primary ` +
              `entity-card__open-link`
            }
            aria-disabled={isDeleting}
            onClick={(event) => {
              if (isDeleting) {
                event.preventDefault();
              }
            }}
          >
            Open Project

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </footer>
    </article>
  );
}

export default ProjectCard;