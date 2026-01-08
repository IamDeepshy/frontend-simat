import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // role user: "qa" | "developer" | null
  const [role, setRole] = useState(null);

  // Ambil role dari backend
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          // kalau gagal ya sudah, biarkan role tetap null
          console.error("Gagal ambil data user");
          return;
        }

        const data = await res.json();
        setRole(data.role); // contoh: "qa" atau "developer"
      } catch (err) {
        console.error("Error fetch /auth/me", err);
      } 
    };

    fetchMe();
  }, []);

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
        icon: 'error',
        title: 'Error',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true,
        html: `
          <p class="text-sm text-gray-500">
            Failed to logout. Please try again.
          </p>
        `,
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton:
            'bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800',
        },
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
      activeMatch: ["/suites", "/detail-suites"],
    },
    {
      path: "/task-management",
      label: "Task Management",
      icon: "/assets/icon/management.svg",
    },
  ];

  const isActive = (item) => {
    if (item.activeMatch) {
      return item.activeMatch.some((path) => location.pathname.includes(path));
    }
    return location.pathname === item.path;
  };

  //  Filter menu berdasarkan role
  const visibleMenuItems = menuItems.filter((item) => {
    if (role === "dev" && item.path === "/") {
      // developer TIDAK boleh melihat Dashboard
      return false;
    }
    // qa & role lain (atau role belum kebaca) boleh lihat semua
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
