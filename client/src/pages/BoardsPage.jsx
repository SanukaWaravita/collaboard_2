import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import BoardCard from "../components/BoardCard";
import CreateBoardForm from "../components/CreateBoardForm";
import {
  apiRequest,
  clearSession,
} from "../services/api";

function BoardsPage() {
  const navigate = useNavigate();

  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isCreateFormOpen, setIsCreateFormOpen] =
    useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    let shouldIgnore = false;

    async function loadBoards() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiRequest("/boards");

        if (!shouldIgnore) {
          setBoards(data.boards);
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

    loadBoards();

    return () => {
      shouldIgnore = true;
    };
  }, [navigate, reloadKey]);

  function openCreateForm() {
    setCreateError("");
    setIsCreateFormOpen(true);
  }

  function closeCreateForm() {
    if (isCreating) {
      return;
    }

    setCreateError("");
    setIsCreateFormOpen(false);
  }

  async function handleCreateBoard(boardData) {
    setCreateError("");
    setIsCreating(true);

    try {
      const data = await apiRequest("/boards", {
        method: "POST",
        body: boardData,
      });

      setBoards((currentBoards) => [
        ...currentBoards,
        data.board,
      ]);

      setIsCreateFormOpen(false);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setCreateError(requestError.message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="boards-page">
      <header className="boards-header">
        <div>
          <p className="board-header__eyebrow">Workspace</p>
          <h1>My Boards</h1>
          <p>Select a board or create a new workspace for your team.</p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={openCreateForm}
        >
          Create Board
        </button>
      </header>

      {isLoading && (
        <p className="page-message" role="status">
          Loading boards...
        </p>
      )}

      {!isLoading && loadError && (
        <section className="page-error">
          <p role="alert">{loadError}</p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              setReloadKey((currentKey) => currentKey + 1)
            }
          >
            Try Again
          </button>
        </section>
      )}

      {!isLoading &&
        !loadError &&
        boards.length === 0 && (
          <section className="empty-state">
            <h2>No boards yet</h2>
            <p>Create your first board to begin organizing tasks.</p>

            <button
              type="button"
              className="button button--primary"
              onClick={openCreateForm}
            >
              Create Your First Board
            </button>
          </section>
        )}

      {!isLoading &&
        !loadError &&
        boards.length > 0 && (
          <section
            className="boards-grid"
            aria-label="Available boards"
          >
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </section>
        )}

      {isCreateFormOpen && (
        <CreateBoardForm
          onSubmit={handleCreateBoard}
          onCancel={closeCreateForm}
          isSubmitting={isCreating}
          error={createError}
        />
      )}
    </main>
  );
}

export default BoardsPage;