// src/routes/ProtectedRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import Dashboard from '@/pages/Dashboard';
import VehiclesList from '@/pages/VehiclesList';
import VehicleDetails from '@/pages/VehicleDetails';
import AddVehicle from '@/pages/AddVehicle';
import BookingsList from '@/pages/BookingsList';
import BookingDetails from '@/pages/BookingDetails';
import NewBooking from '@/pages/NewBooking';
import Diagnostic from '@/pages/Diagnostic';
import GarageLocations from '@/pages/GarageLocations';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound'; // Main 404 page

// TODO: Add logic here or in AppLayout to check auth status
// const isAuthenticated = checkAuthStatus(); // Replace with actual auth check

export const protectedRoutes: RouteObject[] = [
  {
    element: <AppLayout />, // Authenticated routes use AppLayout
    // TODO: Add a loader or wrapper component here to handle authentication check
    // loader: async () => { /* Check auth, redirect if needed */ },
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/vehicles', element: <VehiclesList /> },
      { path: '/vehicles/add', element: <AddVehicle /> },
      { path: '/vehicles/:id', element: <VehicleDetails /> },
      { path: '/bookings', element: <BookingsList /> },
      { path: '/bookings/new', element: <NewBooking /> },
      { path: '/bookings/:id', element: <BookingDetails /> },
      { path: '/diagnostic', element: <Diagnostic /> },
      { path: '/garages', element: <GarageLocations /> },
      { path: '/profile', element: <Profile /> },
      // TODO: Add Admin specific routes here later, possibly under a nested path like /admin
      // { path: '/admin', element: <AdminDashboard /> }

      // Catch-all 404 for authenticated routes
      { path: '*', element: <NotFound /> },
    ],
  },
];
