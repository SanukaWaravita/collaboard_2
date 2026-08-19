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
    <article className="board-card">
      <div className="board-card__content">
        <div className="entity-card__heading">
          <h2>{workspace.name}</h2>

          <span className="entity-badge">
            {workspace.currentUserRole}
          </span>
        </div>

        <p>/{workspace.slug}</p>

        <div className="entity-card__metadata">
          <span>
            {workspace.projectCount}{" "}
            {workspace.projectCount === 1
              ? "project"
              : "projects"}
          </span>

          <span>
            {workspace.memberCount}{" "}
            {workspace.memberCount === 1
              ? "member"
              : "members"}
          </span>
        </div>
      </div>

      <div className="board-card__footer">
        <span>Workspace</span>

        <div className="board-card__actions">
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
            className="button button--primary board-card__link"
            aria-disabled={isDeleting}
            onClick={(event) => {
              if (isDeleting) {
                event.preventDefault();
              }
            }}
          >
            Open Workspace
          </Link>
        </div>
      </div>
    </article>
  );
}

export default WorkspaceCard;