import React, { lazy } from 'react';

function ReactionDiffusionIcon({
  size = 24,
  color = 'currentColor',
  ...props
}) {
  return (
    <svg
      xmlns="http://w3.org"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Outer framing container */}
      <circle cx="12" cy="12" r="10" />

      {/* Internal localized diffusion wavefronts */}
      <path d="M8 7.5a2.5 2.5 0 0 1 3.5 2c.5 2-1 3.5-3 3.5s-3.5 1-3.5 3" />
      <path d="M16 16.5a2.5 2.5 0 0 1-3.5-2c-.5-2 1-3.5 3-3.5s3.5-1 3.5-3" />

      {/* Nucleating chemical center coordinates */}
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

function SceneIcon() {
  return <ReactionDiffusionIcon color="#01024f" size={24} />;
}

export default {
  id: 'petriDish',
  label: 'Petri Dish',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./PetriDish')),
};
