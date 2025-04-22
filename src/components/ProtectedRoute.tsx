import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  redirectPath = '/auth'
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Check if user has required role (if roles are specified)
  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute;
