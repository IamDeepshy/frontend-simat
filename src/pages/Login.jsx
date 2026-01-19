import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");   
  const [password, setPassword] = useState(""); 
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validasi FE ringan
    if (!username || !password) {
      return Swal.fire({
        icon: "warning",
        title: "Missing required fields",
        html: `
          <p class="text-sm text-gray-500">
            Please enter both <b>username</b> and <b>password</b>.
          </p>
        `,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      /* ===========================
        FAILED LOGIN
      =========================== */
      if (!res.ok) {
        if (res.status === 401) {
          return Swal.fire({
            icon: "error",
            title: "Login failed",
            html: `
              <p class="text-sm text-gray-500">
                Invalid username or password.
              </p>
            `,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }

        return Swal.fire({
          icon: "error",
          title: "Server error",
          html: `
            <p class="text-sm text-gray-500">
              Something went wrong. Please try again later
            </p>
          `,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }


      await refreshUser();

      // ambil data user
      const meRes = await fetch("http://localhost:3000/auth/me", {
        credentials: "include",
      });

      if (!meRes.ok) {
        navigate("/login");
        return;
      }

      const me = await meRes.json();

      // redirect sesuai role
      if (me.role === "qa") {
        navigate("/");
      } else {
        navigate("/suites");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Network error",
        html: `
          <p class="text-sm text-gray-500">
            Unable to connect to the server.<br/>
            Please check your internet connection.
          </p>
        `,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f4f6]">
      <div className="bg-white rounded-3xl shadow-lg p-12 max-w-6xl w-full mx-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* LEFT SIDE - Illustration */}
          <div className="flex justify-center items-center">
            <img 
              src="/assets/image/login.png" 
              alt="Login Illustration" 
              className="w-full max-w-[510px]"
            />
          </div>

          {/* RIGHT SIDE - Form */}
          <div className="space-y-6">
            {/* Logo */}
            <div className="text-center mb-8">
              <img 
                src="/assets/logo/logo-login.svg" 
                alt="SIMAT Logo" 
                className="w-[350px] mx-auto mt-4"
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-semibold text-[#333333] mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Input your username..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                  value={username}                            // <-- tambah
                  onChange={(e) => setUsername(e.target.value)}  // <-- tambah
                />

              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-[#333333] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Input your password..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all pr-12"
                    value={password}                            // <-- tambah
                    onChange={(e) => setPassword(e.target.value)}  // <-- tambah
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                      {showPassword ? (
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

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mt-8"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}