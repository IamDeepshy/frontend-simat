import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function RequireRole({ children, allowed }) {
  const [loading, setLoading] = useState(true);
  const [allowedAccess, setAllowedAccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setAllowedAccess(false);
          return;
        }

        const data = await res.json();
        setAllowedAccess(allowed.includes(data.role));
      } catch {
        setAllowedAccess(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  if (loading) return <div>Checking role...</div>;

  if (!allowedAccess) return <Navigate to="/suites" replace />;

  return children;
}
