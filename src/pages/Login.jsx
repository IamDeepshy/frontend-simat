import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your login logic here
    navigate("/");
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
                  username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="QualityAssurance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                />
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-[#333333] mb-2"
                >
                  password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="qa123456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all pr-12"
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
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