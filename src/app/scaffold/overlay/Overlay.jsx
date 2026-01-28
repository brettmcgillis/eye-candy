import { Leva } from 'leva';

import React, { useState } from 'react';

import isLocalHost from '../../../utils/appUtils';
import './Overlay.css';
import LevaTheme from './levaTheme';

function Overlay() {
  const date = new Date();
  const dateString = `${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`;

  const local = isLocalHost();

  const [showLeva, setShowLeva] = useState(!!local);

  const handleDebug = () => {
    setShowLeva(!showLeva);
  };
  const version = __APP_VERSION__;

  return (
    <div className="overlay">
      <div className="top-right overlay-panel">
        <div className="version-tag">v. {version}</div>
        <Leva
          collapsed={!local}
          hidden={!showLeva}
          oneLineLabels
          theme={LevaTheme}
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
