import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute() {
  const { isAuthenticated, authChecked } = useSelector(
    (state) => state.auth
  );

  if (!authChecked) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}
