import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/mainLayout";
import Dashboard from "./pages/Dashboard";
import Suites from "./pages/Suites";
import TaskManagement from "./pages/Task-Management";
import DetailSuites from "./pages/Detail-Suites";
import Login from "./pages/Login";

import RequireAuth from "./components/RequireAuth";
import RequireGuest from "./components/RequireGuest";
import RequireRole from "./components/RequireRole";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>

      {/* Halaman terbuka tanpa login */}
      <Route
        path="/login"
        element={
          <RequireGuest>
            <Login />
          </RequireGuest>
        }
      />

      {/* Semua halaman berikut wajib login */}
      <Route element={<RequireAuth />}>
        {/* CATCH ALL — jika page tidak ditemukan */}
        <Route path="*" element={<NotFound />} />
        <Route element={<MainLayout />}>

          {/* Dashboard hanya QA */}
          <Route path="/" 
            element={
              <RequireRole allowed={["qa"]}>
                <Dashboard />
              </RequireRole>
            }
          />

          {/* Suites bisa QA & Developer */}
          <Route path="/suites" element={<Suites />} />

          {/* Task Management → semua role */}
          <Route
            path="/task-management"
            element={<TaskManagement />}
          />

          <Route
            path="/detail-suites"
            element={<DetailSuites />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
