import Sidebar from "../components/Sidebar";
import BarProfile from "../components/BarProfile";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#f9fafb]">
      {/* Sidebar kiri */}
      <Sidebar />

      {/* Area kanan (Navbar + Page Content) */}
      <div className="flex flex-col flex-1">
        <BarProfile />

        <main className="flex-1 mt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
