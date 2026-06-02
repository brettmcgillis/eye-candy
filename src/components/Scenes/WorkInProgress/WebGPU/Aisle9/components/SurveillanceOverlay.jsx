import React, { memo } from 'react';

import { Html } from '@react-three/drei';

const SurveillanceOverlay = memo(function SurveillanceOverlay({ config }) {
  if (!config.surveillanceOverlayEnabled) return null;

  return (
    <Html fullscreen prepend zIndexRange={[1, 0]}>
      <div
        style={{
          boxSizing: 'border-box',
          color: 'rgba(218, 255, 235, 0.86)',
          fontFamily: 'Courier New, monospace',
          fontSize: 'clamp(12px, 1.3vw, 18px)',
          height: '100%',
          inset: 0,
          letterSpacing: 0,
          pointerEvents: 'none',
          position: 'absolute',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.9)',
          width: '100%',
        }}
      >
        <div
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 5px)',
            inset: 0,
            opacity: 0.45,
            position: 'absolute',
          }}
        />
        <div
          style={{
            border: '1px solid rgba(218, 255, 235, 0.36)',
            inset: '9%',
            position: 'absolute',
          }}
        />
        <div style={{ left: '10%', position: 'absolute', top: '8%' }}>
          REC&nbsp;&nbsp;{config.surveillanceCameraLabel || 'CAM 01'}
        </div>
        <div style={{ bottom: '8%', left: '10%', position: 'absolute' }}>
          AISLE 9
        </div>
      </div>
    </Html>
  );
});

export default SurveillanceOverlay;
