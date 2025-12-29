import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Home() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight animate-fadeIn">
          Secure Auth System with  
          <span className="text-indigo-600"> Role-Based Access</span>
        </h1>

        <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
          A modern MERN authentication system with JWT, refresh tokens,
          protected routes, and admin access.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link
                to="/signup"
                className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:scale-105 transition"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-full hover:bg-indigo-50 transition"
              >
                Login
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="px-8 py-3 bg-indigo-600 text-white rounded-full hover:scale-105 transition"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-8">
        <Feature
          title="JWT Authentication"
          desc="Secure access tokens with refresh token rotation."
        />
        <Feature
          title="Role Based Access"
          desc="Different dashboards for users and admins."
        />
        <Feature
          title="Scalable Architecture"
          desc="Clean Redux Toolkit + protected routing."
        />
      </section>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm">{desc}</p>
    </div>
  );
}
