import { Leva } from 'leva';
import React, { useState } from 'react';

import './Overlay.css';

function isLocalHost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function Overlay() {
  const date = new Date();

  const local = isLocalHost();

  const [showLeva, setShowLeva] = useState(!!local);

  const handleDebug = () => {
    setShowLeva(!showLeva);
  };

  return (
    <>
      <Leva
        collapsed={!local}
        hidden={!showLeva}
        titleBar={{
          title: '💣🔥💥',
        }}
      />
      <div className="Overlay">
        <div className="Top-Left">
          <span className="Debug" onClick={handleDebug}>
            🔥&nbsp;
          </span>
          — 💀
        </div>
        <div className="Bottom-Left">Brett McGillis</div>
        <div className="Bottom-Right">
          {`${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`}
        </div>
      </div>
    </>
  );
}

export default Overlay;
