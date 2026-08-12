import { Link } from "react-router";

function BoardsPage() {
  return (
    <main className="placeholder-page">
      <h1>My Boards</h1>
      <p>The board-list interface will be added after authentication pages.</p>

      <Link to="/boards/collabboard-development">
        Open CollabBoard Development
      </Link>
    </main>
  );
}

export default BoardsPage;
