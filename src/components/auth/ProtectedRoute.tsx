
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

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
    return <Navigate to="/login" />;
  }

  // If user is authenticated, render the child routes
  return <Outlet />;
};
