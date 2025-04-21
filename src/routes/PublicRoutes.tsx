// src/routes/PublicRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import AuthLayout from '@/components/layouts/AuthLayout';
import Index from '@/pages/Index';
import Onboarding from '@/pages/Onboarding';
import NotFound from '@/pages/NotFound'; // Assuming a generic NotFound for public routes too

export const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Index />, // Or potentially a different public landing page layout
  },
  {
    element: <AuthLayout />, // Routes nested under AuthLayout
    children: [
      { path: '/onboarding', element: <Onboarding /> },
      // Add other public routes like /forgot-password here if needed
    ],
  },
   // Catch-all for public scope, maybe redirect to a simpler NotFound or back to home
   // Or handle the main 404 within the protected routes setup
   // { path: '*', element: <NotFound /> }
];
