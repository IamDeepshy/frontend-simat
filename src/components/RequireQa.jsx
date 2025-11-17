import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function RequireQa({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setAllowed(false);
        } else {
          const data = await res.json();
          // hanya role 'qa' yang boleh
          setAllowed(data.role === "qa");
        }
      } catch (err) {
        console.error(err);
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    };

    checkRole();
  }, []);

  if (checking) {
    return <div>Checking Auth...</div>;
  }

  // kalau bukan QA → lempar ke /suites
  if (!allowed) {
    return <Navigate to="/suites" replace />;
  }

  return children;
}
