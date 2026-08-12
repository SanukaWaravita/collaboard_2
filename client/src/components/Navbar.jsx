import { NavLink, useNavigate } from "react-router";

function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    // Real token removal will be added with JWT authentication in M2.
    navigate("/login");
  }

  return (
    <nav className="app-navbar">
      <NavLink to="/boards" className="app-navbar__brand">
        CollabBoard
      </NavLink>

      <div className="app-navbar__actions">
        <NavLink
          to="/boards"
          className={({ isActive }) =>
            isActive
              ? "app-navbar__link app-navbar__link--active"
              : "app-navbar__link"
          }
        >
          My Boards
        </NavLink>

        <button
          type="button"
          className="button button--secondary"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
