import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import api from "./api/axios";
import { setCredentials, setAuthChecked } from "./store/authSlice";


import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import UsersList from "./pages/admin/UsersList";

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, authChecked: checked } = useSelector(
    (state) => state.auth
  );

useEffect(() => {
  const restoreSession = async () => {
    try {
      const res = await api.post("/auth/refresh_token");

      dispatch(
        setCredentials({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );
    } catch (err) {
      // not logged in, ignore
    } finally {
      dispatch(setAuthChecked());
    }
  };

  restoreSession();
}, [dispatch]);


  if (!checked) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking session...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
           <Route path="/admin/users" element={<UsersList />} />
        </Route>
      </Routes>
    </>
  );
}
