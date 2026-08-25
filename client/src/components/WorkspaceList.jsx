import { Link } from "react-router";
import {
  WORKSPACE_PERMISSIONS,
} from "../constants/access";

function WorkspaceList({
  workspaces,
  onEdit,
  onDelete,
  deletingWorkspaceId = null,
}) {
  return (
    <section
      className="entity-list"
      aria-labelledby="workspace-list-title"
    >
      <header className="entity-list__header">
        <h2 id="workspace-list-title">
          All Workspaces
        </h2>

        <span className="entity-list__count">
          {workspaces.length}
        </span>
      </header>

      <div className="entity-list__table-wrapper">
        <table
          className={
            "entity-list__table " +
            "entity-list__table--workspaces"
          }
        >
          <thead>
            <tr>
              <th scope="col">Workspace</th>
              <th scope="col">Slug</th>
              <th scope="col">Role</th>
              <th scope="col">Projects</th>
              <th scope="col">Members</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {workspaces.map((workspace) => {
              const isDeleting =
                deletingWorkspaceId ===
                workspace.id;

              const canEdit =
                workspace.permissions.includes(
                  WORKSPACE_PERMISSIONS
                    .UPDATE_WORKSPACE,
                );

              const canDelete =
                workspace.permissions.includes(
                  WORKSPACE_PERMISSIONS
                    .DELETE_WORKSPACE,
                );

              return (
                <tr key={workspace.id}>
                  <td className="entity-list__primary">
                    <span className="entity-list__type">
                      Workspace
                    </span>

                    <strong>
                      {workspace.name}
                    </strong>
                  </td>

                  <td className="entity-list__slug">
                    /{workspace.slug}
                  </td>

                  <td>
                    <span className="entity-badge">
                      {workspace.currentUserRole}
                    </span>
                  </td>

                  <td className="entity-list__number">
                    {workspace.projectCount}
                  </td>

                  <td className="entity-list__number">
                    {workspace.memberCount}
                  </td>

                  <td>
                    <div className="entity-list__actions">
                      {canEdit && (
                        <button
                          type="button"
                          className={
                            "button " +
                            "button--secondary"
                          }
                          onClick={() =>
                            onEdit(workspace)
                          }
                          aria-label={
                            `Edit ${workspace.name}`
                          }
                          disabled={isDeleting}
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className={
                            "button " +
                            "button--danger"
                          }
                          onClick={() =>
                            onDelete(workspace)
                          }
                          aria-label={
                            `Delete ${workspace.name}`
                          }
                          disabled={isDeleting}
                        >
                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}

                      <Link
                        to={
                          `/workspaces/` +
                          `${workspace.id}/projects`
                        }
                        className={
                          "button button--primary " +
                          "entity-list__open-link"
                        }
                        aria-label={
                          `Open ${workspace.name}`
                        }
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

export default WorkspaceList;