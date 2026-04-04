import React, { useEffect, useState, useCallback } from 'react';
import { Search, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api';
import { MOCK_USERS } from '../../services/mockData';
import { User } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers(page, 20, search || undefined);
      setUsers(data.data.users);
      setTotal(data.data.total);
    } catch {
      setUsers(MOCK_USERS as User[]);  // demo fallback
      setTotal(MOCK_USERS.length);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSuspend = async (id: string) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await adminApi.suspendUser(id, 'Admin action');
      toast.success('User suspended');
      loadUsers();
    } catch {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminApi.activateUser(id);
      toast.success('User activated');
      loadUsers();
    } catch {
      toast.error('Failed to activate user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total riders</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5">
        <div className="p-4 flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="text-gray-400 hover:text-gray-600 text-xs">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">User</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Phone</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Rides</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Rating</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Joined</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user.phone}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[user.status] || 'bg-gray-100'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user.totalRides}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {user.averageRating > 0 ? `⭐ ${user.averageRating.toFixed(1)}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(user.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <UserX size={12} /> Suspend
                      </button>
                    ) : user.status === 'suspended' ? (
                      <button
                        onClick={() => handleActivate(user.id)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <UserCheck size={12} /> Activate
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
