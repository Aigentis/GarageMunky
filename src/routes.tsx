import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import VehiclesList from './pages/VehiclesList';
import VehicleDetails from './pages/VehicleDetails';
import AddVehicle from './pages/AddVehicle';
import BookingsList from './pages/BookingsList';
import BookingDetails from './pages/BookingDetails';
import NewBooking from './pages/NewBooking';
import Diagnostic from './pages/Diagnostic';
import GarageLocations from './pages/GarageLocations';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

// Unauthorized page
const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <h1 className="text-3xl font-bold mb-4">Unauthorized</h1>
    <p className="text-lg mb-6">You don't have permission to access this page.</p>
    <a href="/dashboard" className="text-blue-600 hover:underline">
      Go to Dashboard
    </a>
  </div>
);

// Auth callback page
const AuthCallback = () => {
  // This page will handle OAuth redirects
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <p className="ml-4">Completing authentication...</p>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/failure" element={<Navigate to="/auth" />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Protected routes for all authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/vehicles" element={<VehiclesList />} />
        <Route path="/vehicles/add" element={<AddVehicle />} />
        <Route path="/vehicles/:id" element={<VehicleDetails />} />
        <Route path="/bookings" element={<BookingsList />} />
        <Route path="/bookings/new" element={<NewBooking />} />
        <Route path="/bookings/:id" element={<BookingDetails />} />
        <Route path="/diagnostic" element={<Diagnostic />} />
        <Route path="/garages" element={<GarageLocations />} />
      </Route>
      
      {/* Protected routes for car owners only */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.CAR_OWNER, UserRole.ADMIN]} />}>
        {/* Car owner specific routes can be added here */}
      </Route>
      
      {/* Protected routes for garage operators only */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.GARAGE_OPERATOR, UserRole.ADMIN]} />}>
        {/* Garage operator specific routes can be added here */}
      </Route>
      
      {/* Protected routes for admins only */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
        {/* Admin specific routes can be added here */}
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
