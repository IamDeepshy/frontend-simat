import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  // state username
  const { user, loading } = useAuth();

  return (
    <div className="flex justify-between items-center bg-white rounded-[20px] shadow-[0_2px_7px_-3px_rgba(0,0,0,0.15)] overflow-hidden">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hello, {loading ? "Loading..." : (user?.username ? user.username.toUpperCase() : "Guest")}!
        </h1>
        <p className="text-gray-500 text-lg mt-1">It's good to see you again.</p>
      </div>

      <img src="/assets/image/header.png" alt="Header Illustration" className="w-[500px] p-2" />
    </div>
  );
}