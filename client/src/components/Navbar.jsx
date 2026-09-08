import { NavLink, useLocation, useNavigate } from "react-router";
import Icon from "./Icon";
import { clearSession, getCurrentUser } from "../services/api";

function Navbar() {
  const location = useLocation();
  const user = getCurrentUser();
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
    <nav className="app-navbar" aria-label="Main navigation">
      <NavLink to="/workspaces" className="app-navbar__brand">
        <span className="app-navbar__mark"><Icon name="layers" /></span>
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
          <Icon name="grid" />
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
          <Icon name="inbox" />
          Invitations
        </NavLink>

      </div>

      <div className="app-navbar__account">
        <span className="app-navbar__avatar" aria-hidden="true">{(user?.name ?? "U").slice(0, 1).toUpperCase()}</span>
        <span className="app-navbar__user"><strong>{user?.name ?? "Your account"}</strong><small>{user?.email ?? ""}</small></span>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleLogout}
        >
          <Icon name="logout" />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
