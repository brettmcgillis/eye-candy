// StrudelDoodle.jsx
import useStrudelTrack from 'hooks/useStrudelTrack';
import React, { useState } from 'react';

import { Html } from '@react-three/drei';

const DEFAULT_PATTERN = `
setcps(0.7)

stack(
  sound("bd ~ bd ~").gain(1.1),
  sound("hh*8").gain(0.4),
  sound("arpy:2").slow(2).gain(0.5)
)
`;

export default function StrudelDoodle() {
  const { ready, play, stop, isPlaying } = useStrudelTrack({
    withSamples: true,
  });

  const [code, setCode] = useState(DEFAULT_PATTERN);

  return (
    <Html fullscreen>
      <div className="overlay">
        <div className="center-center">
          <div
            style={{
              width: 'min(92vw, 420px)',
              maxHeight: '80vh',
              background: '#2e2e2e',
              color: '#0f0',
              padding: 14,
              fontFamily: 'monospace',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>🎛 Strudel Test Rig</strong>
              <span style={{ color: ready ? '#0f0' : '#f00' }}>
                {ready ? 'ready' : 'loading'}
              </span>
            </div>

            <div style={{ color: isPlaying ? '#0f0' : '#f00' }}>
              {isPlaying ? '▶ playing' : '■ stopped'}
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={9}
              style={{
                width: '100%',
                background: '#000',
                color: '#0f0',
                border: '1px solid #033',
                padding: 8,
                resize: 'none',
                borderRadius: 6,
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => play(code)}>
                ▶ play
              </button>
              <button type="button" onClick={stop}>
                ■ stop
              </button>
            </div>

            <div style={{ fontSize: 11, opacity: 0.6 }}>
              First interaction must be a user tap (mobile audio unlock)
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
}
