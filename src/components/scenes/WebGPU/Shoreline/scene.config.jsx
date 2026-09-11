import React, { lazy } from 'react';

function BreakingWaveIcon({ color = 'currentColor', size = 24, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* The face of the swell as it stands up */}
      <path d="M2 15c4-9 11-11 15-5" />
      {/* Foam spilling off the crest */}
      <path d="M17 10c2 0 3 1.4 3 3s-1.6 3-3.4 2.4" />
      {/* Rock shelf */}
      <path d="M2 20h20" />
      <path d="M7 20l2.5-3 2 2 2.5-4 2 5" />
    </svg>
  );
}

function SceneIcon() {
  return <BreakingWaveIcon color="#0b3a4a" size={24} />;
}

export default {
  id: 'shoreline',
  label: 'Shoreline',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Shoreline')),
};
