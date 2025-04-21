// src/components/layouts/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from '../NavBar'; // Assuming NavBar exists

const AppLayout: React.FC = () => {
  // TODO: Add logic to check authentication status here
  // If not authenticated, redirect to /onboarding

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet /> {/* Renders the specific page component */}
      </main>
      {/* Can add a footer here if needed */}
    </div>
  );
};

export default AppLayout;
