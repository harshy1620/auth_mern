import { useSelector } from "react-redux";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Logged in as <span className="font-medium">{user?.email}</span>
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Role"
          value={user?.role.toUpperCase()}
        />
        <StatCard
          title="Authentication"
          value="JWT + Refresh Token"
        />
        <StatCard
          title="Access"
          value="Protected Routes"
        />
      </div>

      {/* Info Section */}
      <div className="mt-12 bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">
          What can you do here?
        </h2>
        <ul className="mt-4 space-y-2 text-gray-600 list-disc list-inside">
          <li>Access protected routes</li>
          <li>Stay logged in securely</li>
          <li>Role-based navigation</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-semibold text-gray-900 mt-1">
        {value}
      </h3>
    </div>
  );
}
