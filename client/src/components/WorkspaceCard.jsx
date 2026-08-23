import { Link } from "react-router";
import { WORKSPACE_PERMISSIONS } from "../constants/access";

function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  const canEdit = workspace.permissions.includes(
    WORKSPACE_PERMISSIONS.UPDATE_WORKSPACE,
  );

  const canDelete = workspace.permissions.includes(
    WORKSPACE_PERMISSIONS.DELETE_WORKSPACE,
  );

  return (
    <article className="entity-card entity-card--workspace">
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
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1.5"
            />

            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1.5"
            />

            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1.5"
            />

            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1.5"
            />
          </svg>
        </div>

        <div className="entity-card__content">
          <div className="entity-card__heading">
            <div>
              <span className="entity-card__type">
                Workspace
              </span>

              <h2>{workspace.name}</h2>
            </div>

            <span className="entity-badge">
              {workspace.currentUserRole}
            </span>
          </div>

          <p className="entity-card__slug">
            /{workspace.slug}
          </p>

          <div className="entity-card__metadata">
            <span>
              {workspace.projectCount}{" "}
              {workspace.projectCount === 1
                ? "project"
                : "projects"}
            </span>

            <span aria-hidden="true">•</span>

            <span>
              {workspace.memberCount}{" "}
              {workspace.memberCount === 1
                ? "member"
                : "members"}
            </span>
          </div>
        </div>
      </div>

      <footer className="entity-card__footer">
        <div className="entity-card__actions">
          {canEdit && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onEdit(workspace)}
              disabled={isDeleting}
            >
              Edit
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="button button--danger"
              onClick={() => onDelete(workspace)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          <Link
            to={`/workspaces/${workspace.id}/projects`}
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
            Open Workspace

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

export default WorkspaceCard;