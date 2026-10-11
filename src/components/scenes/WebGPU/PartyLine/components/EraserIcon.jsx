import React, { memo } from 'react';

const INK = '#1d1d28';

function EraserIcon({ size = 30 }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 32 32" width={size}>
      <g transform="rotate(-32 16 16)">
        <rect
          fill="#e2688a"
          height="12"
          rx="3.5"
          stroke={INK}
          strokeWidth="2.2"
          width="24"
          x="4"
          y="11"
        />
        <rect
          fill="#ff9fb8"
          height="6.5"
          rx="2.5"
          width="20"
          x="5.2"
          y="12.2"
        />
        <rect
          fill="#2f6cf6"
          height="14"
          rx="2"
          stroke={INK}
          strokeWidth="2.2"
          width="10"
          x="17"
          y="10"
        />
        <path
          d="M19 14h6"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </g>
      <circle
        cx="5"
        cy="27"
        fill="#ff9fb8"
        r="1.6"
        stroke={INK}
        strokeWidth="1"
      />
      <circle
        cx="9.5"
        cy="29"
        fill="#ff9fb8"
        r="1.1"
        stroke={INK}
        strokeWidth="0.9"
      />
    </svg>
  );
}

export default memo(EraserIcon);
