import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/mainLayout";
import Dashboard from "./pages/Dashboard";
import Suites from "./pages/Suites";
import TaskManagement from "./pages/Task-Management";
import DetailSuites from "./pages/Detail-Suites";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      {/* Routes dengan Sidebar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/suites" element={<Suites />} />
        <Route path="/task-management" element={<TaskManagement />} />
        <Route path="/detail-suites" element={<DetailSuites />} />
      </Route>

      {/* Route tanpa Sidebar */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}