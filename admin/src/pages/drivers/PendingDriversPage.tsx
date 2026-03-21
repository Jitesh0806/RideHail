import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Driver } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PendingDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  const loadDrivers = async () => {
    try {
      const { data } = await adminApi.getPendingDrivers();
      setDrivers(data.data);
    } catch {
      toast.error('Failed to load pending drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrivers(); }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveDriver(id);
      toast.success('Driver approved!');
      loadDrivers();
    } catch {
      toast.error('Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await adminApi.rejectDriver(rejectId, rejectNotes);
      toast.success('Driver rejected');
      setRejectId(null);
      setRejectNotes('');
      loadDrivers();
    } catch {
      toast.error('Rejection failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Driver Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">{drivers.length} drivers awaiting review</p>
        </div>
        <button onClick={loadDrivers} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm">No pending driver approvals</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-bold text-lg">
                    {driver.user?.firstName?.[0]}{driver.user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {driver.user?.firstName} {driver.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{driver.user?.email}</p>
                    <p className="text-sm text-gray-500">{driver.user?.phone}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(driver.createdAt), 'MMM d, yyyy')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-400">Vehicle</p>
                  <p className="text-sm font-medium">{driver.vehicleMake} {driver.vehicleModel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Plate</p>
                  <p className="text-sm font-medium font-mono">{driver.vehiclePlate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Color</p>
                  <p className="text-sm font-medium">{driver.vehicleColor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium capitalize">{driver.vehicleType}</p>
                </div>
              </div>

              {/* Documents */}
              <div className="flex flex-wrap gap-2 mt-3">
                {driver.licenseImageUrl && (
                  <a href={driver.licenseImageUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 border border-violet-200 rounded-lg px-2 py-1">
                    <Eye size={12} /> License
                  </a>
                )}
                {driver.vehicleInsuranceUrl && (
                  <a href={driver.vehicleInsuranceUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 border border-violet-200 rounded-lg px-2 py-1">
                    <Eye size={12} /> Insurance
                  </a>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setRejectId(driver.id)}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <XCircle size={15} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(driver.id)}
                  className="flex items-center gap-1.5 px-6 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  <CheckCircle size={15} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Driver Application</h3>
            <p className="text-sm text-gray-500 mb-3">Provide a reason for rejection (the driver will be notified):</p>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. License documents are unclear, please resubmit..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectId(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNotes.trim()}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
