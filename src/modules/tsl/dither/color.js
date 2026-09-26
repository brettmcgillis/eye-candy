import { abs, clamp, float, max, min, mod, select, vec3 } from 'three/tsl';

// Alex Charlton's rgb2hsl, as the article ported it — including the `l < 0`
// saturation test that is never true, so saturation always takes the
// `2 - (max + min)` branch.
export function rgbToHslValues(r, g, b) {
  const cMin = Math.min(r, g, b);
  const cMax = Math.max(r, g, b);
  const l = (cMax + cMin) / 2;
  if (cMax <= cMin) return [0, 0, l];

  const cDelta = cMax - cMin;
  const s = cDelta / (2 - (cMax + cMin));
  let h;
  if (r === cMax) h = (g - b) / cDelta;
  else if (g === cMax) h = 2 + (b - r) / cDelta;
  else h = 4 + (r - g) / cDelta;
  if (h < 0) h += 6;
  return [h / 6, s, l];
}

export function rgbToHsl(color) {
  const cMin = min(color.r, min(color.g, color.b));
  const cMax = max(color.r, max(color.g, color.b));
  const l = cMax.add(cMin).div(2);
  const cDelta = cMax.sub(cMin);
  const safeDelta = max(cDelta, 1e-6);

  const s = cDelta.div(float(2).sub(cMax.add(cMin)));
  const rawHue = select(
    color.r.equal(cMax),
    color.g.sub(color.b).div(safeDelta),
    select(
      color.g.equal(cMax),
      color.b.sub(color.r).div(safeDelta).add(2),
      color.r.sub(color.g).div(safeDelta).add(4)
    )
  );
  const h = select(rawHue.lessThan(0), rawHue.add(6), rawHue).div(6);

  const chromatic = cMax.greaterThan(cMin);
  return vec3(select(chromatic, h, 0), select(chromatic, s, 0), l);
}

export function hslToRgb(hsl) {
  const rgb = clamp(
    abs(mod(hsl.x.mul(6).add(vec3(0, 4, 2)), 6).sub(3)).sub(1),
    0,
    1
  );
  return rgb
    .sub(0.5)
    .mul(hsl.y)
    .mul(abs(hsl.z.mul(2).sub(1)).oneMinus())
    .add(hsl.z);
}
