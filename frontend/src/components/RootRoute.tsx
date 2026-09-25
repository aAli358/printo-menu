import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from '../screens/LandingPage';

/** Landing page, or redirect legacy ?r=slug links to /r/:slug */
export const RootRoute: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const slug = params.get('r');

  if (slug) {
    params.delete('r');
    const rest = params.toString();
    return <Navigate to={`/r/${slug}${rest ? `?${rest}` : ''}`} replace />;
  }

  return <LandingPage />;
};
