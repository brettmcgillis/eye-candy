import { Fn, Loop, PI, exp, float, select, vec2, vec3 } from 'three/tsl';

const C_RAYLEIGH = vec3(5.802, 13.558, 33.1).mul(1e-6);
const C_MIE = vec3(3.996, 3.996, 3.996).mul(1e-6);

const pow5 = (x) => {
  const x2 = x.mul(x);
  return x2.mul(x2).mul(x);
};

// BRDF from https://www.shadertoy.com/view/XlKSDR — Walter et al. 2007,
// Heitz 2014, Schlick 1994, Burley 2012.
const dGGX = (linearRoughness, noH) => {
  const oneMinusNoHSquared = noH.mul(noH).oneMinus();
  const a = noH.mul(linearRoughness);
  const k = linearRoughness.div(oneMinusNoHSquared.add(a.mul(a)));
  return k.mul(k).div(PI);
};

const vSmithGGXCorrelated = (linearRoughness, noV, noL) => {
  const a2 = linearRoughness.mul(linearRoughness);
  const ggxV = noL.mul(noV.sub(a2.mul(noV)).mul(noV).add(a2).sqrt());
  const ggxL = noV.mul(noL.sub(a2.mul(noL)).mul(noL).add(a2).sqrt());
  return float(0.5).div(ggxV.add(ggxL));
};

export const fresnel = (f0, voH) =>
  f0.add(f0.oneMinus().mul(pow5(voH.oneMinus())));

const fresnelScalar = (f0, f90, voH) =>
  f0.add(f90.sub(f0).mul(pow5(voH.oneMinus())));

const fdBurley = (linearRoughness, noV, noL, loH) => {
  const f90 = linearRoughness.mul(loH).mul(loH).mul(2).add(0.5);
  return fresnelScalar(float(1), f90, noL)
    .mul(fresnelScalar(float(1), f90, noV))
    .div(PI);
};

export const fdLambert = () => float(1).div(PI);

export const shade = Fn(([diffuse, f0, smoothness, n, v, l, lc]) => {
  const h = v.add(l).normalize().toVar();

  const noV = n.dot(v).abs().add(1e-5).toVar();
  const noL = n.dot(l).clamp(0, 1).toVar();
  const noH = n.dot(h).clamp(0, 1).toVar();
  const loH = l.dot(h).clamp(0, 1).toVar();

  const roughness = smoothness.oneMinus().toVar();
  const linearRoughness = roughness.mul(roughness).toVar();

  const specular = dGGX(linearRoughness, noH)
    .mul(vSmithGGXCorrelated(linearRoughness, noV, noL))
    .mul(fresnel(f0, loH));

  const body = diffuse.mul(fdBurley(linearRoughness, noV, noL, loH));

  return body.add(specular).mul(lc).mul(noL);
});

export const skyColor = (rd, sun, ambientColor, ambientIntensity) =>
  ambientColor
    .mul(ambientIntensity)
    .mul(PI)
    .mul(rd.dot(sun).abs().mul(0.8).oneMinus());

// Narkowicz 2015, "ACES Filmic Tone Mapping Curve".
export const tonemapACES = (x) =>
  x
    .mul(x.mul(2.51).add(0.03))
    .div(x.mul(x.mul(2.43).add(0.59)).add(0.14))
    .clamp(0, 1);

const phaseRayleigh = (costh) => costh.mul(costh).add(1).mul(3).div(PI.mul(16));

const phaseMie = (costh, gIn) => {
  const g = float(gIn).min(0.9381).toVar();
  const k = g.mul(1.55).sub(g.mul(g).mul(g).mul(0.55)).toVar();
  const kcosth = k.mul(costh).toVar();
  return k
    .mul(k)
    .oneMinus()
    .div(PI.mul(4).mul(kcosth.oneMinus()).mul(kcosth.oneMinus()));
};

// A 16-step in-scattering march between the terrain box's entry point and
// whatever the ray hit. The density band sits above the flat bottom of the box,
// so haze pools in the valleys and leaves the plinth clear.
export function atmosphere({ ro, rd, sun, boxEntry, boxExit, hitDistance }) {
  const costh = rd.dot(sun).toVar();
  const phaseR = phaseRayleigh(costh).toVar();
  const phaseM = phaseMie(costh, float(0.6)).toVar();

  const rayLength = select(hitDistance.greaterThan(0), hitDistance, boxExit)
    .sub(boxEntry)
    .toVar();
  const stepSize = rayLength.div(16).toVar();

  const od = vec2(0).toVar();
  const transmittance = vec3(1).toVar();
  const scattered = vec3(0).toVar();

  Loop(16, ({ i }) => {
    const p = ro.add(rd.mul(boxEntry.add(i.toFloat().add(0.5).mul(stepSize))));

    const above = p.y.sub(0.35).max(0);
    const density = select(
      p.y.lessThan(0.35),
      float(0),
      above.div(0.2).clamp(0, 1).oneMinus()
    )
      .mul(1e5)
      .toVar();

    od.addAssign(stepSize.mul(vec2(density, density)));
    transmittance.assign(
      exp(od.x.mul(C_RAYLEIGH).add(od.y.mul(C_MIE)).negate())
    );

    scattered.addAssign(
      transmittance.mul(C_RAYLEIGH).mul(phaseR).mul(density).mul(stepSize)
    );
    scattered.addAssign(
      transmittance.mul(C_MIE).mul(phaseM).mul(density).mul(stepSize)
    );
  });

  return { scattered, transmittance };
}
