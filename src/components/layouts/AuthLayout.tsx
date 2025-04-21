// src/components/layouts/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Can add specific styling or components for auth pages here */}
      <Outlet /> {/* This renders the nested route component */}
    </div>
  );
};

export default AuthLayout;
