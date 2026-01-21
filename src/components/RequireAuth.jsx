import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();

  // tampilkan loading jika masih cek auth
  if (loading) return <div>Checking session...</div>;
  
  // redirect ke login jika belum login
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
