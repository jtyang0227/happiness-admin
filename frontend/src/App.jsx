import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MemberListPage from './pages/MemberListPage';
import PhotoListPage from './pages/PhotoListPage';
import InquiryListPage from './pages/InquiryListPage';
import SeriesListPage from './pages/SeriesListPage';
import PortfolioListPage from './pages/PortfolioListPage';
import StatsPage from './pages/StatsPage';
import SystemPage from './pages/SystemPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/global.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MemberListPage /></ProtectedRoute>} />
      <Route path="/photos" element={<ProtectedRoute><PhotoListPage /></ProtectedRoute>} />
      <Route path="/inquiries" element={<ProtectedRoute><InquiryListPage /></ProtectedRoute>} />
      <Route path="/portfolios" element={<ProtectedRoute><PortfolioListPage /></ProtectedRoute>} />
      <Route path="/series" element={<ProtectedRoute><SeriesListPage /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      <Route path="/system" element={<ProtectedRoute><SystemPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: '13px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
              error: {
                duration: 5000,
                style: { background: '#1e293b', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
              },
            }}
          />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
