import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const authed = useAuthStore((s) => s.isAuthenticated());
  if (!authed) return <Navigate to="/login" replace />;
  if (!user?.is_superuser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
