import {
  PI,
  abs,
  clamp,
  float,
  floor,
  fract,
  fwidth,
  max,
  min,
  mix,
  select,
  sin,
  smoothstep,
  tanh,
  uv,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const EPS = 1e-5;
// A field clamped flat sits exactly on a level; it has no contour to draw.
const FLAT = 1e-4;

// The reference's band edge, as it draws it: tanh of the distance to the
// nearest level in px, from |sin(π·s)| over its own screen derivative.
const levelLine = (s, widthPx) => {
  const v = sin(s.mul(PI));
  const d = abs(v)
    .mul(2)
    .div(max(fwidth(v).mul(widthPx), EPS));
  const drawn = widthPx.greaterThan(0).and(fwidth(s).greaterThan(FLAT));
  return select(drawn, tanh(min(d, 10)), float(1));
};

// The look: the field read per pixel, no fake shading and no trail.
// terraced is Isolines 2's quantised bands with its tanh band edge; lines
// is Isolines 1's smoothstep isoline, coloured by its level.
export default function createFlatMaterial(s, style) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.toneMapped = false;
  const du = uv().x;
  const dv = uv().y;
  const n = s.fieldAt(du, dv);
  const k = n.mul(s.u.levels).sub(s.u.levelOffset);
  const px = s.u.pixelRatio;

  if (style === 'lines') {
    const v = sin(k.mul(PI));
    const width = s.u.lineWidth.mul(px);
    const line = smoothstep(
      1,
      0,
      abs(v).div(max(fwidth(v).mul(width), EPS))
    ).mul(select(fwidth(k).greaterThan(FLAT), float(1), float(0)));
    material.colorNode = mix(s.u.background, s.lineColorAt(n, du, dv), line);
    return material;
  }

  const band = floor(k);
  const here = s.colorAt(band.add(s.u.levelOffset).div(s.u.levels), du, dv);
  const below = s.colorAt(
    band.sub(1).add(s.u.levelOffset).div(s.u.levels),
    du,
    dv
  );
  const edge = clamp(fract(k).div(max(fwidth(k), EPS)), 0, 1);
  const color = mix(below, here, edge);
  material.colorNode = mix(
    s.u.outlineColor,
    color,
    levelLine(k, s.u.outlineWidth.mul(px))
  );
  return material;
}
