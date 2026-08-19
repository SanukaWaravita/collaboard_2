import { NavLink, useNavigate } from "react-router";
import { clearSession } from "../services/api";

function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <nav className="app-navbar">
      <NavLink
        to="/workspaces"
        className="app-navbar__brand"
      >
        CollaBoard
      </NavLink>

      <div className="app-navbar__actions">
        <NavLink
          to="/workspaces"
          className={({ isActive }) =>
            isActive
              ? "app-navbar__link app-navbar__link--active"
              : "app-navbar__link"
          }
        >
          My Workspaces
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