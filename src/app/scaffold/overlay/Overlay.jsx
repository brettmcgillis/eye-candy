import { Leva } from 'leva';

import React, { useState } from 'react';

import './Overlay.css';

const levaTheme = {
  colors: {
    elevation1: 'var(--overlay-bg)',
    elevation2: 'var(--overlay-bg-2)',
    elevation3: 'var(--overlay-bg)',
    highlight1: '#000',
    highlight2: '#000',
    highlight3: '#ffffff',
    accent1: '#000',
    accent2: '#000',
    accent3: '#000',
    folderWidgetColor: '#000',
  },
  radii: {
    xs: '6px',
    sm: '10px',
    lg: '2em',
  },
  shadows: {
    level1: 'none',
    // level1: 'var(--overlay-shadow)',
    // level2: 'var(--overlay-shadow)',
  },
  fonts: {
    mono: 'inherit',
    sans: 'inherit',
  },
};

function isLocalHost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function Overlay() {
  const date = new Date();
  const dateString = `${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`;

  const local = isLocalHost();

  const [showLeva, setShowLeva] = useState(!!local);

  const handleDebug = () => {
    setShowLeva(!showLeva);
  };

  return (
    <div className="overlay">
      <div
        className={
          showLeva
            ? 'top-right overlay-panel'
            : 'top-right overlay-panel hidden'
        }
      >
        <Leva
          collapsed={!local}
          hidden={!showLeva}
          oneLineLabels
          theme={levaTheme}
          fill
          titleBar={{ title: '💣🔥💥', filter: true, drag: false }}
        />
      </div>

      <div className="top-left overlay-panel">
        <span className="debug" onClick={handleDebug}>
          🔥{' '}
        </span>
        — 💀
      </div>

      <div className="bottom-left overlay-panel">Brett McGillis</div>

      <div className="bottom-right overlay-panel">{dateString}</div>
    </div>
  );
}

export default Overlay;
