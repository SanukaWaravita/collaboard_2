import { NavLink, useLocation, useNavigate } from "react-router";
import { clearSession } from "../services/api";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentLocation =
    `${location.pathname}` + `${location.search}` + `${location.hash}`;

  const existingReturnTo = new URLSearchParams(location.search).get("returnTo");

  const invitationReturnTo =
    location.pathname === "/invitations"
      ? (existingReturnTo ?? "/workspaces")
      : currentLocation;

  const invitationSearch = new URLSearchParams({
    returnTo: invitationReturnTo,
  }).toString();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <nav className="app-navbar">
      <NavLink to="/workspaces" className="app-navbar__brand">
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

        <NavLink
          to={{
            pathname: "/invitations",
            search: `?${invitationSearch}`,
          }}
          className={({ isActive }) =>
            isActive
              ? "app-navbar__link app-navbar__link--active"
              : "app-navbar__link"
          }
        >
          Invitations
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
