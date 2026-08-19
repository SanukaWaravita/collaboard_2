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
    <article className="board-card">
      <div className="board-card__content">
        <div className="entity-card__heading">
          <div>
            <span className="project-key">
              {project.projectKey}
            </span>

            <h2>{project.name}</h2>
          </div>

          <span
            className={`entity-badge entity-badge--${project.visibility}`}
          >
            {project.visibility}
          </span>
        </div>

        <p>
          {project.description || "No description provided."}
        </p>

        <div className="entity-card__metadata">
          <span>
            Role: {project.currentUserRole ?? "None"}
          </span>

          {!project.isMember && (
            <span>Open workspace access</span>
          )}
        </div>
      </div>

      <div className="board-card__footer">
        <span>
          {project.taskCount}{" "}
          {project.taskCount === 1 ? "task" : "tasks"}
        </span>

        <div className="board-card__actions">
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
            to={`/workspaces/${project.workspaceId}/projects/${project.id}`}
            className="button button--primary board-card__link"
            aria-disabled={isDeleting}
            onClick={(event) => {
              if (isDeleting) {
                event.preventDefault();
              }
            }}
          >
            Open Project
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;