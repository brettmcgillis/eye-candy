/* eslint-disable camelcase */
import { float, mix, mx_noise_float, time, vec3 } from 'three/tsl';

const TWO_PI = 6.28318;

// Port of dev/examples/Quick_Grass grass-lighting-model-vsh.glsl.
function quickWind({ bladeSeed, height, phase, uniforms, worldX, worldZ }) {
  const windTime = time.mul(uniforms.windSpeed);
  const swirl = mx_noise_float(
    vec3(worldX.mul(0.05), worldZ.mul(0.05), windTime.mul(0.12))
  );
  const windAngle = uniforms.windAngle.add(swirl.mul(0.7));
  const windDir = vec3(windAngle.cos(), 0, windAngle.sin());
  const crossDir = vec3(windAngle.sin().negate(), 0, windAngle.cos());

  const leanSample = mx_noise_float(
    vec3(
      worldX.mul(uniforms.windScale).add(windTime.mul(uniforms.windDir.x)),
      worldZ.mul(uniforms.windScale).add(windTime.mul(uniforms.windDir.y)),
      bladeSeed.mul(3.1)
    )
  );
  const gust = leanSample.mul(0.5).add(0.5);
  const leanRemap = gust.mul(0.75).add(0.25);
  const lean = leanRemap.mul(leanRemap).mul(1.25).mul(uniforms.windStrength);

  const freq = mix(float(1.6), float(3.2), bladeSeed);
  const flutter = time
    .mul(freq.mul(3))
    .add(phase)
    .add(worldX.mul(windDir.x).add(worldZ.mul(windDir.z)).mul(0.8))
    .sin()
    .mul(0.12);

  const push = lean.add(flutter.mul(uniforms.windStrength)).mul(height);
  const swayDir = windDir.add(crossDir.mul(flutter.mul(2.5))).normalize();

  return {
    gust,
    offsets: [
      swayDir.mul(push.mul(0.1)),
      swayDir.mul(push.mul(0.28)),
      swayDir.mul(push.mul(0.55)),
    ],
  };
}

// Samples the mesh-local root, so tiled fields share one gust pattern.
function swayWind({ bladeSeed, height, offset, phase, uniforms }) {
  const windDir = vec3(uniforms.windDir.x, 0, uniforms.windDir.y);
  const crossDir = vec3(uniforms.windDir.y.negate(), 0, uniforms.windDir.x);
  const drift = time.mul(uniforms.windSpeed);
  const gust = mx_noise_float(
    vec3(
      offset.x.mul(uniforms.windScale).add(drift),
      offset.z.mul(uniforms.windScale),
      drift.mul(0.6)
    )
  )
    .mul(0.5)
    .add(0.5);
  const breathe = time
    .mul(0.35)
    .add(bladeSeed.mul(TWO_PI))
    .sin()
    .mul(0.35)
    .add(0.65);
  const strength = uniforms.windStrength.mul(gust).mul(breathe);

  const wave = offset.x.mul(windDir.x).add(offset.z.mul(windDir.z)).mul(0.6);
  const freq = mix(float(1.2), float(2.6), bladeSeed);
  const low = time.mul(freq).add(phase).add(wave).sin();
  const high = time
    .mul(freq.mul(4))
    .add(phase.mul(1.7))
    .add(wave.mul(1.3))
    .sin();

  const push = strength.mul(height);
  const swayDir = windDir.add(crossDir.mul(high.mul(0.35))).normalize();
  const sway = strength.mul(height).mul(0.5);

  return {
    gust,
    offsets: [
      windDir.mul(push.mul(0.08)).add(swayDir.mul(low.mul(sway).mul(0.25))),
      windDir.mul(push.mul(0.15)).add(swayDir.mul(low.mul(sway).mul(0.55))),
      windDir
        .mul(push.mul(0.25))
        .add(swayDir.mul(low.mul(sway)))
        .add(swayDir.mul(high.mul(sway).mul(0.3))),
    ],
  };
}

export const WINDS = { quick: quickWind, sway: swayWind };

export { TWO_PI };
