// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../store/authSlice";
export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, successMessage } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(resetPassword({ token, password }));
    if (res.meta.requestStatus === "fulfilled") {
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to Login
        </button>
        <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>

        <input
          type="password"
          required
          placeholder="New password"
          className="w-full border rounded-lg px-4 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        {successMessage && (
          <p className="text-green-600 text-sm mt-4">{successMessage}</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </form>
    </div>
  );
}
