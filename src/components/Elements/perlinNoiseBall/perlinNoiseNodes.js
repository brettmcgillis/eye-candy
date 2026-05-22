import {
  Fn,
  Loop,
  float,
  int,
  mix,
  mx_fractal_noise_float as mxFractalNoise,
  vec3,
} from 'three/tsl';

const TURBULENCE_OCTAVES = 6;

export const signedPerlinApprox = Fn(([input]) =>
  mxFractalNoise(vec3(input), int(1), float(2.0), float(0.5))
).setLayout({
  name: 'signedPerlinApprox',
  type: 'float',
  inputs: [{ name: 'input', type: 'vec3' }],
});

export const approximateTurbulence = Fn(([input]) => {
  const p = vec3(input).toVar();
  const turbulence = float(-0.5).toVar();

  Loop(
    {
      start: float(1.0),
      end: float(TURBULENCE_OCTAVES),
      type: 'float',
      condition: '<=',
    },
    ({ i }) => {
      const power = float(2.0).pow(i).toVar();
      const sample = signedPerlinApprox(p.mul(power)).toVar();
      turbulence.addAssign(sample.abs().div(power));
    }
  );

  return turbulence;
}).setLayout({
  name: 'approximateTurbulence',
  type: 'float',
  inputs: [{ name: 'input', type: 'vec3' }],
});

export const smokeGradient = Fn(
  ([heatInput, smokeDarkColorInput, smokeLightColorInput]) => {
    const heat = float(heatInput).clamp(0.0, 1.0).toVar();
    const smokeDarkColor = vec3(smokeDarkColorInput).toVar();
    const smokeLightColor = vec3(smokeLightColorInput).toVar();
    const darkToLight = mix(
      smokeDarkColor,
      smokeLightColor,
      heat.mul(2.0).clamp(0.0, 1.0)
    );
    const lightToHighlight = mix(
      smokeLightColor,
      smokeLightColor.add(vec3(0.1, 0.1, 0.1)),
      heat.sub(0.5).mul(2.0).clamp(0.0, 1.0)
    );

    return heat.lessThan(0.5).select(darkToLight, lightToHighlight);
  }
).setLayout({
  name: 'smokeGradient',
  type: 'vec3',
  inputs: [
    { name: 'heatInput', type: 'float' },
    { name: 'smokeDarkColorInput', type: 'vec3' },
    { name: 'smokeLightColorInput', type: 'vec3' },
  ],
});
