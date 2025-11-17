import React, { useEffect, useState } from "react";

export default function Header() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUsername(data.username);
        }
      } catch (err) {
        console.error("Error fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex justify-between items-center bg-white rounded-[20px] shadow-sm overflow-hidden">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900">Hello, {username ? username.toUpperCase() : "Loading..."}!</h1>
        <p className="text-gray-500 text-lg mt-1">It's good to see you again.</p>
      </div>
      
      <img 
        src="/assets/image/header.png" 
        alt="Header Illustration" 
        className="w-[500px] p-2"
      />
    </div>
  );
}