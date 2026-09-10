import { Link } from "react-router";
import { WORKSPACE_PERMISSIONS } from "../constants/access";
import Icon from "./Icon";

function WorkspaceList({
  workspaces,
  onEdit,
  onDelete,
  deletingWorkspaceId = null,
}) {
  return (
    <section className="entity-list" aria-labelledby="workspace-list-title">
      <header className="entity-list__header">
        <h2 id="workspace-list-title">All Workspaces</h2>

        <span className="entity-list__count">{workspaces.length}</span>
      </header>

      <div className="entity-list__table-wrapper">
        <table role="table"
          className={"entity-list__table " + "entity-list__table--workspaces"}
        >
          <thead>
            <tr role="row">
              <th role="columnheader" scope="col">Workspace</th>
              <th role="columnheader" scope="col">Slug</th>
              <th role="columnheader" scope="col">Role</th>
              <th role="columnheader" scope="col">Projects</th>
              <th role="columnheader" scope="col">Members</th>
              <th role="columnheader" scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {workspaces.map((workspace) => {
              const isDeleting = deletingWorkspaceId === workspace.id;

              const canEdit = workspace.permissions.includes(
                WORKSPACE_PERMISSIONS.UPDATE_WORKSPACE,
              );

              const canDelete = workspace.permissions.includes(
                WORKSPACE_PERMISSIONS.DELETE_WORKSPACE,
              );

              return (
                <tr role="row" key={workspace.id}>
                  <td role="cell" className="entity-list__primary"><span className="mobile-cell-label" aria-hidden="true">Workspace</span>
                    <span className="entity-list__type">Workspace</span>

                    <strong>{workspace.name}</strong>
                  </td>

                  <td role="cell" className="entity-list__slug"><span className="mobile-cell-label" aria-hidden="true">Slug</span>/{workspace.slug}</td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Role</span>
                    <span className="entity-badge">
                      {workspace.currentUserRole}
                    </span>
                  </td>

                  <td role="cell" className="entity-list__number"><span className="mobile-cell-label" aria-hidden="true">Projects</span>
                    {workspace.projectCount}
                  </td>

                  <td role="cell" className="entity-list__number"><span className="mobile-cell-label" aria-hidden="true">Members</span>
                    {workspace.memberCount}
                  </td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Actions</span>
                    <div className="entity-list__actions">
                      {canEdit && (
                        <button
                          type="button"
                          className={
                            "button button--secondary " +
                            "workspace-action-button"
                          }
                          onClick={() => onEdit(workspace)}
                          aria-label={`Edit ${workspace.name}`}
                          title={`Edit ${workspace.name}`}
                          disabled={isDeleting}
                        >
                          <Icon name="pencil" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className={
                            "button button--danger " +
                            "workspace-action-button"
                          }
                          onClick={() => onDelete(workspace)}
                          aria-label={
                            isDeleting
                              ? `Deleting ${workspace.name}`
                              : `Delete ${workspace.name}`
                          }
                          title={
                            isDeleting
                              ? `Deleting ${workspace.name}`
                              : `Delete ${workspace.name}`
                          }
                          disabled={isDeleting}
                        >
                          <Icon name="trash" />
                        </button>
                      )}

                      <Link
                        to={`/workspaces/` + `${workspace.id}/projects`}
                        className={
                          "button button--primary " + "entity-list__open-link"
                        }
                        aria-label={`Open ${workspace.name}`}
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
