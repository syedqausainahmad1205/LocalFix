import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import SearchPage from './pages/Search';
import ProviderProfilePage from './pages/ProviderProfile';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerBookings from './pages/customer/CustomerBookings';
import BookingDetails from './pages/customer/BookingDetails';
import CreateRequest from './pages/customer/CreateRequest';
import CustomerRequests from './pages/customer/CustomerRequests';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import AvailableRequests from './pages/provider/AvailableRequests';
import ProviderVerification from './pages/provider/ProviderVerification';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Route guard helpers
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Checking credentials...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/providers/:id" element={<ProviderProfilePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Protected Routes */}
              <Route
                path="/customer/bookings"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/bookings/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'provider', 'admin']}>
                    <BookingDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/requests"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/requests/new"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CreateRequest />
                  </ProtectedRoute>
                }
              />

              {/* Provider Protected Routes */}
              <Route
                path="/provider/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['provider']}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/requests"
                element={
                  <ProtectedRoute allowedRoles={['provider']}>
                    <AvailableRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/verification"
                element={
                  <ProtectedRoute allowedRoles={['provider']}>
                    <ProviderVerification />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}
