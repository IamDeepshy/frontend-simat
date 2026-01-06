import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

 if (loading) {
  return null; // atau skeleton
 }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Logout
  const handleLogout = async () => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You will be logged out from your account.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, logout",
        cancelButtonText: "Cancel",
        reverseButtons: true
      });
  
      if (!result.isConfirmed) return;
  
      try {
        await fetch("http://localhost:3000/auth/logout", {
          method: "POST",
          credentials: "include",
        });
  
        await Swal.fire({
          title: "Logged out!",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
  
        navigate("/login");
      } catch (err) {
        console.error("Logout failed", err);
  
        Swal.fire({
          title: "Error",
          text: "Failed to logout. Please try again.",
          icon: "error",
        });
      }
  };

  return (
    <nav className="fixed top-0 right-0 left-[260px] h-20 bg-white shadow-sm border-b border-gray-200 px-6 pt-4 z-40">
      <div className="flex items-center justify-between">
        <div>
        </div>

        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 capitalize">{user?.username}</span>
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 capitalize">{user?.username}</p>
              </div>
              
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" class="size-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span>Change Password</span>
              </button>
              
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;