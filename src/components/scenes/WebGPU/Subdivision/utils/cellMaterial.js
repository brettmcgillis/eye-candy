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
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// The GPU twin of splitProgress in @modules/subdivision/grow.js: a node is on
// screen from grow = depth until its children replace it at depth + 1, and
// over that level its outline band opens and its colour leaves its parent's.
// `halfSize` is the canvas's half-extent, outside of which edge cells are cut
// off the way the SVG's viewBox cuts them. `slide` is grownCell's 'slide':
// the corner pairs are the cell's box and the box it slides out of.
export default function createCellMaterial({ grow, halfSize, slide = false }) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.toneMapped = false;
  material.side = THREE.DoubleSide;

  const span = attribute('aSpan');
  const a = attribute('aCornersA');
  const b = attribute('aCornersB');
  const corner = attribute('corner');
  const g = max(grow, 0);
  const depth = floor(span.x);
  const shown = g.greaterThanEqual(depth).and(g.lessThan(span.y));
  const t = smoothstep(0, 1, clamp(g.sub(depth), 0, 1));
  const box = mix(b, a, t);
  const p = slide
    ? select(
        corner.lessThan(0.5),
        box.xy,
        select(
          corner.lessThan(1.5),
          vec2(box.z, box.y),
          select(corner.lessThan(2.5), box.zw, vec2(box.x, box.w))
        )
      )
    : select(
        corner.lessThan(0.5),
        a.xy,
        select(
          corner.lessThan(1.5),
          a.zw,
          select(corner.lessThan(2.5), b.xy, b.zw)
        )
      );
  const centre = slide ? box.xy.add(box.zw).mul(0.5) : span.zw;
  const inset = attribute('aInset');
  const hole = inset.lessThan(0);
  const band = select(hole, inset.negate().sub(1), inset);
  const open = slide ? select(depth.lessThan(0.5), t, 1) : t;
  const scale = select(
    shown,
    band
      .mul(open)
      .oneMinus()
      .mul(select(hole, t.oneMinus(), 1)),
    0
  );
  const placed = centre.add(p.sub(centre).mul(scale));
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
