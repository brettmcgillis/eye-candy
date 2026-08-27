/* eslint-disable camelcase */
// Forked from three's own createRoadMaterial (addons/generators/CityGenerator)
// so every constant baked into it becomes a uniform. The original is a fixed
// look with no handles at all — fine for a city demo, useless for dialling in
// one lot under one spotlight.
//
// Two smoothsteps are also written the safe way round here. The original calls
// smoothstep(far, near, x) with edge0 > edge1, which WGSL leaves undefined; the
// oneMinus(smoothstep(near, far, x)) form is exactly equivalent and defined.
import {
  Fn,
  If,
  cameraPosition,
  float,
  fract,
  fwidth,
  mix,
  mod,
  mx_fractal_noise_float,
  mx_noise_float,
  normalView,
  oneMinus,
  positionView,
  positionWorld,
  smoothstep,
  step,
  uniform,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createAsphaltUniforms() {
  return {
    colorDark: uniform(new THREE.Color('#24262b')),
    colorLight: uniform(new THREE.Color('#3b3f46')),
    patchScale: uniform(0.2),
    gritScale: uniform(7),
    gritAmount: uniform(0.22),
    stainScale: uniform(0.45),
    stainAmount: uniform(0.5),
    crackScale: uniform(1.1),
    crackAmount: uniform(0.5),
    wetScale: uniform(0.14),
    wetAmount: uniform(1),
    wetRoughness: uniform(0.32),
    roughness: uniform(0.95),
    paintColor: uniform(new THREE.Color('#d0ccc0')),
    paintWidth: uniform(1),
    paintWear: uniform(1),
    dashPeriod: uniform(7),
    crosswalkWidth: uniform(5),
    detailNear: uniform(25),
    detailFar: uniform(240),
    bump: uniform(1),
  };
}

// Mikkelsen's surface-gradient method: feeds the hardware screen-space
// derivatives of a height field into the view normal so the relief actually
// perturbs shading.
function bumpNormal(height) {
  const dpdx = positionView.dFdx();
  const dpdy = positionView.dFdy();
  const r1 = dpdy.cross(normalView);
  const r2 = normalView.cross(dpdx);
  const det = dpdx.dot(r1);
  const grad = det.sign().mul(height.dFdx().mul(r1).add(height.dFdy().mul(r2)));

  return det.abs().mul(normalView).sub(grad).normalize();
}

// Antialiased filled band, edge sized to the pixel footprint so thin paint
// stays crisp instead of shimmering.
function lineAA(coord, halfWidth) {
  const aa = fwidth(coord).max(0.0001);
  return oneMinus(
    smoothstep(halfWidth.sub(aa), halfWidth.add(aa), coord.abs())
  );
}

// The same band, repeated at every multiple of `period`.
function gridLine(coord, period, halfWidth) {
  const g = coord.div(period);
  const d = float(0.5).sub(fract(g).sub(0.5).abs());
  const aa = fwidth(g).max(0.0001);
  const hw = halfWidth.div(period);
  return oneMinus(smoothstep(hw.sub(aa), hw.add(aa), d));
}

export default function createAsphaltMaterial(layout, u) {
  const p = positionWorld;
  const detail = oneMinus(
    smoothstep(
      u.detailNear,
      u.detailFar.max(u.detailNear.add(0.01)),
      p.distance(cameraPosition)
    )
  );

  const blotch = mx_fractal_noise_float(p.mul(u.patchScale), 3)
    .mul(0.5)
    .add(0.5);

  // Close-range detail is sampled inside a branch so its five noise lookups are
  // skipped across the far majority of the plane.
  const near = Fn(() => {
    const grit = float(0).toVar();
    const stain = float(0).toVar();
    const crack = float(0).toVar();
    const worn = float(1).toVar();

    If(detail.greaterThan(0), () => {
      grit.assign(
        mx_noise_float(p.mul(u.gritScale))
          .add(mx_noise_float(p.mul(u.gritScale.mul(3.29))))
          .mul(0.5)
      );
      stain.assign(
        smoothstep(
          0.5,
          0.85,
          mx_fractal_noise_float(p.mul(u.stainScale), 3).mul(0.5).add(0.5)
        )
      );
      crack.assign(
        smoothstep(
          0.88,
          1,
          mx_fractal_noise_float(p.mul(u.crackScale), 4).abs().oneMinus()
        ).mul(detail)
      );
      worn.assign(
        smoothstep(
          0.25,
          0.7,
          mx_fractal_noise_float(p.mul(0.7), 3).mul(0.5).add(0.5)
        )
          .mul(0.55)
          .add(0.35)
      );
    });

    return vec4(grit, stain, crack, worn);
  })();

  const grit = near.x;
  const stain = near.y;
  const crack = near.z.mul(u.crackAmount.mul(2));
  const worn = mix(float(1), near.w, u.paintWear);

  const base = mix(u.colorDark, u.colorLight, blotch);
  const gritty = base.mul(grit.mul(u.gritAmount).mul(detail).add(1));
  const asphalt = mix(
    gritty,
    gritty.mul(0.5),
    stain.mul(u.stainAmount).mul(detail)
  );

  const wet = smoothstep(
    0.6,
    0.85,
    mx_fractal_noise_float(p.mul(u.wetScale), 2).mul(0.5).add(0.5)
  ).mul(u.wetAmount);

  // Markings, aligned to the block/street grid. fx, fz are the position within
  // one block+street period; the street is the [blockW, period) part.
  const periodX = layout.blockW + layout.street;
  const periodZ = layout.blockD + layout.street;
  const fx = mod(p.x.add(layout.cityW / 2), periodX);
  const fz = mod(p.z.add(layout.cityD / 2), periodZ);
  const inStreetX = step(layout.blockW, fx);
  const inStreetZ = step(layout.blockD, fz);
  const su = fx.sub(layout.blockW);
  const sv = fz.sub(layout.blockD);

  const centreHalf = u.paintWidth.mul(0.12);
  const dividerHalf = u.paintWidth.mul(0.1);

  const dashV = step(fract(p.z.div(u.dashPeriod)), 0.5);
  const dashH = step(fract(p.x.div(u.dashPeriod)), 0.5);

  const centreV = lineAA(su.sub(layout.street / 2), centreHalf);
  const dividerV = lineAA(su.sub(layout.street / 4), dividerHalf)
    .max(lineAA(su.sub((layout.street * 3) / 4), dividerHalf))
    .mul(dashV);
  const laneV = centreV.max(dividerV).mul(inStreetX).mul(inStreetZ.oneMinus());

  const centreH = lineAA(sv.sub(layout.street / 2), centreHalf);
  const dividerH = lineAA(sv.sub(layout.street / 4), dividerHalf)
    .max(lineAA(sv.sub((layout.street * 3) / 4), dividerHalf))
    .mul(dashH);
  const laneH = centreH.max(dividerH).mul(inStreetZ).mul(inStreetX.oneMinus());

  const nearZ = step(fz, u.crosswalkWidth).max(
    step(float(layout.blockD).sub(u.crosswalkWidth), fz)
  );
  const nearX = step(fx, u.crosswalkWidth).max(
    step(float(layout.blockW).sub(u.crosswalkWidth), fx)
  );
  const crossV = gridLine(su, float(1.2), u.paintWidth.mul(0.38))
    .mul(inStreetX)
    .mul(inStreetZ.oneMinus())
    .mul(nearZ);
  const crossH = gridLine(sv, float(1.2), u.paintWidth.mul(0.38))
    .mul(inStreetZ)
    .mul(inStreetX.oneMinus())
    .mul(nearX);

  const paint = laneV.max(laneH).max(crossV).max(crossH).mul(detail).mul(worn);

  const material = new THREE.MeshStandardNodeMaterial();
  const surface = mix(asphalt, asphalt.mul(0.6), wet).mul(
    crack.mul(0.5).oneMinus()
  );

  material.colorNode = mix(surface, u.paintColor, paint);
  material.roughnessNode = mix(
    u.roughness.sub(paint.mul(0.2)),
    u.wetRoughness,
    wet
  );
  material.normalNode = bumpNormal(
    grit.mul(0.003).sub(crack.mul(0.01)).mul(detail).mul(u.bump)
  );

  return material;
}
