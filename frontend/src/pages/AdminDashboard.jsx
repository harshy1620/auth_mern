import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard 🛠️
        </h1>
        <p className="text-gray-600 mt-1">
          Manage users and system access
        </p>
      </div>

      {/* Admin Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <AdminCard
          title="Users"
          desc="View and manage all registered users"
          link="/admin/users"
        />

        <AdminCard
          title="Roles"
          desc="Control access and permissions"
        />
      </div>
    </div>
  );
}

function AdminCard({ title, desc, link }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600 text-sm mt-2">
        {desc}
      </p>

      {link && (
        <Link
          to={link}
          className="inline-block mt-4 text-indigo-600 hover:underline text-sm"
        >
          Open →
        </Link>
      )}
    </div>
  );
}
