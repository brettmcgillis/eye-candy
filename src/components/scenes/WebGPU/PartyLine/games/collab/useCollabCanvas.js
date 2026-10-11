import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

import { inkHex } from '../../utils/palette';
import { QUANT } from '../../utils/quantize';

function createBoard(resolution) {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  const scale = resolution / QUANT;
  const board = { canvas, dirty: true, texture };

  board.reset = () => {
    ctx.clearRect(0, 0, resolution, resolution);
    board.dirty = true;
  };

  board.drawStroke = (points, color, width, erase = false) => {
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    const lineWidth = (width / 1000) * resolution;
    ctx.strokeStyle = inkHex(color);
    ctx.fillStyle = ctx.strokeStyle;
    if (points.length === 2) {
      ctx.beginPath();
      ctx.arc(
        points[0] * scale,
        points[1] * scale,
        lineWidth / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else {
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0] * scale, points[1] * scale);
      for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i] * scale, points[i + 1] * scale);
      }
      ctx.stroke();
    }
    board.dirty = true;
  };

  board.drawOp = (op) => {
    if (op.k === 's') board.drawStroke(op.p, op.c, op.w);
    else if (op.k === 'e') board.drawStroke(op.p, 0, op.w, true);
  };

  return board;
}

export default function useCollabCanvas(resolution) {
  const board = useMemo(() => createBoard(resolution), [resolution]);

  useEffect(() => () => board.texture.dispose(), [board]);

  useFrame(() => {
    if (!board.dirty) return;
    board.dirty = false;
    board.texture.needsUpdate = true;
  });

  return board;
}
