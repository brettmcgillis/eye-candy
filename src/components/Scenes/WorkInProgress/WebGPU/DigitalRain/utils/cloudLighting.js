import { Break, Fn, If, Loop, PI, exp, float, mix, pow } from 'three/tsl';

import cloudDensity from './density';

// Port of ~/dev/examples/three-volumetric-clouds's rayMarch.ts lighting
// model: Beer's law transmittance + a dual-lobe Henyey-Greenstein phase
// function approximated with a 4-octave cheap "multiple scattering" sum
// (Fournier-Neyret style), used to light a directional-light shadow march
// through the SAME density field CloudVolume raymarches.
export const beersLaw = Fn(([density, absorption]) =>
  exp(density.mul(absorption).negate())
);

const henyeyGreenstein = Fn(([g, cosTheta]) => {
  const g2 = g.mul(g);
  return float(1).div(
    float(4)
      .mul(PI)
      .mul(pow(float(1).add(g2).sub(g.mul(2).mul(cosTheta)), 1.5))
  );
});

const dualLobeHenyeyGreenstein = Fn(([g, cosTheta, k]) =>
  mix(henyeyGreenstein(g, cosTheta), henyeyGreenstein(g.negate(), cosTheta), k)
);

const MULTI_SCATTER_OCTAVES = 4;
const MULTI_SCATTER_ATTENUATION = 0.5;
const MULTI_SCATTER_CONTRIBUTION = 0.5;
const MULTI_SCATTER_PHASE_ATTENUATION = 0.1;

const multipleScattering = Fn(([depth, g, cosTheta, k]) => {
  const luminance = float(0).toVar();
  const a = float(1).toVar();
  const b = float(1).toVar();
  const c = float(1).toVar();

  for (let i = 0; i < MULTI_SCATTER_OCTAVES; i += 1) {
    luminance.addAssign(
      b
        .mul(dualLobeHenyeyGreenstein(g.mul(c), cosTheta, k))
        .mul(beersLaw(depth, a))
    );
    a.mulAssign(MULTI_SCATTER_ATTENUATION);
    b.mulAssign(MULTI_SCATTER_CONTRIBUTION);
    c.mulAssign(float(1).sub(MULTI_SCATTER_PHASE_ATTENUATION));
  }

  return luminance;
});

// Marches from `samplePos` toward the light, accumulating shadowing density,
// then converts that into a scattering luminance term.
export const marchDirectionalLight = Fn(
  ({ samplePos, lightDir, cosTheta, field, raymarch }) => {
    const lightDensity = float(0).toVar();
    const depth = float(0).toVar();

    Loop(raymarch.lightSteps, () => {
      depth.addAssign(raymarch.lightStepSize);
      const lightSamplePos = samplePos.sub(lightDir.mul(depth));
      const sample = cloudDensity({
        worldPos: lightSamplePos,
        field,
      }).saturate();
      lightDensity.addAssign(sample.mul(raymarch.densityScale));
      If(lightDensity.greaterThanEqual(1), () => {
        Break();
      });
    });

    return multipleScattering(
      lightDensity,
      raymarch.anisotropy,
      cosTheta,
      raymarch.phaseMix
    );
  }
);
