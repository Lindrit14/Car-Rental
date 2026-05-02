import { useEffect, useMemo, useState } from "react";
import { getAllUsers, promoteUser } from "../../api/users";
import type { User } from "../../types";

const roleStyles: Record<string, string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 text-gray-700",
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);

  function loadUsers() {
    setListLoading(true);
    getAllUsers()
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load users"),
      )
      .finally(() => setListLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function handlePromote(user: User) {
    const confirmed = window.confirm(
      `Promote ${user.firstName} ${user.lastName} (${user.email}) to admin?`,
    );
    if (!confirmed) return;

    setPromotingId(user.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await promoteUser(user.id);
      setUsers((current) =>
        current.map((u) => (u.id === updated.id ? updated : u)),
      );
      setSuccess(`${updated.email} is now an ${updated.role}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setPromotingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Users</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded">{success}</p>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-3">
          <h2 className="text-lg font-semibold flex-1">All Users</h2>
          <input
            type="text"
            placeholder="Search by name, email, or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 md:max-w-sm border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {listLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            {users.length === 0 ? "No users found." : "No users match your search."}
          </p>
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isAdmin = u.role === "ADMIN";
                  const isPromoting = promotingId === u.id;
                  return (
                    <tr key={u.id} className="border-t border-gray-100">
                      <td className="px-4 py-2">
                        <p className="font-medium">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="font-mono text-xs text-gray-400">
                          {u.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-4 py-2 break-all">{u.email}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            roleStyles[u.role] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isAdmin ? (
                          <span className="text-xs text-gray-400">Already admin</span>
                        ) : (
                          <button
                            onClick={() => handlePromote(u)}
                            disabled={isPromoting}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-xs font-medium"
                          >
                            {isPromoting ? "Promoting..." : "Promote to Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
