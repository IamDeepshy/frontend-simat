import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/apifetch";

export default function EditProfile() {
    const navigate = useNavigate(); // redirect page
    const { user, loading, refreshUser } = useAuth();


    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState(""); 
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [saving, setSaving] = useState(false);

    // isi username dari authcontext
    useEffect(() => {
      if (user?.username) setUsername(user.username);
    }, [user?.username]);

    if (loading) return <div>Checking session...</div>;
    if (!user) return <Navigate to="/login" replace />;

  
    // HANDLE SUBMIT FORM
    const handleSubmit = async (e) => {
      e.preventDefault();

    const usernameChanged = username.trim() !== user.username;
    const passwordChanged = newPassword.trim().length > 0;

    // kalau ga ada perubahan apapun
    if (!usernameChanged && !passwordChanged) {
      return Swal.fire({
        icon: "info",
        title: "No changes detected",
        html: `
          <p class="text-sm text-gray-500">
            There are no changes to save.
          </p>
        `,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }

    // validasi password confirm
    if (passwordChanged && newPassword !== confirmPassword) {
      return Swal.fire({
        icon: "error",
        title: "Password mismatch",
        html: `
          <p class="text-sm text-gray-500">
            Confirmation password doesn't match.
          </p>
        `,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }

      setSaving(true);
      try {
        const res = await apiFetch("/auth/edit-profile", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return Swal.fire({
            icon: "error",
            title: "Action failed",
            html: `
              <p class="text-sm text-gray-500">
                ${data.message || "Something went wrong. Please try again."}
              </p>
            `,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }

        await Swal.fire({
          icon: "success",
          title: "Action completed",
          html: `
            <p class="text-sm text-gray-500">
              ${data.message || "Profile updated."}
            </p>
          `,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        await refreshUser(); // refresh authcontext agar navbar ikut update usn baru

        if (data.message.includes("login")) {
          navigate("/login", { replace: true });
        }
        } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Server error",
          html: `
            <p class="text-sm text-gray-500">
              Something went wrong on the server.<br/>
              Please try again later.
            </p>
          `,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        } finally {
          setSaving(false);
        }
    };


  return (
  <div className="min-h-screen bg-gray-100 p-8 ml-[260px]">
    <div className="max-w-8l">
      <h2 className="text-3xl font-semibold mb-6">Edit Profile</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md"
      >
        {/* Username */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none"
          />
        </div>

        {/* Current Password */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Current Password</label>

          <div className="relative mt-1">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                {showCurrentPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                ) : (
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>


       {/* New Password */}
      <div className="mb-4">
        <label className="text-sm text-gray-600">New Password</label>

        <div className="relative mt-1">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none pr-12"
          />

          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              {showNewPassword ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>


        {/* Confirm Password */}
        <div className="mb-6">
          <label className="text-sm text-gray-600">
            Confirm New Password
          </label>

          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300 focus:outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {/* SVG ASLI — TIDAK DIUBAH */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                {showConfirmPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                ) : (
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>


        {/* Button Confirm */}
        <div className="flex justify-end">
          <button
          type="submit"
          disabled={loading}
          className=" w-full max-w-sm bg-[#1a1a1a] text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        </div>
      </form>
    </div>
  </div>
);

};
