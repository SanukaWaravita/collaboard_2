import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { getToken } from "./services/api";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectPage from "./pages/ProjectPage";

function App() {
  const location = useLocation();
  const isAuthenticated = Boolean(getToken());

  const shouldShowNavbar =
    location.pathname.startsWith("/workspaces") &&
    isAuthenticated;

  return (
    <>
      {shouldShowNavbar && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? "/workspaces"
                  : "/login"
              }
              replace
            />
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/workspaces"
            element={<WorkspacesPage />}
          />

          <Route
            path="/workspaces/:workspaceId/projects"
            element={<ProjectsPage />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId"
            element={<ProjectPage />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? "/workspaces"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;