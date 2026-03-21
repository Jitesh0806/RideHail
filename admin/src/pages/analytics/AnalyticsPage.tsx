import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { adminApi } from '../../services/api';
import { Analytics } from '../../types';
import { format, subDays } from 'date-fns';

const COLORS = ['#6C63FF', '#34C759', '#FF6B35', '#FF3B30', '#FFD700'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const start = subDays(new Date(), days).toISOString();
    const end = new Date().toISOString();
    adminApi.getAnalytics(start, end)
      .then(({ data }) => setAnalytics(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  const peakHoursData = analytics
    ? Object.entries(analytics.peakHours)
        .map(([hour, count]) => ({ hour: `${hour}:00`, rides: count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    : [];

  const rideStatusData = analytics
    ? [
        { name: 'Completed', value: analytics.completedRides },
        { name: 'Cancelled', value: analytics.cancelledRides },
        { name: 'Other', value: analytics.totalRides - analytics.completedRides - analytics.cancelledRides },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Platform performance insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Rides', value: analytics?.totalRides || 0, color: 'text-violet-600' },
          { label: 'Completion Rate', value: `${analytics?.completionRate?.toFixed(1) || 0}%`, color: 'text-green-600' },
          { label: 'Total Revenue', value: `$${analytics?.totalRevenue?.toFixed(0) || 0}`, color: 'text-blue-600' },
          { label: 'Avg Fare', value: `$${analytics?.averageFare?.toFixed(2) || 0}`, color: 'text-orange-500' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakHoursData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="rides" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ride Status Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Ride Status Breakdown</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={rideStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {rideStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-violet-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">${analytics?.totalRevenue?.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">Gross Revenue</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">${analytics?.platformRevenue?.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">Platform Revenue (20%)</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                ${((analytics?.totalRevenue || 0) - (analytics?.platformRevenue || 0)).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Driver Payouts (80%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
