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
import BoardsPage from "./pages/BoardsPage";
import BoardPage from "./pages/BoardPage";

function App() {
  const location = useLocation();

  const shouldShowNavbar =
    location.pathname.startsWith("/boards") &&
    Boolean(getToken());

  return (
    <>
      {shouldShowNavbar && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={getToken() ? "/boards" : "/login"}
              replace
            />
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/boards" element={<BoardsPage />} />
          <Route
            path="/boards/:boardId"
            element={<BoardPage />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}

export default App;