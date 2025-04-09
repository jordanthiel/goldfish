
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute: React.FC<{ requiredRole?: string }> = ({ requiredRole }) => {
  const { user, loading, userRole } = useAuth(); // Use userRole from AuthContext
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

  console.log("ProtectedRoute - Current user role:", userRole);
  console.log("ProtectedRoute - Required role:", requiredRole);
  console.log("ProtectedRoute - Current path:", location.pathname);
  
  // If a specific role is required for this route
  if (requiredRole) {
    console.log(`Route requires role: ${requiredRole}, user has role: ${userRole}`);
    
    // If user doesn't have the required role, redirect to appropriate dashboard
    if (userRole !== requiredRole) {
      if (userRole === 'client') {
        console.log("Redirecting client to patient dashboard");
        return <Navigate to="/patient/dashboard" replace />;
      } else if (userRole === 'therapist') {
        console.log("Redirecting therapist to therapist dashboard");
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // For client users trying to access therapist routes
  if (userRole === 'client' && isTherapistRoute) {
    console.log("Client trying to access therapist route - redirecting to patient dashboard");
    return <Navigate to="/patient/dashboard" replace />;
  }

  // For therapist users trying to access client routes
  if (userRole === 'therapist' && isClientRoute) {
    console.log("Therapist trying to access client route - redirecting to therapist dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access to the route
  console.log("Access granted to route");
  return <Outlet />;
};
