import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMenuStore } from './store/useMenuStore';
import { applyDocumentLanguage } from './utils/locale';
import { CustomerMenuApp } from './screens/CustomerMenuApp';
import { KitchenDashboard } from './screens/KitchenDashboard';
import { LoginPage } from './screens/LoginPage';
import { TenantDashboard } from './screens/TenantDashboard';
import { RootRoute } from './components/RootRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlatformAdminRedirect } from './components/PlatformAdminRedirect';
import { useAuthStore } from './store/useAuthStore';
import { isRootDomain } from './utils/tenant';

const LoginRedirect: React.FC = () => {
  const authed = useAuthStore((s) => s.isAuthenticated());
  if (authed) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
};

/** Platform root: landing + auth. Tenant subdomain: customer menu by default. */
const DomainRoutes: React.FC = () => {
  const onRoot = isRootDomain();

  if (onRoot) {
    return (
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/dashboard" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
        <Route path="/platform" element={<PlatformAdminRedirect />} />
        <Route path="/kitchen" element={<ProtectedRoute><KitchenDashboard /></ProtectedRoute>} />
        {/* Legacy menu links on root domain */}
        <Route path="/r/:slug" element={<CustomerMenuApp />} />
        <Route path="*" element={<RootRoute />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/dashboard" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
      <Route path="/platform" element={<PlatformAdminRedirect />} />
      <Route path="/kitchen" element={<ProtectedRoute><KitchenDashboard /></ProtectedRoute>} />
      <Route path="/" element={<CustomerMenuApp />} />
      <Route path="/r/:slug" element={<CustomerMenuApp />} />
      <Route path="*" element={<CustomerMenuApp />} />
    </Routes>
  );
};

const LanguageBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useMenuStore((s) => s.language);
  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);
  return <>{children}</>;
};

const App: React.FC = () => (
  <BrowserRouter>
    <LanguageBootstrap>
      <DomainRoutes />
    </LanguageBootstrap>
  </BrowserRouter>
);

export default App;
