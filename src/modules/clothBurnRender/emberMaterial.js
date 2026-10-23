import {
  Fn,
  attribute,
  float,
  fract,
  mix,
  smoothstep,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export default function createEmberMaterial(uniforms, nodes = {}) {
  const {
    timeU,
    sizeU,
    riseU,
    lifeMinU,
    lifeMaxU,
    colorHotU,
    colorCoolU,
    intensityU,
  } = uniforms;
  const spawnPosition = nodes.spawnPosition ?? attribute('aSpawnPos');
  const spawnTime = nodes.spawnTime ?? attribute('aSpawnTime');
  const velocity = nodes.velocity ?? attribute('aVelocity');
  const seed = nodes.seed ?? attribute('aSeed');
  const material = new THREE.SpriteNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const age = timeU.sub(spawnTime).toVar('emberAge');
  const life = mix(lifeMinU, lifeMaxU, seed).toVar('emberLife');
  const ageNorm = age.div(life).clamp(0, 1).toVar('emberAgeNorm');

  material.positionNode = Fn(() => {
    const s = seed;
    const wobble = vec3(
      age
        .mul(mix(float(5), float(11), s))
        .add(s.mul(40))
        .sin(),
      0,
      age.mul(mix(float(4), float(9), fract(s.mul(7.31)))).cos()
    ).mul(0.04);
    const buoyancy = vec3(0, riseU.mul(age).mul(ageNorm.mul(0.7).add(0.3)), 0);
    return spawnPosition.add(velocity.mul(age)).add(buoyancy).add(wobble);
  })();

  material.scaleNode = sizeU
    .mul(smoothstep(0, 0.05, ageNorm))
    .mul(float(1).sub(ageNorm).pow(0.7))
    .mul(mix(float(0.6), float(1.4), fract(seed.mul(13.7))));

  material.colorNode = Fn(() => {
    const d = uv().sub(0.5).length();
    const mask = smoothstep(0.5, 0.12, d);
    const flicker = age
      .mul(mix(float(18), float(30), seed))
      .sin()
      .mul(0.25)
      .add(0.75);
    const col = mix(colorHotU, colorCoolU, ageNorm.pow(1.5));
    const alive = smoothstep(0, 0.001, age).mul(
      float(1).sub(smoothstep(0.85, 1.0, ageNorm))
    );
    return vec4(col.mul(intensityU).mul(flicker), mask.mul(alive));
  })();

  return material;
}
