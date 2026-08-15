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

  const [isBoardFormOpen, setIsBoardFormOpen] =
    useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [isSavingBoard, setIsSavingBoard] =
    useState(false);
  const [boardFormError, setBoardFormError] =
    useState("");

  const [deletingBoardId, setDeletingBoardId] =
    useState(null);
  const [boardActionError, setBoardActionError] =
    useState("");

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
    setEditingBoard(null);
    setBoardFormError("");
    setIsBoardFormOpen(true);
  }

  function openEditForm(board) {
    setEditingBoard(board);
    setBoardFormError("");
    setIsBoardFormOpen(true);
  }

  function closeBoardForm() {
    if (isSavingBoard) {
      return;
    }

    setEditingBoard(null);
    setBoardFormError("");
    setIsBoardFormOpen(false);
  }

  async function handleSaveBoard(boardData) {
    setBoardFormError("");
    setIsSavingBoard(true);

    try {
      if (editingBoard) {
        const data = await apiRequest(
          `/boards/${editingBoard.id}`,
          {
            method: "PATCH",
            body: boardData,
          },
        );

        setBoards((currentBoards) =>
          currentBoards.map((board) =>
            board.id === data.board.id
              ? data.board
              : board,
          ),
        );
      } else {
        const data = await apiRequest("/boards", {
          method: "POST",
          body: boardData,
        });

        setBoards((currentBoards) => [
          ...currentBoards,
          data.board,
        ]);
      }

      setEditingBoard(null);
      setIsBoardFormOpen(false);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setBoardFormError(requestError.message);
    } finally {
      setIsSavingBoard(false);
    }
  }

  async function handleDeleteBoard(board) {
    const shouldDelete = window.confirm(
      `Delete "${board.name}" and all of its tasks?`,
    );

    if (!shouldDelete) {
      return;
    }

    setBoardActionError("");
    setDeletingBoardId(board.id);

    try {
      await apiRequest(`/boards/${board.id}`, {
        method: "DELETE",
      });

      setBoards((currentBoards) =>
        currentBoards.filter(
          (currentBoard) =>
            currentBoard.id !== board.id,
        ),
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setBoardActionError(requestError.message);
    } finally {
      setDeletingBoardId(null);
    }
  }

  return (
    <main className="boards-page">
      <header className="boards-header">
        <div>
          <p className="board-header__eyebrow">
            Workspace
          </p>

          <h1>My Boards</h1>

          <p>
            Select a board or create a new workspace
            for your team.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={openCreateForm}
        >
          Create Board
        </button>
      </header>

      {boardActionError && (
        <p className="board-action-error" role="alert">
          {boardActionError}
        </p>
      )}

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
        boards.length === 0 && (
          <section className="empty-state">
            <h2>No boards yet</h2>

            <p>
              Create your first board to begin
              organizing tasks.
            </p>

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
              <BoardCard
                key={board.id}
                board={board}
                onEdit={openEditForm}
                onDelete={handleDeleteBoard}
                isDeleting={
                  deletingBoardId === board.id
                }
              />
            ))}
          </section>
        )}

      {isBoardFormOpen && (
        <CreateBoardForm
          key={editingBoard?.id ?? "new-board"}
          initialBoard={editingBoard}
          onSubmit={handleSaveBoard}
          onCancel={closeBoardForm}
          isSubmitting={isSavingBoard}
          error={boardFormError}
        />
      )}
    </main>
  );
}

export default BoardsPage;