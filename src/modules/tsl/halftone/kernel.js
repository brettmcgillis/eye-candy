import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  float,
  floor,
  fwidth,
  length,
  max,
  min,
  mix,
  mod,
  screenCoordinate,
  screenSize,
  screenUV,
  select,
  sign,
  smoothstep,
  vec2,
  vec4,
} from 'three/tsl';

import { antialiasedStep, hash, isOn, luma, opaque } from './shared';

// Dots are drawn from every cell within `radius` of this pixel's cell, so a
// dot can grow or move past its own cell wall without clipping.
function forEachNeighbor(radius, pixelSize, visit) {
  Loop(
    { start: -radius, end: radius, condition: '<=', type: 'int', name: 'dy' },
    { start: -radius, end: radius, condition: '<=', type: 'int', name: 'dx' },
    ({ dx, dy }) => {
      const baseCell = floor(screenCoordinate.xy.div(pixelSize));
      visit(baseCell.add(vec2(float(dx), float(dy))));
    }
  );
}

export function buildCellWall(sampleFn, u, { kernelRadius }) {
  return Fn(() => {
    const px = screenCoordinate.xy;
    const finalColor = vec4(0).toVar();
    const maxCircle = float(0).toVar();

    forEachNeighbor(kernelRadius, u.pixelSize, (cellIndex) => {
      const cellCenter = cellIndex.add(0.5).mul(u.pixelSize);
      const texColor = sampleFn(cellCenter.div(screenSize));
      const dist = length(px.sub(cellCenter));
      const radius = u.pixelSize.mul(u.dotSize);
      const circle = antialiasedStep(radius, fwidth(dist), dist).oneMinus();

      If(circle.greaterThan(maxCircle), () => {
        maxCircle.assign(circle);
        finalColor.assign(texColor);
      });
    });

    return opaque(mix(u.paperColor, finalColor.rgb, maxCircle));
  })();
}

function smoothMin(a, b, k) {
  const h = max(k.sub(abs(a.sub(b))), 0).div(k);
  return select(
    k.lessThanEqual(0.001),
    min(a, b),
    min(a, b).sub(h.mul(h).mul(k).mul(0.25))
  );
}

export function buildGooey(sampleFn, u, { kernelRadius }) {
  return Fn(() => {
    const px = screenCoordinate.xy;
    const minDist = float(100).toVar();
    const maxCircle = float(0).toVar();
    const smoothK = u.gooeyness.mul(1.5).mul(u.pixelSize);

    forEachNeighbor(kernelRadius, u.pixelSize, (cellIndex) => {
      const skipped = mod(cellIndex.x.add(cellIndex.y), 2).greaterThan(0.5);
      const cellCenter = cellIndex.add(0.5).mul(u.pixelSize);
      const luminance = luma(sampleFn(cellCenter.div(screenSize)));
      const dist = length(px.sub(cellCenter));
      const radius = luminance
        .oneMinus()
        .mul(u.pixelSize)
        .mul(0.6)
        .add(u.pixelSize.mul(0.05));
      const circle = antialiasedStep(radius, fwidth(dist), dist).oneMinus();

      minDist.assign(
        select(skipped, minDist, smoothMin(minDist, dist.sub(radius), smoothK))
      );
      maxCircle.assign(select(skipped, maxCircle, max(maxCircle, circle)));
    });

    const goo = antialiasedStep(float(0), fwidth(minDist), minDist).oneMinus();
    const shape = select(u.gooeyness.greaterThan(0.01), goo, maxCircle);

    return opaque(mix(u.paperColor, u.inkColor, shape));
  })();
}

// `trail` holds a cursor velocity field (see mouseTrail.js): cells are pushed
// mostly along it and a little to a random side, eased so faint trail barely
// nudges them.
export function buildDisplacedRings(sampleFn, u, { kernelRadius, trail }) {
  return Fn(() => {
    const px = screenCoordinate.xy;
    const maxRing = float(0).toVar();

    forEachNeighbor(kernelRadius, u.pixelSize, (cellIndex) => {
      const rowOffset = select(
        mod(cellIndex.y, 2).equal(0),
        vec2(0),
        vec2(0.5, 0)
      );
      const cellCenter = cellIndex.add(0.5).add(rowOffset).mul(u.pixelSize);
      const cellUV = cellCenter.div(screenSize);

      const brushVel = clamp(trail.sample(cellUV).rg, -0.45, 0.45);
      const brushIntensity = length(brushVel);
      const forwardDir = select(
        brushIntensity.greaterThan(0.001),
        brushVel.div(brushIntensity),
        vec2(0)
      );
      const perpDir = vec2(forwardDir.y.negate(), forwardDir.x);
      const side = sign(hash(cellCenter).sub(0.5));

      const t = smoothstep(0, 0.5, brushIntensity);
      const easedIntensity = mix(t.mul(t).mul(t), t, 0.5);
      const displacement = forwardDir
        .mul(0.75)
        .add(perpDir.mul(side).mul(0.25));
      const center = cellCenter.add(
        displacement.mul(u.mouseStrength).mul(easedIntensity)
      );

      const srcColor = sampleFn(clamp(cellUV, 0, 1));
      const darkness = smoothstep(0, 3, luma(srcColor).oneMinus());

      const dist = length(px.sub(center));
      const aa = fwidth(dist);
      const outerRadius = darkness.mul(u.dotSize).mul(u.pixelSize);
      const innerRadius = max(outerRadius.sub(u.pixelSize.mul(0.25)), 0);
      const ring = antialiasedStep(outerRadius, aa, dist)
        .oneMinus()
        .mul(antialiasedStep(innerRadius, aa, dist));

      maxRing.assign(
        max(maxRing, select(darkness.greaterThan(0.175), ring, float(0)))
      );
    });

    const color = vec4(mix(u.paperColor, u.inkColor, maxRing), 1);
    const debugTrail = select(
      isOn(u.showTrail),
      trail.sample(screenUV),
      vec4(0)
    );
    return color.add(debugTrail);
  })();
}

export const DEFAULT_KERNEL_RADIUS = {
  cellWall: 1,
  gooey: 2,
  displacedRings: 4,
};
