import { useState } from "react";
import BoardCard from "../components/BoardCard";
import CreateBoardForm from "../components/CreateBoardForm";

const initialBoards = [
  {
    id: "collabboard-development",
    name: "CollabBoard Development",
    description: "Plan and monitor the development of the group project.",
    taskCount: 5,
  },
  {
    id: "m1-planning",
    name: "Milestone 1 Planning",
    description: "Track the interface, documentation, and repository setup.",
    taskCount: 3,
  },
];

function BoardsPage() {
  const [boards, setBoards] = useState(initialBoards);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  function handleCreateBoard(boardData) {
    const newBoard = {
      id: Date.now(),
      ...boardData,
      taskCount: 0,
    };

    setBoards((currentBoards) => [...currentBoards, newBoard]);
    setIsCreateFormOpen(false);
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
          onClick={() => setIsCreateFormOpen(true)}
        >
          Create Board
        </button>
      </header>

      <section className="boards-grid" aria-label="Available boards">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </section>

      {isCreateFormOpen && (
        <CreateBoardForm
          onSubmit={handleCreateBoard}
          onCancel={() => setIsCreateFormOpen(false)}
        />
      )}
    </main>
  );
}

export default BoardsPage;