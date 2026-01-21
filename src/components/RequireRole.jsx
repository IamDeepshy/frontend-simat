import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ children, allowed }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Checking role...</div>;

  // redirect login jika belum login
  if (!user) return <Navigate to="/login" replace />;

  // jika role user tidak diizinkan maka redirect ke halaman fallback (/suites)
  if (!allowed.includes(user.role)) return <Navigate to="/suites" replace />;

  return children;
}
