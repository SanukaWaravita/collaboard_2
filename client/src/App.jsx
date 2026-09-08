import { Navigate, Route, Routes, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { getToken } from "./services/api";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectPage from "./pages/ProjectPage";
import ProjectAccessPage from "./pages/ProjectAccessPage";
import InvitationsPage from "./pages/InvitationsPage";
import WorkspaceMembersPage from "./pages/WorkspaceMembersPage";

function App() {
  const location = useLocation();
  const isAuthenticated = Boolean(getToken());

  const shouldShowNavbar =
    isAuthenticated &&
    (location.pathname.startsWith("/workspaces") ||
      location.pathname.startsWith("/invitations"));

  return (
    <div className={shouldShowNavbar ? "app-shell" : "app-public"}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {shouldShowNavbar && <Navbar />}

      <div className="app-content" id="main-content" tabIndex={-1}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/workspaces" : "/login"} replace />
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/workspaces" element={<WorkspacesPage />} />

          <Route
            path="/workspaces/:workspaceId/projects"
            element={<ProjectsPage />}
          />

          <Route
            path="/workspaces/:workspaceId/members"
            element={<WorkspaceMembersPage />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId"
            element={<ProjectPage />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId/access"
            element={<ProjectAccessPage />}
          />

          <Route path="/invitations" element={<InvitationsPage />} />
        </Route>

        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/workspaces" : "/login"} replace />
          }
        />
      </Routes>
      </div>
    </div>
  );
}

export default App;
