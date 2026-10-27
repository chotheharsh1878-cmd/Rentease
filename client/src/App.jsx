import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePropertiesPage from './pages/BrowsePropertiesPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import PropertyFormPage from './pages/PropertyFormPage';
import FavoritesPage from './pages/FavoritesPage';
import TenantDashboardPage from './pages/TenantDashboardPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import InquiriesPage from './pages/InquiriesPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AssistantPage from './pages/AssistantPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/properties" element={<BrowsePropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailsPage />} />
          <Route path="/assistant" element={<AssistantPage />} />

          {/* Tenant Protected Routes */}
          <Route path="/tenant-dashboard" element={
            <ProtectedRoute roles={['tenant']}>
              <TenantDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          } />
          <Route path="/my-inquiries" element={
            <ProtectedRoute roles={['tenant']}>
              <InquiriesPage ownerView={false} />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Owner Protected Routes */}
          <Route path="/owner-dashboard" element={
            <ProtectedRoute roles={['owner', 'admin']}>
              <OwnerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/add-property" element={
            <ProtectedRoute roles={['owner', 'admin']}>
              <PropertyFormPage />
            </ProtectedRoute>
          } />
          <Route path="/edit-property/:id" element={
            <ProtectedRoute roles={['owner', 'admin']}>
              <PropertyFormPage />
            </ProtectedRoute>
          } />
          <Route path="/owner-inquiries" element={
            <ProtectedRoute roles={['owner', 'admin']}>
              <InquiriesPage ownerView={true} />
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

