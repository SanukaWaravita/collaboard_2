import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import {
  apiRequest,
  clearSession,
} from "../services/api";

function WorkspaceGuestsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [guests, setGuests] = useState([]);
  const [
    pendingGuestInvitations,
    setPendingGuestInvitations,
  ] = useState([]);
  const [projects, setProjects] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    async function loadGuests() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [
          workspaceData,
          guestData,
          projectData,
        ] = await Promise.all([
          apiRequest(`/workspaces/${workspaceId}`),
          apiRequest(
            `/workspaces/${workspaceId}/guests`,
          ),
          apiRequest(
            `/workspaces/${workspaceId}/projects`,
          ),
        ]);

        if (!shouldIgnore) {
          setWorkspace(workspaceData.workspace);
          setGuests(guestData.guests);
          setPendingGuestInvitations(
            guestData.pendingGuestInvitations,
          );
          setProjects(projectData.projects);
        }
      } catch (requestError) {
        if (shouldIgnore) {
          return;
        }

        if (requestError.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setLoadError(requestError.message);
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false);
        }
      }
    }

    loadGuests();

    return () => {
      shouldIgnore = true;
    };
  }, [workspaceId, navigate, reloadKey]);

  function getProjectName(projectId) {
    const project = projects.find(
      (currentProject) =>
        currentProject.id === projectId,
    );

    return project
      ? `${project.projectKey} - ${project.name}`
      : projectId;
  }

  if (isLoading) {
    return (
      <main className="access-page">
        <p className="page-message" role="status">
          Loading guest users...
        </p>
      </main>
    );
  }

  if (loadError || !workspace) {
    return (
      <main className="access-page">
        <section className="page-error">
          <p role="alert">
            {loadError || "Workspace not found"}
          </p>

          <div className="page-error__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() =>
                setReloadKey(
                  (currentKey) => currentKey + 1,
                )
              }
            >
              Try Again
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects`,
                )
              }
            >
              Projects
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="access-page">
      <header className="boards-header">
        <div>
          <Link
            to={`/workspaces/${workspaceId}/projects`}
            className="project-header__back"
          >
            ← Back to projects
          </Link>

          <p className="board-header__eyebrow">
            {workspace.slug}
          </p>

          <h1>Guest Users</h1>

          <p>
            Guests can access only projects to which they
            have been explicitly assigned.
          </p>
        </div>
      </header>

      <section className="access-panel">
        <header className="access-panel__header">
          <div>
            <p className="task-form__eyebrow">
              Accepted access
            </p>

            <h2>Current guests</h2>
          </div>
        </header>

        {guests.length === 0 ? (
          <p className="access-empty">
            This workspace currently has no guest users.
          </p>
        ) : (
          <div className="member-list">
            {guests.map((guest) => (
              <article
                key={guest.id}
                className="member-card"
              >
                <div className="member-card__identity">
                  <div className="member-avatar">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{guest.name}</h3>
                    <p>{guest.email}</p>

                    <span className="entity-badge entity-badge--private">
                      Guest
                    </span>
                  </div>
                </div>

                <div className="guest-project-list">
                  <strong>Assigned projects</strong>

                  {guest.projects.length === 0 ? (
                    <p>No assigned projects</p>
                  ) : (
                    guest.projects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/workspaces/${workspaceId}/projects/${project.id}/access`}
                      >
                        {project.projectKey}
                        {" - "}
                        {project.name}
                        {" · "}
                        {project.role}
                      </Link>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="access-panel">
        <header className="access-panel__header">
          <div>
            <p className="task-form__eyebrow">
              Awaiting response
            </p>

            <h2>Pending guest invitations</h2>
          </div>
        </header>

        {pendingGuestInvitations.length === 0 ? (
          <p className="access-empty">
            There are no pending guest invitations.
          </p>
        ) : (
          <div className="invitation-list">
            {pendingGuestInvitations.map(
              (invitation) => (
                <article
                  key={invitation.id}
                  className="invitation-card"
                >
                  <div>
                    <h3>{invitation.email}</h3>

                    <p>
                      {getProjectName(
                        invitation.projectId,
                      )}
                      {" · "}
                      {invitation.role}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default WorkspaceGuestsPage;