import {
  Fn,
  cos,
  dot,
  float,
  floor,
  fract,
  max,
  mix,
  pow,
  saturate,
  sin,
  vec3,
} from 'three/tsl';

// 260421_CatenaryCanopy's "egg iridescence" colour pass, ported from its
// onBeforeCompile GLSL: a thin-film interference tint whose thickness wanders
// with world position, blended toward a bismuth-oxide palette and weighted
// by Fresnel, applied over the base colour before lighting.
const hash13 = Fn(([source]) => {
  const p = fract(source.mul(0.1031)).toVar();
  p.addAssign(dot(p, p.yzx.add(19.19)));
  return fract(p.x.add(p.y).mul(p.z));
}).setLayout({
  name: 'eggHash13',
  type: 'float',
  inputs: [{ name: 'source', type: 'vec3' }],
});

const smoothNoise3 = Fn(([p]) => {
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(f.mul(-2).add(3));
  const corner = (x, y, z) => hash13(i.add(vec3(x, y, z)));
  const x00 = mix(corner(0, 0, 0), corner(1, 0, 0), u.x);
  const x10 = mix(corner(0, 1, 0), corner(1, 1, 0), u.x);
  const x01 = mix(corner(0, 0, 1), corner(1, 0, 1), u.x);
  const x11 = mix(corner(0, 1, 1), corner(1, 1, 1), u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}).setLayout({
  name: 'eggNoise3',
  type: 'float',
  inputs: [{ name: 'p', type: 'vec3' }],
});

const bismuth = Fn(([phase]) => {
  const t = fract(phase);
  const c0 = vec3(1.0, 0.84, 0.2);
  const c1 = vec3(1.0, 0.33, 0.77);
  const c2 = vec3(0.18, 0.93, 1.0);
  const c3 = vec3(0.3, 1.0, 0.46);
  return t
    .lessThan(0.25)
    .select(
      mix(c0, c1, t.mul(4)),
      t
        .lessThan(0.5)
        .select(
          mix(c1, c2, t.sub(0.25).mul(4)),
          t
            .lessThan(0.75)
            .select(
              mix(c2, c3, t.sub(0.5).mul(4)),
              mix(c3, c0, t.sub(0.75).mul(4))
            )
        )
    );
}).setLayout({
  name: 'eggBismuth',
  type: 'vec3',
  inputs: [{ name: 'phase', type: 'float' }],
});

const iridescent = Fn(([base, worldPos, worldNormal, eye, strength, freq]) => {
  const n = worldNormal.normalize();
  const ndv = saturate(dot(n, eye.sub(worldPos).normalize()));
  const jitter = smoothNoise3(worldPos.mul(1.5).add(31.4));
  const broad = smoothNoise3(worldPos.mul(0.48).add(11.7));
  const band = max(float(0.2), freq);
  const facetBand = worldPos.y
    .mul(1.8)
    .add(worldPos.x.mul(0.42))
    .sub(worldPos.z.mul(0.31))
    .mul(band);
  const stepBand = worldPos.x.abs().add(worldPos.z.abs()).mul(0.92);
  const swirl = sin(
    dot(worldPos, vec3(0.73, 0.51, -0.46))
      .mul(band)
      .mul(1.25)
      .add(broad.mul(4.6))
      .add(6.283)
  )
    .mul(0.5)
    .add(0.5);
  const thicknessT = fract(
    facetBand
      .mul(0.123)
      .add(stepBand.mul(0.081))
      .add(swirl.mul(0.39))
      .add(jitter.mul(0.27))
      .add(5.7)
  );
  const thicknessNm = mix(float(120), float(980), thicknessT);
  const phase = vec3(4 * Math.PI * 1.65)
    .mul(thicknessNm)
    .mul(max(ndv, 0.08))
    .div(vec3(680, 540, 440));
  const interference = cos(phase.add(vec3(0, 2.094, 4.188)))
    .mul(0.5)
    .add(0.5);
  const hueSweep = fract(
    thicknessT
      .mul(freq.mul(0.65).add(0.55))
      .add(dot(n, vec3(0.23, 0.11, -0.37)).mul(0.18))
  );
  const oxide = mix(interference, bismuth(hueSweep), 0.68);
  const fresnel = pow(ndv.oneMinus(), 2.2);
  const film = strength.mul(fresnel.mul(0.52).add(0.48));
  const branchTint = mix(vec3(1), base, 0.58);
  const metallicBase = vec3(0.92, 0.94, 0.98).mul(
    mix(vec3(1), branchTint, 0.26)
  );
  const oxideTinted = mix(oxide, oxide.mul(branchTint), 0.62);
  const blendTint = mix(metallicBase, oxideTinted, saturate(film.mul(0.78)));
  const overlayTint = mix(vec3(1), blendTint, strength.mul(0.62));
  const lifted = base
    .mul(overlayTint)
    .add(oxide.mul(fresnel).mul(strength).mul(0.22));
  return mix(base, lifted, strength.mul(0.85));
}).setLayout({
  name: 'eggIridescence',
  type: 'vec3',
  inputs: [
    { name: 'base', type: 'vec3' },
    { name: 'worldPos', type: 'vec3' },
    { name: 'worldNormal', type: 'vec3' },
    { name: 'eye', type: 'vec3' },
    { name: 'strength', type: 'float' },
    { name: 'freq', type: 'float' },
  ],
});

export default function eggIridescence({
  base,
  frequency,
  normal,
  position,
  eye,
  strength,
}) {
  return iridescent(base, position, normal, eye, saturate(strength), frequency);
}
