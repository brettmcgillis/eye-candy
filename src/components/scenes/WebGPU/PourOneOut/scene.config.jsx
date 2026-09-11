import React, { lazy } from 'react';

function SparseGridIcon({ color = 'currentColor', size = 24, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Coarse cell, then the levels that subdivide toward the fluid */}
      <rect x="2" y="2" width="20" height="20" rx="1" />
      <rect x="12" y="12" width="10" height="10" rx="1" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" />
      {/* The pour */}
      <path d="M12 2v6" />
    </svg>
  );
}

function SceneIcon() {
  return <SparseGridIcon color="#0b2540" size={24} />;
}

export default {
  id: 'pourOneOut',
  label: 'Pour One Out',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./PourOneOut')),
};
