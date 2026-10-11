import React, { memo, useLayoutEffect, useRef } from 'react';

import { drawAvatar } from '../utils/avatar';

function Avatar({ className, color, seed, size }) {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAvatar(ctx, { color, seed, size: size * ratio });
  }, [color, seed, size]);

  return (
    <canvas
      aria-hidden="true"
      className={className}
      ref={canvasRef}
      style={{ height: size, width: size }}
    />
  );
}

export default memo(Avatar);
