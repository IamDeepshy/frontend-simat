import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

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
      return item.activeMatch.some(path => location.pathname.includes(path));
    }
    return location.pathname === item.path;
  };

  return (
    <div className="fixed top-0 left-0 w-[260px] h-[95vh] m-3 bg-[#1a1a1a] text-white rounded-[18px] flex flex-col justify-between p-5">
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
            {menuItems.map((item) => (
              <li key={item.path} className="relative">
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive(item)
                      ? "text-white font-semibold bg-[#92929223]"
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
                      isActive(item) ? "brightness-125" : "brightness-75 grayscale"
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
        <Link
          to="/login"
          className="flex items-center gap-3 px-4 py-3 text-[#ef4444] hover:bg-[#1f2937] rounded-lg transition-all duration-200 font-semibold"
        >
          <img 
            src="/assets/icon/logout.svg" 
            alt="Logout icon" 
            className="w-6 h-6"
          />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}