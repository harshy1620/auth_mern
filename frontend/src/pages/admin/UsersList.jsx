import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    api.get("/users/all").then((res) => {
      setUsers(res.data.users);
    });
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoadingId(userId);

      await api.patch(`/users/role/${userId}`, {
        role: newRole,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      alert("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Users
      </h1>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-4">{u.email}</td>

                <td className="p-4">
                  <select
                    value={u.role}
                    disabled={loadingId === u._id}
                    onChange={(e) =>
                      handleRoleChange(u._id, e.target.value)
                    }
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
