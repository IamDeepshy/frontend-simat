import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireGuest({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Checking session...</div>;

  if (user) {
    // dilarang akses kembali ke /login jika user sudah login
    return <Navigate to="/" replace />;
  }

  return children;
}
