import React from 'react';
import { FaBomb } from 'react-icons/fa';
import { GiBrightExplosion } from 'react-icons/gi';

import { a, to, useSpring } from '@react-spring/web';

import { Leva } from 'leva';

import { iconFile, localEnv } from '@utils/appUtils';

import LevaTheme from '../levaTheme';

function LevaTitle() {
  return (
    <span style={{ fontSize: 'var(--overlay-icon-size)' }}>
      <FaBomb color="#374151" />
      <img
        src={iconFile('fire-icon.svg')}
        alt="Fire"
        style={{
          width: 'var(--overlay-icon-size)',
          height: 'var(--overlay-icon-size)',
          verticalAlign: 'middle',
        }}
      />
      <GiBrightExplosion color="#fbbf24" />
    </span>
  );
}

export default function LevaPanel({ visible }) {
  const local = localEnv();

  /* ---------------- parent resize spring ---------------- */

  const containerSpring = useSpring({
    opacity: visible ? 1 : 0,
    config: { tension: 170, friction: 26 }, // slower + softer
  });

  /* ---------------- leva enter/exit ---------------- */

  // Keep `<Leva />` mounted even when hidden so Leva does not auto-inject
  // its own default panel/store (which shows up un-themed in production).
  const panelSpring = useSpring({
    opacity: visible ? 1 : 0,
    y: visible ? 0 : -12,
    scale: visible ? 1 : 0.97,
    config: { tension: 170, friction: 26 }, // match parent
  });

  return (
    <a.div
      style={{
        overflow: 'visible',
        opacity: containerSpring.opacity,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <a.div
        style={{
          opacity: panelSpring.opacity,
          transform: to(
            [panelSpring.y, panelSpring.scale],
            (y, scale) => `translate3d(0, ${y}px, 0) scale(${scale})`
          ),
          transformOrigin: 'top right',
        }}
      >
        <Leva
          collapsed={!local}
          hidden={!visible}
          oneLineLabels
          persist={false}
          theme={LevaTheme}
          fill
          titleBar={{ title: <LevaTitle />, filter: true, drag: false }}
        />
      </a.div>
    </a.div>
  );
}
