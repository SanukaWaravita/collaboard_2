import { Navigate, Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BoardsPage from "./pages/BoardsPage";
import BoardPage from "./pages/BoardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/boards" element={<BoardsPage />} />
      <Route path="/boards/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;