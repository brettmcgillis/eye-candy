import {
  abs,
  attribute,
  clamp,
  floor,
  max,
  mix,
  select,
  smoothstep,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// The GPU twin of splitProgress in @modules/subdivision/grow.js: a node is on
// screen from grow = depth until its children replace it at depth + 1, and
// over that level its outline band opens and its colour leaves its parent's.
// `halfSize` is the canvas's half-extent, outside of which edge cells are cut
// off the way the SVG's viewBox cuts them.
export default function createCellMaterial({ grow, halfSize }) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.toneMapped = false;
  material.side = THREE.DoubleSide;

  const span = attribute('aSpan');
  const a = attribute('aCornersA');
  const b = attribute('aCornersB');
  const corner = attribute('corner');
  const p = select(
    corner.lessThan(0.5),
    a.xy,
    select(corner.lessThan(1.5), a.zw, select(corner.lessThan(2.5), b.xy, b.zw))
  );
  const g = max(grow, 0);
  const depth = floor(span.x);
  const shown = g.greaterThanEqual(depth).and(g.lessThan(span.y));
  const t = smoothstep(0, 1, clamp(g.sub(depth), 0, 1));
  const scale = select(shown, attribute('aInset').mul(t).oneMinus(), 0);
  const placed = span.zw.add(p.sub(span.zw).mul(scale));
  const worldXY = varying(placed, 'vCellXY');

  material.positionNode = vec3(placed, span.x.mul(0.001));
  material.colorNode = varying(
    mix(attribute('aParentColor'), attribute('aColor'), t),
    'vCellColor'
  );
  material.maskNode = abs(worldXY.x)
    .lessThanEqual(halfSize.x)
    .and(abs(worldXY.y).lessThanEqual(halfSize.y));
  return material;
}
