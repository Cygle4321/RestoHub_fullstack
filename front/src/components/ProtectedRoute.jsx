import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "./ui";
import { useAuth } from "../context/AuthContext";

/**
 * @param {{ roles?: string[] }} props
 * roles: super_admin | owner | staff
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Chargement de la session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    // Redirect to the right space
    if (user.role === "super_admin") return <Navigate to="/admin" replace />;
    if (user.role === "owner" || user.role === "staff") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
