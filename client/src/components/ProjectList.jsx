import { Link } from "react-router";
import { PROJECT_PERMISSIONS } from "../constants/access";

function ProjectList({ projects, onEdit, onDelete, deletingProjectId = null }) {
  return (
    <section className="entity-list" aria-labelledby="project-list-title">
      <header className="entity-list__header">
        <h2 id="project-list-title">All Projects</h2>

        <span className="entity-list__count">{projects.length}</span>
      </header>

      <div className="entity-list__table-wrapper">
        <table role="table"
          className={"entity-list__table " + "entity-list__table--projects"}
        >
          <thead>
            <tr role="row">
              <th role="columnheader" scope="col">Project</th>
              <th role="columnheader" scope="col">Description</th>
              <th role="columnheader" scope="col">Visibility</th>
              <th role="columnheader" scope="col">Access</th>
              <th role="columnheader" scope="col">Tasks</th>
              <th role="columnheader" scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => {
              const isDeleting = deletingProjectId === project.id;

              const canEdit = project.permissions.includes(
                PROJECT_PERMISSIONS.UPDATE_PROJECT,
              );

              const canDelete = project.permissions.includes(
                PROJECT_PERMISSIONS.DELETE_PROJECT,
              );

              return (
                <tr role="row" key={project.id}>
                  <td role="cell" className="entity-list__primary"><span className="mobile-cell-label" aria-hidden="true">Project</span>
                    <span className="project-key">{project.projectKey}</span>

                    <strong>{project.name}</strong>
                  </td>

                  <td role="cell" className="entity-list__description"><span className="mobile-cell-label" aria-hidden="true">Description</span>
                    {project.description || "No description provided."}
                  </td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Visibility</span>
                    <span
                      className={
                        "entity-badge " +
                        `entity-badge--` +
                        `${project.visibility}`
                      }
                    >
                      {project.visibility}
                    </span>
                  </td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Access</span>
                    <div className="entity-list__access">
                      <span className="entity-badge">
                        {project.currentUserRole ?? "None"}
                      </span>

                      {!project.isMember && (
                        <span className={"entity-list__access-note"}>
                          Open Workspace access
                        </span>
                      )}
                    </div>
                  </td>

                  <td role="cell" className="entity-list__number"><span className="mobile-cell-label" aria-hidden="true">Tasks</span>{project.taskCount}</td>

                  <td role="cell"><span className="mobile-cell-label" aria-hidden="true">Actions</span>
                    <div className="entity-list__actions">
                      {canEdit && (
                        <button
                          type="button"
                          className={"button " + "button--secondary"}
                          onClick={() => onEdit(project)}
                          aria-label={`Edit ${project.name}`}
                          disabled={isDeleting}
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className={"button " + "button--danger"}
                          onClick={() => onDelete(project)}
                          aria-label={`Delete ${project.name}`}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      )}

                      <Link
                        to={
                          `/workspaces/` +
                          `${project.workspaceId}` +
                          `/projects/${project.id}`
                        }
                        className={
                          "button button--primary " + "entity-list__open-link"
                        }
                        aria-label={`Open ${project.name}`}
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

export default ProjectList;
