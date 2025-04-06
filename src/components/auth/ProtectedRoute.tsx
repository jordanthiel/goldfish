
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute: React.FC<{ requiredRole?: string }> = ({ requiredRole }) => {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  // Determine if the current path is a therapist route
  const isTherapistRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/therapist');
  
  // Determine if the current path is a client route
  const isClientRoute = location.pathname.startsWith('/patient');

  if (loading) {
    // Show loading indicator while checking authentication
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    if (userRole === 'client') {
      return <Navigate to="/patient/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Role-based routing: redirect clients to patient dashboard if trying to access therapist routes
  if (userRole === 'client' && isTherapistRoute) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  // Role-based routing: redirect therapists to therapist dashboard if trying to access client routes
  if (userRole === 'therapist' && isClientRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is authenticated and has the required role (or no specific role required), render the child routes
  return <Outlet />;
};
