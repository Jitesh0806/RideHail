import React, { useEffect, useState, useCallback } from 'react';
import { Search, Ban } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Driver } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-100 text-green-700',
  offline: 'bg-gray-100 text-gray-600',
  on_ride: 'bg-blue-100 text-blue-700',
  suspended: 'bg-red-100 text-red-700',
};

const VERIFICATION_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      // Using users endpoint filtered for drivers
      const { data } = await adminApi.getUsers(1, 100);
      // This would ideally be a dedicated /admin/drivers endpoint
      setDrivers(data.data.users.filter((u: any) => u.role === 'driver'));
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const handleSuspend = async (driverId: string) => {
    if (!window.confirm('Suspend this driver? They will be taken offline immediately.')) return;
    try {
      await adminApi.suspendDriver(driverId);
      toast.success('Driver suspended');
      loadDrivers();
    } catch {
      toast.error('Failed to suspend driver');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Drivers</h1>
        <p className="text-gray-500 text-sm mt-1">{drivers.length} registered drivers</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Driver</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Verification</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Trips</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Rating</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Joined</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : drivers.map((driver: any) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{driver.firstName} {driver.lastName}</p>
                    <p className="text-xs text-gray-500">{driver.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[driver.driverStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {driver.driverStatus || 'offline'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${VERIFICATION_COLORS[driver.verificationStatus] || 'bg-gray-100'}`}>
                      {driver.verificationStatus || 'pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{driver.totalRides || 0}</td>
                  <td className="px-5 py-4">
                    {driver.averageRating > 0 ? `⭐ ${Number(driver.averageRating).toFixed(1)}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {format(new Date(driver.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    {driver.status !== 'suspended' && (
                      <button
                        onClick={() => handleSuspend(driver.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <Ban size={12} /> Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
