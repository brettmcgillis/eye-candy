import { uniform, uv, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Look every font starts from, whatever its technique — same ink, paper,
// line weight and spacing — so fonts differ by their glyphs, not by setup.
export const LOOK_DEFAULTS = {
  ink: '#f4f1e8',
  lineGap: 1,
  paper: '#14161c',
};

export const STROKE_LOOK_DEFAULTS = {
  ...LOOK_DEFAULTS,
  halo: 0,
  haloWidth: 0.1,
  padding: 0.08,
  reveal: false,
  revealSpeed: 1,
  softness: 0.015,
  stagger: 1234.5,
  thickness: 0.03,
};

export function hash2(x, y) {
  const fractSin = (v) => {
    const s = Math.sin(v) * 43758.5453123;
    return s - Math.floor(s);
  };
  return [fractSin(x * 127.1 + y * 311.7), fractSin(x * 269.5 + y * 183.3)];
}

export function charSeed(char, salt) {
  const code = char.charCodeAt(0);
  return [code * 12.9898 + salt * 3.71, code * 78.233 + salt * 9.13];
}

export function colorUniform(hex) {
  return uniform(new THREE.Color(hex));
}

// Grid cell addressing shared by every technique. The plane's uv spans the
// whole text block; `local` is the position inside one cell with y up.
export function cellCoords(cols, rows) {
  const gx = uv().x.mul(cols);
  const gy = uv().y.oneMinus().mul(rows);
  const col = gx.floor().min(cols.sub(1));
  const row = gy.floor().min(rows.sub(1));
  return {
    cellIndex: row.mul(cols).add(col),
    local: vec2(gx.fract(), gy.fract().oneMinus()),
  };
}
