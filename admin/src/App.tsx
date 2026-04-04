import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ActiveRidesPage from './pages/rides/ActiveRidesPage';
import UsersPage from './pages/users/UsersPage';
import DriversPage from './pages/drivers/DriversPage';
import PendingDriversPage from './pages/drivers/PendingDriversPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="rides/active" element={<ActiveRidesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/pending" element={<PendingDriversPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
