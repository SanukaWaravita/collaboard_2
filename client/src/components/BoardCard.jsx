import { Link } from "react-router";

function BoardCard({
  board,
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  return (
    <article className="board-card">
      <div className="board-card__content">
        <h2>{board.name}</h2>

        <p>
          {board.description || "No description provided."}
        </p>
      </div>

      <div className="board-card__footer">
        <span>
          {board.taskCount}{" "}
          {board.taskCount === 1 ? "task" : "tasks"}
        </span>

        <div className="board-card__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onEdit(board)}
            disabled={isDeleting}
          >
            Edit
          </button>

          <button
            type="button"
            className="button button--danger"
            onClick={() => onDelete(board)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>

          <Link
            to={`/boards/${board.id}`}
            className="button button--primary board-card__link"
            aria-disabled={isDeleting}
            onClick={(event) => {
              if (isDeleting) {
                event.preventDefault();
              }
            }}
          >
            Open Board
          </Link>
        </div>
      </div>
    </article>
  );
}

export default BoardCard;