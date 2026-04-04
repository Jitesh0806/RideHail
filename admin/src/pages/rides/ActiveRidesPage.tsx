import React, { useEffect, useState } from 'react';
import { RefreshCw, XCircle, MapPin } from 'lucide-react';
import { adminApi } from '../../services/api';
import { MOCK_ACTIVE_RIDES } from '../../services/mockData';
import { Ride } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  searching: 'bg-yellow-100 text-yellow-700',
  driver_assigned: 'bg-blue-100 text-blue-700',
  driver_en_route: 'bg-purple-100 text-purple-700',
  driver_arrived: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-green-100 text-green-700',
};

export default function ActiveRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelRideId, setCancelRideId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadRides = async () => {
    try {
      const { data } = await adminApi.getActiveRides();
      setRides(data.data);
    } catch {
      setRides(MOCK_ACTIVE_RIDES as any);  // demo fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
    const interval = setInterval(loadRides, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelRide = async () => {
    if (!cancelRideId || !cancelReason.trim()) return;
    try {
      await adminApi.cancelRide(cancelRideId, cancelReason);
      toast.success('Ride cancelled');
      setCancelRideId(null);
      setCancelReason('');
      loadRides();
    } catch {
      toast.error('Failed to cancel ride');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Rides</h1>
          <p className="text-gray-500 text-sm mt-1">{rides.length} rides in progress</p>
        </div>
        <button
          onClick={loadRides}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-400 text-lg">No active rides right now</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[ride.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ride.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {ride.createdAt ? format(new Date(ride.createdAt), 'HH:mm:ss') : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{ride.id.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => setCancelRideId(ride.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <XCircle size={14} />
                  Force Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Rider</p>
                  <p className="font-medium">{ride.rider?.firstName} {ride.rider?.lastName}</p>
                  <p className="text-gray-500 text-xs">{ride.rider?.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Driver</p>
                  {ride.driver ? (
                    <>
                      <p className="font-medium">{ride.driver.user?.firstName} {ride.driver.user?.lastName}</p>
                      <p className="text-gray-500 text-xs">{ride.driver.vehiclePlate}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">Searching...</p>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="flex items-start gap-1.5 mb-1">
                    <MapPin size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">{ride.pickupAddress}</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">{ride.destinationAddress}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Est. Fare</p>
                  <p className="font-semibold">${ride.estimatedFare?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelRideId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cancel Ride</h3>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCancelRideId(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelRide}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
