import {
  float,
  fract,
  ivec2,
  screenCoordinate,
  select,
  smoothstep,
  textureLoad,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { ATLAS_COLS } from './constants';

export const MISS = 1e4;

const signNotZero = (v) =>
  vec2(
    select(v.x.greaterThanEqual(0), float(1), float(-1)),
    select(v.y.greaterThanEqual(0), float(1), float(-1))
  );

export function octEncode(dir) {
  const p = dir.xy.div(dir.x.abs().add(dir.y.abs()).add(dir.z.abs()));
  const folded = float(1).sub(p.yx.abs()).mul(signNotZero(p));
  return select(dir.z.lessThan(0), folded, p);
}

export function octDecode(p) {
  const z = float(1).sub(p.x.abs()).sub(p.y.abs());
  const folded = float(1).sub(p.yx.abs()).mul(signNotZero(p));
  const xy = select(z.lessThan(0), folded, p);
  return vec3(xy, z).normalize();
}

// Nearest positive root of a ray against a sphere, MISS otherwise.
export function sphereHit(origin, dir, centre, radius) {
  const toCentre = origin.sub(centre);
  const along = toCentre.dot(dir);
  const disc = along
    .mul(along)
    .sub(toCentre.dot(toCentre))
    .add(radius.mul(radius));
  const t = along.negate().sub(disc.max(0).sqrt());
  return select(disc.greaterThan(0).and(t.greaterThan(0)), t, float(MISS));
}

// The pass quad's own uv, not screenUV: screenSize is refreshed once a frame,
// so in the offscreen pass it can still hold the other target's size. uv().y
// is up; texture rows run down, hence the flip for reads.
export function passUV() {
  return vec2(uv().x, float(1).sub(uv().y));
}

export function cameraRay(u) {
  const ndc = uv().mul(2).sub(1);
  const view = u.invProjection.mul(vec4(ndc, 1, 1));
  const dir = u.camWorld
    .mul(vec4(view.xyz.div(view.w), 0))
    .xyz.normalize()
    .toVar();
  return { dir, origin: u.camPosition };
}

export function boxRange(u, origin, dir) {
  const inv = vec3(1).div(dir);
  const a = u.airExtent.negate().sub(origin).mul(inv);
  const b = u.airExtent.sub(origin).mul(inv);
  const near = a.min(b);
  const far = a.max(b);
  const t0 = near.x.max(near.y).max(near.z).max(0);
  const t1 = far.x.min(far.y).min(far.z);
  return { t0, t1 };
}

export function projectToScreen(u, point) {
  const clip = u.viewProjection.mul(vec4(point, 1));
  const ndc = clip.xy.div(clip.w.max(1e-4));
  return vec2(ndc.x.mul(0.5).add(0.5), float(0.5).sub(ndc.y.mul(0.5)));
}

// Interleaved gradient noise: a per-pixel stratum offset for the shaft
// samples, so their count shows as grain rather than as bands.
export function pixelJitter() {
  const c = screenCoordinate;
  return fract(
    fract(c.x.mul(0.06711056).add(c.y.mul(0.00583715))).mul(52.9829189)
  );
}

// The flat scene's radial lookup, one dimension up: which texel of light i's
// tile the direction lands in, and whether `point` is past the first
// occluder along it.
export function buildShadowLookup(u, atlas, tileSize) {
  return (point, lightIndex) => {
    const toPoint = point.sub(u.lightData.element(lightIndex).xyz);
    const dist = toPoint.length();
    const oct = octEncode(toPoint.div(dist.max(1e-6)))
      .mul(0.5)
      .add(0.5);
    const local = oct
      .mul(tileSize)
      .floor()
      .clamp(0, tileSize - 1);
    const li = float(lightIndex);
    const tile = vec2(li.mod(ATLAS_COLS), li.div(ATLAS_COLS).floor());
    const texel = ivec2(tile.mul(tileSize).add(local));
    const occluder = textureLoad(atlas, texel).x;

    return float(1).sub(
      smoothstep(occluder, occluder.add(u.softness.max(1e-5)), dist)
    );
  };
}
