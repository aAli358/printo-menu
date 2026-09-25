import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authed = useAuthStore((s) => s.isAuthenticated());
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
