import React, { lazy } from 'react';

function StreamIcon({ color = 'currentColor', size = 24, ...props }) {
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
      {/* The two banks, converging as the reach runs away downstream */}
      <path d="M4 3c1.5 6 2.5 12 3.5 18" />
      <path d="M20 3c-1.5 6-2.5 12-3.5 18" />
      {/* The thalweg, swinging between them */}
      <path d="M13 3c-2 5 1 8-1 12s-0.5 4-0.5 6" />
      {/* A boulder splitting the flow */}
      <circle cx="14.5" cy="14" r="1.6" />
    </svg>
  );
}

function SceneIcon() {
  return <StreamIcon color="#1d4c3f" size={24} />;
}

export default {
  id: 'upstreamDownstream',
  label: 'Upstream/Downstream',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./UpstreamDownstream')),
};
