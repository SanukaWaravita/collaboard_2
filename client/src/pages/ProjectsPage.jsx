import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProjectCard from "../components/ProjectCard";
import ProjectForm from "../components/ProjectForm";
import { WORKSPACE_PERMISSIONS } from "../constants/access";
import { apiRequest, clearSession } from "../services/api";

function ProjectsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadWorkspaceProjects() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [workspaceData, projectData] = await Promise.all([
          apiRequest(`/workspaces/${workspaceId}`),
          apiRequest(`/workspaces/${workspaceId}/projects`),
        ]);

        if (!shouldIgnore) {
          setWorkspace(workspaceData.workspace);
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

    loadWorkspaceProjects();

    return () => {
      shouldIgnore = true;
    };
  }, [workspaceId, navigate, reloadKey]);

  const canCreateProject =
    workspace?.permissions.includes(WORKSPACE_PERMISSIONS.CREATE_PROJECT) ??
    false;

  const canManageMembers =
    workspace?.permissions.includes(WORKSPACE_PERMISSIONS.MANAGE_MEMBERS) ??
    false;

  function openCreateForm() {
    setEditingProject(null);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(project) {
    setEditingProject(project);
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) {
      return;
    }

    setEditingProject(null);
    setFormError("");
    setIsFormOpen(false);
  }

  async function handleSaveProject(projectData) {
    setFormError("");
    setIsSaving(true);

    try {
      if (editingProject) {
        const data = await apiRequest(`/projects/${editingProject.id}`, {
          method: "PATCH",
          body: projectData,
        });

        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.id === data.project.id ? data.project : project,
          ),
        );
      } else {
        const data = await apiRequest(`/workspaces/${workspaceId}/projects`, {
          method: "POST",
          body: projectData,
        });

        setProjects((currentProjects) => [...currentProjects, data.project]);

        setWorkspace((currentWorkspace) => ({
          ...currentWorkspace,
          projectCount: currentWorkspace.projectCount + 1,
        }));
      }

      setEditingProject(null);
      setIsFormOpen(false);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setFormError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProject(project) {
    const shouldDelete = window.confirm(
      `Delete "${project.name}" and all of its tasks?`,
    );

    if (!shouldDelete) {
      return;
    }

    setActionError("");
    setDeletingProjectId(project.id);

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: "DELETE",
      });

      setProjects((currentProjects) =>
        currentProjects.filter(
          (currentProject) => currentProject.id !== project.id,
        ),
      );

      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        projectCount: Math.max(0, currentWorkspace.projectCount - 1),
      }));
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
    } finally {
      setDeletingProjectId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="entity-page">
        <p className="page-message" role="status">
          Loading workspace projects...
        </p>
      </main>
    );
  }

  if (loadError || !workspace) {
    return (
      <main className="entity-page">
        <section className="page-error">
          <p role="alert">{loadError || "Workspace not found"}</p>

          <div className="page-error__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Try Again
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate("/workspaces")}
            >
              My Workspaces
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="entity-page">
      <header className="entity-page__header">
        <div className="entity-page__header-content">
          <Link to="/workspaces" className="entity-page__back">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="m11 18-6-6 6-6" />
            </svg>
            My Workspaces
          </Link>

          <p className="entity-page__eyebrow">{workspace.slug}</p>

          <h1>{workspace.name}</h1>

          <div className="entity-page__metadata">
            <span>
              {workspace.projectCount}{" "}
              {workspace.projectCount === 1 ? "project" : "projects"}
            </span>

            <span aria-hidden="true">•</span>

            <span>Your role: {workspace.currentUserRole}</span>
          </div>
        </div>

        <div className="entity-page__actions">
          {canManageMembers && (
            <Link
              to={`/workspaces/${workspaceId}/members`}
              className="button button--secondary"
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
              Members & Access
            </Link>
          )}

          {canCreateProject && (
            <button
              type="button"
              className={
                `button button--primary ` + `entity-page__primary-action`
              }
              onClick={openCreateForm}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Create Project
            </button>
          )}
        </div>
      </header>

      {actionError && (
        <p className="board-action-error" role="alert">
          {actionError}
        </p>
      )}

      {projects.length === 0 ? (
        <section className="empty-state">
          <h2>No projects available</h2>

          <p>
            {canCreateProject
              ? "Create the first project in this workspace."
              : "You currently have access to no projects in this workspace."}
          </p>

          {canCreateProject && (
            <button
              type="button"
              className="button button--primary"
              onClick={openCreateForm}
            >
              Create Your First Project
            </button>
          )}
        </section>
      ) : (
        <section className="entity-grid" aria-label="Available projects">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEditForm}
              onDelete={handleDeleteProject}
              isDeleting={deletingProjectId === project.id}
            />
          ))}
        </section>
      )}

      {isFormOpen && (
        <ProjectForm
          key={editingProject?.id ?? "new-project"}
          initialProject={editingProject}
          onSubmit={handleSaveProject}
          onCancel={closeForm}
          isSubmitting={isSaving}
          error={formError}
        />
      )}
    </main>
  );
}

export default ProjectsPage;
