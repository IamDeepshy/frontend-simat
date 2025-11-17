import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/mainLayout";
import Dashboard from "./pages/Dashboard";
import Suites from "./pages/Suites";
import TaskManagement from "./pages/Task-Management";
import DetailSuites from "./pages/Detail-Suites";
import Login from "./pages/Login";
import RequireAuth from "./components/RequireAuth";
import RequireQa from "./components/RequireQa";


export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Semua route di bawah ini WAJIB login */}
      <Route element={<RequireAuth />}>

        {/* Semua route di bawah ini pakai MainLayout (sidebar, dll) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={
            <RequireQa>
              <Dashboard/>
            </RequireQa>  
          } /> // Dashboard hanya untuk QA

          {/* Ini bisa untuk semua role */}
          <Route path="/suites" element={<Suites />} />
          <Route path="/task-management" element={<TaskManagement />} />
          <Route path="/detail-suites" element={<DetailSuites />} />
        </Route>

      </Route>

    </Routes>
  );
}
