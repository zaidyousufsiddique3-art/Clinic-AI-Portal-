import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import TestFirebase from './src/TestFirebase';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import LivePage from './pages/dashboard/Live';
import LeadsPage from './pages/dashboard/Leads';
import AutomationsPage from './pages/dashboard/Automations';
import AnalyticsPage from './pages/dashboard/Analytics';
import SettingsPage from './pages/dashboard/Settings';

// Layout component for dashboard routes
const DashboardLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-[#0D1021] flex items-center justify-center text-[#6A00FF]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#0D1021] text-gray-200 font-sans selection:bg-[#6A00FF]/30">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <HeaderBar />
          <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Global decorative gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6A00FF]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#14F1FF]/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/test-firebase" element={<TestFirebase />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/live" replace />} />
            <Route path="live" element={<LivePage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard/live" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
