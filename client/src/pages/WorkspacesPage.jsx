import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import WorkspaceCard from "../components/WorkspaceCard";
import WorkspaceForm from "../components/WorkspaceForm";
import {
  apiRequest,
  clearSession,
} from "../services/api";

function WorkspacesPage() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingWorkspaceId, setDeletingWorkspaceId] =
    useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadWorkspaces() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiRequest("/workspaces");

        if (!shouldIgnore) {
          setWorkspaces(data.workspaces);
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

    loadWorkspaces();

    return () => {
      shouldIgnore = true;
    };
  }, [navigate, reloadKey]);

  function openCreateForm() {
    setEditingWorkspace(null);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(workspace) {
    setEditingWorkspace(workspace);
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) {
      return;
    }

    setEditingWorkspace(null);
    setFormError("");
    setIsFormOpen(false);
  }

  async function handleSaveWorkspace(workspaceData) {
    setFormError("");
    setIsSaving(true);

    try {
      if (editingWorkspace) {
        const data = await apiRequest(
          `/workspaces/${editingWorkspace.id}`,
          {
            method: "PATCH",
            body: workspaceData,
          },
        );

        setWorkspaces((currentWorkspaces) =>
          currentWorkspaces.map((workspace) =>
            workspace.id === data.workspace.id
              ? data.workspace
              : workspace,
          ),
        );
      } else {
        const data = await apiRequest("/workspaces", {
          method: "POST",
          body: workspaceData,
        });

        setWorkspaces((currentWorkspaces) => [
          ...currentWorkspaces,
          data.workspace,
        ]);
      }

      setEditingWorkspace(null);
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

  async function handleDeleteWorkspace(workspace) {
    const shouldDelete = window.confirm(
      `Delete "${workspace.name}" and all of its projects and tasks?`,
    );

    if (!shouldDelete) {
      return;
    }

    setActionError("");
    setDeletingWorkspaceId(workspace.id);

    try {
      await apiRequest(`/workspaces/${workspace.id}`, {
        method: "DELETE",
      });

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.filter(
          (currentWorkspace) =>
            currentWorkspace.id !== workspace.id,
        ),
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setActionError(requestError.message);
    } finally {
      setDeletingWorkspaceId(null);
    }
  }

  return (
    <main className="boards-page">
      <header className="boards-header">
        <div>
          <p className="board-header__eyebrow">
            Collaboration
          </p>

          <h1>My Workspaces</h1>

          <p>
            Select a workspace to view its projects and
            members.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={openCreateForm}
        >
          Create Workspace
        </button>
      </header>

      {actionError && (
        <p className="board-action-error" role="alert">
          {actionError}
        </p>
      )}

      {isLoading && (
        <p className="page-message" role="status">
          Loading workspaces...
        </p>
      )}

      {!isLoading && loadError && (
        <section className="page-error">
          <p role="alert">{loadError}</p>

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
        </section>
      )}

      {!isLoading &&
        !loadError &&
        workspaces.length === 0 && (
          <section className="empty-state">
            <h2>No workspaces yet</h2>

            <p>
              Create your first workspace to begin
              organizing projects.
            </p>

            <button
              type="button"
              className="button button--primary"
              onClick={openCreateForm}
            >
              Create Your First Workspace
            </button>
          </section>
        )}

      {!isLoading &&
        !loadError &&
        workspaces.length > 0 && (
          <section
            className="boards-grid"
            aria-label="Available workspaces"
          >
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onEdit={openEditForm}
                onDelete={handleDeleteWorkspace}
                isDeleting={
                  deletingWorkspaceId === workspace.id
                }
              />
            ))}
          </section>
        )}

      {isFormOpen && (
        <WorkspaceForm
          key={editingWorkspace?.id ?? "new-workspace"}
          initialWorkspace={editingWorkspace}
          onSubmit={handleSaveWorkspace}
          onCancel={closeForm}
          isSubmitting={isSaving}
          error={formError}
        />
      )}
    </main>
  );
}

export default WorkspacesPage;