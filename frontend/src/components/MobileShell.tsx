import React from 'react';

/** Mobile-first app frame — world-class phone menu experience */
export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mobile-app-shell">
    <div className="mobile-app-frame">
      {children}
    </div>
  </div>
);
