import React from 'react';

import { Html } from '@react-three/drei';

import { imageFile } from '../../utils/appUtils';

export default function NoScene() {
  return (
    <Html style={{ background: '#fff' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={imageFile('reversal.PNG')}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            transform: 'scale(0.5)',
            objectFit: 'contain',
            opacity: 0.2,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        <p
          style={{
            position: 'relative',
            margin: 0,
            zIndex: 1,
          }}
        >
          💀
        </p>
      </div>
    </Html>
  );
}
