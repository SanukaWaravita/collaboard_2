import { Navigate, Outlet, useLocation } from "react-router";
import { getToken } from "../services/api";

function ProtectedRoute() {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
