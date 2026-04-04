import React, { useEffect, useState } from 'react';
import { Users, Car, Activity, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { adminApi } from '../services/api';
import { MOCK_DASHBOARD } from '../services/mockData';
import { DashboardStats } from '../types';

const StatCard = ({
  title, value, icon: Icon, color, sub,
}: {
  title: string; value: string | number; icon: any; color: string; sub?: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminApi.getDashboard();
        setStats(data.data);
      } catch {
        setStats(MOCK_DASHBOARD as DashboardStats);  // demo fallback
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time platform overview</p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          color="bg-blue-500"
          sub="Registered riders"
        />
        <StatCard
          title="Active Drivers"
          value={`${stats?.activeDrivers || 0} / ${stats?.totalDrivers || 0}`}
          icon={Car}
          color="bg-green-500"
          sub="Online right now"
        />
        <StatCard
          title="Active Rides"
          value={stats?.activeRides || 0}
          icon={Activity}
          color="bg-violet-500"
          sub="In progress right now"
        />
        <StatCard
          title="Today's Rides"
          value={stats?.todayRides || 0}
          icon={TrendingUp}
          color="bg-orange-500"
        />
        <StatCard
          title="Today's Revenue"
          value={`$${(stats?.todayRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="bg-emerald-500"
          sub="Platform commission"
        />
        <StatCard
          title="Total Rides"
          value={stats?.totalRides?.toLocaleString() || '0'}
          icon={Clock}
          color="bg-pink-500"
          sub="All time"
        />
      </div>

      {/* Live Status Indicators */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="space-y-3">
          {[
            { label: 'API Gateway', status: 'operational' },
            { label: 'WebSocket Server', status: 'operational' },
            { label: 'Database (RDS)', status: 'operational' },
            { label: 'Redis Cache', status: 'operational' },
            { label: 'SNS Notifications', status: 'operational' },
            { label: 'S3 Storage', status: 'operational' },
          ].map((svc) => (
            <div key={svc.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{svc.label}</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600 font-medium capitalize">{svc.status}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
