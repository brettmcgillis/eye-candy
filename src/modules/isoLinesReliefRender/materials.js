import {
  attribute,
  clamp,
  float,
  floor,
  fwidth,
  instanceIndex,
  max,
  min,
  mix,
  normalize,
  positionGeometry,
  pow,
  select,
  smoothstep,
  transformNormalToView,
  uv,
  varying,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const EPS = 1e-5;

// Domain uv (0..1 both ways) of a map-space point.
const domainOf = (s, p) =>
  vec2(p.x.add(s.u.aspect).div(s.u.aspect.mul(2)), p.y.add(1).mul(0.5));

// Lit, with a rise that fades the lighting in: at 0 the colour is all
// emissive, so the flat start of a rise reads like a flat IsoLines piece.
function litMaterial(s, color, normal) {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = color.mul(s.u.rise);
  material.emissiveNode = color.mul(float(1).sub(s.u.rise));
  material.normalNode = normalize(transformNormalToView(normal));
  material.metalnessNode = float(0);
  return material;
}

// One plane per level, stacked: plane k stands at level k's height and
// shows where the field reaches level k, so from above each band is the
// top of its own layer. The edge of a layer is drawn coverage-antialiased
// (alpha to coverage under MSAA) and outlined like the flat bands.
export function createLayerMaterial(s, kMin, roughness) {
  const k = kMin.add(float(instanceIndex));
  const level = s.levelValue(k);
  const z = s.heightOf(level).add(k.mul(1e-4));
  const p = positionGeometry;
  const d = domainOf(s, p);
  const du = varying(d.x);
  const dv = varying(d.y);

  const n = s.fieldAt(du, dv);
  const into = n.mul(s.u.levels).sub(s.u.levelOffset).sub(k);
  const pxs = max(fwidth(into), EPS);
  const base = k.lessThanEqual(kMin);
  const coverage = select(base, float(1), clamp(into.div(pxs).add(0.5), 0, 1));
  const outline = select(
    base.or(s.u.outlineWidth.lessThanEqual(0)),
    float(1),
    smoothstep(0, 1, into.div(pxs).sub(s.u.outlineWidth.mul(s.u.pixelRatio)))
  );
  const color = mix(s.u.outlineColor, s.colorAt(level, du, dv), outline);

  const material = litMaterial(s, color, vec3(0, 0, 1));
  material.positionNode = vec3(p.x, p.y, z);
  material.opacityNode = coverage;
  material.alphaToCoverage = true;
  material.maskNode = coverage.greaterThan(0.001);
  material.maskShadowNode = into.greaterThanEqual(0);
  material.roughnessNode = roughness;
  return material;
}

// The terraces' outer walls: a vertical plane round the domain, shown below
// the height of the band standing at its foot.
// The height, as a share of the field, the piece stands at over field value
// n: its band's floor, plus — on the smooth surface — the band's own rise
// eased by x^p, p = 1 / (1 - sharpness). Sharpness 0 is the field itself;
// higher flattens each band and steepens its rise into the next level.
const surfaceLevel = (s, n, form) => {
  const k = n.mul(s.u.levels).sub(s.u.levelOffset);
  const band = floor(k);
  const rise = pow(k.sub(band), float(1).div(float(1).sub(form.sharpness)));
  return band.add(rise.mul(form.smooth)).add(s.u.levelOffset).div(s.u.levels);
};

// The smooth style: one grid-resolution sheet displaced by the field, its
// normals from the neighbouring samples, coloured in bands and outlined at
// every level like the terraces' edges.
export function createSurfaceMaterial(s, form, roughness) {
  const at = uv();
  const heightAt = (du, dv) =>
    s.heightOf(surfaceLevel(s, s.fieldAt(du, dv), form));
  const ex = float(1).div(s.u.nx);
  const ey = float(1).div(s.u.ny);
  const dzdx = heightAt(at.x.add(ex), at.y)
    .sub(heightAt(at.x.sub(ex), at.y))
    .div(ex.mul(s.u.aspect).mul(4));
  const dzdy = heightAt(at.x, at.y.add(ey))
    .sub(heightAt(at.x, at.y.sub(ey)))
    .div(ey.mul(4));
  const normal = varying(vec3(dzdx.negate(), dzdy.negate(), 1));

  const k = s.fieldAt(at.x, at.y).mul(s.u.levels).sub(s.u.levelOffset);
  const band = floor(k);
  const toLevel = min(k.sub(band), band.add(1).sub(k)).div(max(fwidth(k), EPS));
  const outline = select(
    s.u.outlineWidth.lessThanEqual(0),
    float(1),
    smoothstep(0, 1, toLevel.sub(s.u.outlineWidth.mul(s.u.pixelRatio).mul(0.5)))
  );
  const color = mix(
    s.u.outlineColor,
    s.colorAt(band.add(s.u.levelOffset).div(s.u.levels), at.x, at.y),
    outline
  );

  const material = litMaterial(s, color, normal);
  const p = positionGeometry;
  material.positionNode = vec3(p.x, p.y, heightAt(at.x, at.y));
  material.roughnessNode = roughness;
  return material;
}

export function createSkirtMaterial(s, form, roughness) {
  const p = positionGeometry;
  const d = domainOf(s, p);
  const du = varying(d.x);
  const dv = varying(d.y);
  const z = p.z.mul(s.u.relief);
  const zv = varying(z);
  const n = s.fieldAt(du, dv);
  const band = floor(n.mul(s.u.levels).sub(s.u.levelOffset));
  const level = surfaceLevel(s, n, form);
  const material = litMaterial(
    s,
    s.colorAt(band.add(s.u.levelOffset).div(s.u.levels), du, dv),
    vec3(attribute('aOut', 'vec2'), 0)
  );
  material.positionNode = vec3(p.x, p.y, z);
  material.maskNode = zv.lessThanEqual(s.heightOf(level).add(1e-4));
  material.roughnessNode = roughness;
  material.side = THREE.DoubleSide;
  return material;
}

const segmentAttributes = () => ({
  info: attribute('aInfo', 'vec4'),
  miter: attribute('aMiter', 'vec4'),
  seg: attribute('aSeg', 'vec4'),
});

// A terrace step: a vertical quad along a contour from the band below to
// the band above, facing downhill (the higher ground is on its left).
export function createWallMaterial(s, roughness) {
  const { info, seg } = segmentAttributes();
  const along = positionGeometry.x;
  const up = positionGeometry.z;
  const a = seg.xy;
  const b = seg.zw;
  const p = mix(a, b, along);
  const dir = normalize(b.sub(a).add(vec2(EPS, 0)));
  const z = mix(s.heightOf(info.x), s.heightOf(info.y), up);
  const d = domainOf(s, p);
  const color = s.colorAt(info.z, varying(d.x), varying(d.y));
  const material = litMaterial(s, color, vec3(dir.y, dir.x.negate(), 0));
  material.positionNode = vec3(p, z);
  material.roughnessNode = roughness;
  material.side = THREE.DoubleSide;
  return material;
}

// A contour as a solid wall: a box along each segment, mitred into its
// neighbours, standing at its level (or, in a trail, at its age).
export function createBoxMaterial(s, roughness, { trail = false } = {}) {
  const { info, miter, seg } = segmentAttributes();
  const along = positionGeometry.x;
  const side = positionGeometry.y;
  const up = positionGeometry.z;
  const face = attribute('aFace', 'float');
  const a = seg.xy;
  const b = seg.zw;
  const dir = normalize(b.sub(a).add(vec2(EPS, 0)));
  const left = vec2(dir.y.negate(), dir.x);
  const m = mix(miter.xy, miter.zw, along);

  let base;
  let shown = float(1);
  let fade = float(0);
  if (trail) {
    const age = s.u.time.sub(info.x);
    const t = age.div(max(s.u.trailSpan, EPS));
    shown = select(
      t.greaterThanEqual(-1e-3).and(t.lessThanEqual(1)),
      float(1),
      float(0)
    );
    base = clamp(float(1).sub(t), 0, 1).mul(s.u.relief).mul(s.u.rise);
    fade = clamp(t, 0, 1).mul(s.u.trailFade);
  } else {
    base = s.heightOf(info.x);
  }
  const width = s.u.lineThickness.mul(0.5).mul(shown);
  const p = mix(a, b, along).add(m.mul(side).mul(width));
  const z = base.add(up.mul(s.u.lineHeight).mul(s.u.rise).mul(shown));

  const normal = select(
    face.equal(0),
    vec3(0, 0, 1),
    select(
      face.equal(1),
      vec3(left, 0),
      select(
        face.equal(2),
        vec3(left.negate(), 0),
        select(face.equal(3), vec3(dir.negate(), 0), vec3(dir, 0))
      )
    )
  );
  const d = domainOf(s, mix(a, b, 0.5));
  const color = mix(
    s.lineColorAt(info.z, varying(d.x), varying(d.y)),
    s.u.background,
    varying(fade)
  );
  const material = litMaterial(s, color, normal);
  material.positionNode = vec3(p, z);
  material.roughnessNode = roughness;
  return material;
}

export function createGroundMaterial(color, roughness) {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = color;
  material.roughnessNode = roughness;
  material.metalnessNode = float(0);
  return material;
}
