import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch("http://localhost:3000/auth/me", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();

      setUser({
        id: data.userId,
        username: data.username,
        role: data.role,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};


// ⬇️ PASTIKAN NAMA EXPORT BENAR
export const useAuth = () => useContext(AuthContext);
