// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((s) => s.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
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
        <h2 className="text-2xl font-semibold mb-2">Forgot Password</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter your email to receive a reset link
        </p>

        <input
          type="email"
          required
          placeholder="Email"
          className="w-full border rounded-lg px-4 py-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {successMessage && (
          <p className="text-green-600 text-sm mt-4">{successMessage}</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </form>
    </div>
  );
}
