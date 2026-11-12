import React from 'react';

import { SQ, SQUARES_H, SQUARES_V } from '@utils/argylePattern';

export const INK = {
  red: '#E5202A',
  redDeep: '#A8121A',
  black: '#0A0A0A',
  blue: '#3aa6ff',
  paper: '#ffffff',
};

export const CX = 128;
export const CY = 128;
export const FRAME = 256;
export { SQ, SQUARES_H, SQUARES_V };

export const OrientationContext = React.createContext('h');

export function OrientationProvider({ orientation = 'h', children }) {
  return (
    <OrientationContext.Provider value={orientation}>
      {children}
    </OrientationContext.Provider>
  );
}

export function useSquares() {
  const o = React.useContext(OrientationContext);
  return o === 'v' ? SQUARES_V : SQUARES_H;
}

export const roleColor = (layer) => (layer === 'b' ? INK.red : INK.black);

export const ease = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
};

export const phase = (t, dur, offset = 0) => {
  const p = (t / dur + offset) % 1;
  return p < 0 ? p + 1 : p;
};

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Runs a RAF loop outside React — drawFn(ctx, t) is called every frame with
// the paper already laid down. drawFn lives in a ref so the latest closure is
// used without restarting the loop on re-renders.
export function useLoaderCanvas(drawFn) {
  const canvasRef = React.useRef(null);
  const drawRef = React.useRef(drawFn);
  drawRef.current = drawFn;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FRAME * dpr;
    canvas.height = FRAME * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    let raf;
    const start = performance.now();
    const tick = (now) => {
      ctx.fillStyle = INK.paper;
      ctx.fillRect(0, 0, FRAME, FRAME);
      drawRef.current(ctx, (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return canvasRef;
}

export function CanvasFrame({ canvasRef }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: INK.paper,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={FRAME}
        height={FRAME}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
