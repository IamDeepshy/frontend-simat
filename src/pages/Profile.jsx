import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return Swal.fire("Error", "Semua field wajib diisi", "error");
        }

        if (newPassword !== confirmPassword) {
            return Swal.fire("Error", "Konfirmasi password tidak cocok", "error");
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:3000/api/change-password", {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword,
            }),
            });

            const data = await res.json();

            // CURRENT PASSWORD SALAH
            if (res.status === 401) {
            return Swal.fire({
                icon: "error",
                title: "Password Salah",
                text: "Password lama yang kamu masukkan tidak benar",
            });
            }

            // VALIDASI LAIN DARI BACKEND
            if (!res.ok) {
            return Swal.fire({
                icon: "error",
                title: "Gagal",
                text: data.message || "Gagal mengubah password",
            });
            }

            // SUCCESS
            await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: data.message,
            confirmButtonText: "Login ulang",
            });

            navigate("/login");
        } catch (err) {
            Swal.fire({
            icon: "error",
            title: "Error",
            text: "Terjadi kesalahan pada server",
            });
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Change Password
        </h1>

        <div className="mb-4">
          <label className="text-sm text-gray-600">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-600">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-600">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
