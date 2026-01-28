import { Leva } from 'leva';

import React, { useState } from 'react';

import { a, useSpring, useTransition } from '@react-spring/web';

import isLocalHost from '../../../utils/appUtils';
import ExternalLinks from './ExternalLinks';
import './Overlay.css';
import LevaTheme from './levaTheme';

function Overlay() {
  const date = new Date();
  const dateString = `${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`;

  const local = isLocalHost();
  const [showLeva, setShowLeva] = useState(!!local);

  const handleDebug = () => {
    setShowLeva((s) => !s);
  };

  const version = __APP_VERSION__;

  /* ---------------- parent resize spring ---------------- */

  const containerSpring = useSpring({
    opacity: showLeva ? 1 : 0,
    maxHeight: showLeva ? 600 : 0, // large enough to fit Leva
    config: { tension: 170, friction: 26 }, // slower + softer
  });

  /* ---------------- leva enter/exit ---------------- */

  const levaTransition = useTransition(showLeva, {
    from: { opacity: 0, y: -12, scale: 0.97 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -12, scale: 0.97 },
    config: { tension: 170, friction: 26 }, // match parent
  });

  /* ---------------- render ---------------- */

  return (
    <div className="overlay">
      <div className="top-right overlay-panel">
        {/* always visible */}
        <div className="version-tag">v. {version}</div>

        {/* animated resizing wrapper */}
        <a.div
          style={{
            overflow: 'hidden',
            opacity: containerSpring.opacity,
            maxHeight: containerSpring.maxHeight,
          }}
        >
          {levaTransition((style, item) =>
            item ? (
              <a.div
                style={{
                  opacity: style.opacity,
                  transform: style.y.to(
                    (y) =>
                      `translate3d(0, ${y}px, 0) scale(${style.scale.get()})`
                  ),
                  transformOrigin: 'top right',
                }}
              >
                <Leva
                  collapsed={!local}
                  hidden={false}
                  oneLineLabels
                  theme={LevaTheme}
                  fill
                  titleBar={{ title: '💣🔥💥', filter: true, drag: false }}
                />
              </a.div>
            ) : null
          )}
        </a.div>
      </div>

      <div className="top-left overlay-panel">
        <span className="debug" onClick={handleDebug}>
          🔥{' '}
        </span>
        — 💀
      </div>

      <div className="bottom-left overlay-panel">
        Brett McGillis <ExternalLinks />
      </div>

      <div className="bottom-right overlay-panel">{dateString}</div>
    </div>
  );
}

export default Overlay;
