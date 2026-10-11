import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  DataTexture,
  NearestFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';

import { PLAYER_COLORS } from '../../utils/palette';
import { applyOp, createGrid } from './ownershipGrid';

function buildPalette() {
  const table = new Uint8Array(256 * 4);
  PLAYER_COLORS.forEach(({ board, hex: pen }, index) => {
    const hex = board ?? pen;
    const channel = (at) => parseInt(hex.slice(at, at + 2), 16);
    table.set([channel(1), channel(3), channel(5), 255], (index + 1) * 4);
  });
  return table;
}

const PALETTE = buildPalette();

function createBoard(size) {
  const pixels = new Uint8Array(size * size * 4);
  const texture = new DataTexture(
    pixels,
    size,
    size,
    RGBAFormat,
    UnsignedByteType
  );
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const board = { changed: true, grid: createGrid(size), size, texture };

  board.reset = () => {
    board.grid.owners.fill(0);
    pixels.fill(0);
    board.grid.dirty = null;
    board.changed = true;
  };

  board.apply = (op) => applyOp(board.grid, op);

  board.paint = () => {
    const { dirty, owners } = board.grid;
    if (!dirty) return false;
    for (let y = dirty.y0; y <= dirty.y1; y += 1) {
      const row = (size - 1 - y) * size;
      for (let x = dirty.x0; x <= dirty.x1; x += 1) {
        const src = owners[y * size + x] * 4;
        const dst = (row + x) * 4;
        pixels[dst] = PALETTE[src];
        pixels[dst + 1] = PALETTE[src + 1];
        pixels[dst + 2] = PALETTE[src + 2];
        pixels[dst + 3] = PALETTE[src + 3];
      }
    }
    board.grid.dirty = null;
    return true;
  };

  return board;
}

export default function useGridBoard(size) {
  const board = useMemo(() => createBoard(size), [size]);

  useEffect(() => () => board.texture.dispose(), [board]);

  useFrame(() => {
    const painted = board.paint();
    if (!painted && !board.changed) return;
    board.changed = false;
    board.texture.needsUpdate = true;
  });

  return board;
}
