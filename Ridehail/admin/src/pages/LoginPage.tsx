import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@ridehail.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminApi.login(email, password);
      const { accessToken, user } = data.data;
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        return;
      }
      localStorage.setItem('accessToken', accessToken);
      navigate('/');
      toast.success('Welcome back!');
    } catch {
      // Demo mode: bypass auth when backend is not running
      localStorage.setItem('accessToken', 'demo-token');
      navigate('/');
      toast.success('Signed in (demo mode — no backend needed)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900">RideHail Admin</h1>
          <p className="text-gray-500 mt-1">Operations Dashboard</p>
        </div>

        {/* Demo notice */}
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-5 text-sm text-violet-700">
          <strong>Demo mode:</strong> credentials are pre-filled. Works without a backend — all pages show sample data.
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="admin@ridehail.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}
