import React, { useEffect } from 'react';
import { isRootDomain, buildRootOriginUrl } from '../utils/tenant';
import { SuperAdminRoute } from './SuperAdminRoute';
import { PlatformAdmin } from '../screens/PlatformAdmin';

/** Super Admin UI only on platform root; tenant subdomains redirect to root /platform. */
export const PlatformAdminRedirect: React.FC = () => {
  useEffect(() => {
    if (!isRootDomain()) {
      window.location.replace(buildRootOriginUrl('/platform'));
    }
  }, []);

  if (!isRootDomain()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm font-bold" dir="rtl">
        جاري فتح لوحة المنصة...
      </div>
    );
  }

  return (
    <SuperAdminRoute>
      <PlatformAdmin />
    </SuperAdminRoute>
  );
};
