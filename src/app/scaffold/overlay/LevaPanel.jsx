import { Leva } from 'leva';

import React from 'react';

import { a, useSpring, useTransition } from '@react-spring/web';

import { isLocalHost } from '../../../utils/appUtils';
import LevaTheme from './levaTheme';

export default function LevaPanel({ visible }) {
  const local = isLocalHost();

  /* ---------------- parent resize spring ---------------- */

  const containerSpring = useSpring({
    opacity: visible ? 1 : 0,
    maxHeight: visible ? 600 : 0, // large enough to fit Leva
    config: { tension: 170, friction: 26 }, // slower + softer
  });

  /* ---------------- leva enter/exit ---------------- */

  const levaTransition = useTransition(visible, {
    from: { opacity: 0, y: -12, scale: 0.97 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -12, scale: 0.97 },
    config: { tension: 170, friction: 26 }, // match parent
  });

  return (
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
                (y) => `translate3d(0, ${y}px, 0) scale(${style.scale.get()})`
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
  );
}
