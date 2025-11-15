import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#f9f4f6]">
      <Sidebar />
      <Outlet />
    </div>
  );
}