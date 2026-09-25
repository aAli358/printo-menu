import React from 'react';

export const AmbientBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
    <div className="absolute inset-0 aurora-bg" />
    <div className="orb orb-1" />
    <div className="orb orb-2" />
    <div className="absolute inset-0 grain-overlay opacity-50" />
  </div>
);
