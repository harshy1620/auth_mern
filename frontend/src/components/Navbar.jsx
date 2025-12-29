import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/authSlice";

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-indigo-600">
          AuthMERN
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-indigo-500 transition">
            Home
          </Link>

          {!isAuthenticated && (
            <>
              <Link to="/login" className="hover:text-indigo-500">
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:opacity-90 transition"
              >
                Sign up
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="hover:text-indigo-500">
                Dashboard
              </Link>

              {user?.role === "admin" && (
                <Link to="/admin/dashboard" className="hover:text-indigo-500">
                  Admin
                </Link>
              )}

              <button
                onClick={() => dispatch(logoutUser())}
                className="text-red-500 hover:underline"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
