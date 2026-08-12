import { Link } from "react-router";

function BoardCard({ board }) {
  return (
    <article className="board-card">
      <div className="board-card__content">
        <h2>{board.name}</h2>
        <p>{board.description || "No description provided."}</p>
      </div>

      <div className="board-card__footer">
        <span>
          {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"}
        </span>

        <Link
          to={`/boards/${board.id}`}
          className="button button--primary board-card__link"
        >
          Open Board
        </Link>
      </div>
    </article>
  );
}

export default BoardCard;