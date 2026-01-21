import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate(); // redirect halaman
  const location = useLocation(); // cek path
  const { user, logout } = useAuth(); // auth/me ambil dari context

  // role user: "qa" | "developer" | null
  const role = user?.role;

  // Logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `
        <p class="text-sm text-gray-500">
          You will be logged out from your account.
        </p>
      `,        
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: false
    });

    if (!result.isConfirmed) return;

    try {
      await logout();
      
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed", err);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        html: `
          <p class="text-sm text-gray-500">
            Failed to logout. Please try again.
          </p>`
      });
    }
  };

  const menuItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: "/assets/icon/dashboard.svg",
    },
    {
      path: "/suites",
      label: "Suites",
      icon: "/assets/icon/suites.svg",
      activeMatch: ["/suites", "/detail-suites"], // sub route (detail suites)
    },
    {
      path: "/task-management",
      label: "Task Management",
      icon: "/assets/icon/management.svg",
    },
  ];

  const isActive = (item) => {
    // kalau ada activeMatch, cek apakah pathname mengandung salah satu match
    if (item.activeMatch) {
      return item.activeMatch.some((path) => location.pathname.includes(path));
    }
    // selain itu, cocokkan exact path
    return location.pathname === item.path;
  };

  //  Filter menu berdasarkan role
  const visibleMenuItems = menuItems.filter((item) => {
    if (role === "dev" && item.path === "/") {
      // developer TIDAK bisa mengakses Dashboard
      return false;
    }
    // selain dev (qa) boleh lihat semua
    return true;
  });

  return (
    <div className="fixed top-0 left-0 w-[260px] h-[100vh] bg-[#1a1a1a] text-white flex flex-col justify-between p-5">
      {/* Logo Section */}
      <div className="flex flex-col">
        <img
          src="/assets/logo/sidebar.svg"
          alt="SIMAT Logo"
          className="w-[150px] mx-auto mb-6"
        />

        {/* Menu Items */}
        <nav className="flex-grow">
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => (
              <li key={item.path} className="relative">
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive(item)
                      ? "text-white font-medium bg-[#92929223]"
                      : "text-[#9ca3af] hover:text-white hover:bg-[#1f2937]"
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive(item) && (
                    <div className="absolute left-[-20px] top-0 bottom-0 w-[10px] bg-white rounded-r-lg" />
                  )}

                  <img
                    src={item.icon}
                    alt={`${item.label} icon`}
                    className={`w-6 h-6 transition-all ${
                      isActive(item)
                        ? "brightness-125"
                        : "brightness-75 grayscale"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Logout Section */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#ef4444] hover:bg-[#1f2937] rounded-lg transition-all duration-200 font-semibold text-left"
        >
          <img
            src="/assets/icon/logout.svg"
            alt="Logout icon"
            className="w-6 h-6"
          />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
