import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function RequireGuest({ children }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Checking session...</div>;

  if (loggedIn) {
    // Sudah login → larang kembali ke /login
    return <Navigate to="/" replace />;
  }

  return children;
}
