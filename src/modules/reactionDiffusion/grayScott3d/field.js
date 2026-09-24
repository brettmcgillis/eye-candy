/* eslint-disable camelcase */
import {
  Fn,
  float,
  instanceIndex,
  ivec3,
  mix,
  mx_noise_float,
  select,
  smoothstep,
  storage,
  texture3D,
  textureStore,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Gray-Scott stepped only on a sparse list of domain voxels (vec4: xyz coords,
// w reach), so a shell or a solid patterns without paying for empty volume.
// Voxels past `front` stay frozen at their seed, so the pattern develops
// behind a moving front. Output texels are (U, V, inDomain, reach).
const DT = 0.24;
const MIN_PAIRS = 1;
const MAX_PAIRS = 32;
// Seed blobs scale with the pattern (band width goes as sqrt(diffusion)); too
// small for the pattern and the reaction cannot hold them.
const SEED_SCALE = 6;

function createVolume([nx, ny, nz]) {
  const texture = new THREE.Storage3DTexture(nx, ny, nz);
  texture.type = THREE.FloatType;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function createGrayScott3dField({ dims, voxels }) {
  const [nx, ny, nz] = dims;
  const voxelCount = voxels.length / 4;
  const voxelBuffer = storage(
    new THREE.StorageBufferAttribute(voxels, 4),
    'vec4',
    voxelCount
  ).toReadOnly();

  const uniforms = {
    // Band width goes as sqrt(diffusion), so this is the pattern-scale knob.
    diffusionScale: uniform(1),
    diffusionV: uniform(0.5),
    drift: uniform(0.004),
    driftScale: uniform(0.05),
    // Read on the CPU to advance `phase`.
    driftSpeed: uniform(0.15),
    feedRate: uniform(0.037),
    front: uniform(-1e6),
    frontSoftness: uniform(0.08),
    killRate: uniform(0.06),
    phase: uniform(0),
    seedCoverage: uniform(0.35),
    seedSalt: uniform(0),
    stepScale: uniform(16),
  };

  const fields = [createVolume(dims), createVolume(dims)];

  function reactPass(from, to) {
    // A read-only storage view would build 2D load coords; a sampled 3D
    // view loads with ivec3.
    const read = texture3D(fields[from], null, 0);

    return Fn(() => {
      const voxel = voxelBuffer.element(instanceIndex);
      const c = ivec3(voxel.xyz);
      const reach = voxel.w;
      const current = read.load(c).xy.toVar();
      // Off-domain neighbours mirror the centre (zero flux). Read as they
      // are, their V=0 drains a sheet this thin before it can pattern.
      const at = (dx, dy, dz) => {
        const n = read.load(
          ivec3(
            c.x.add(dx).clamp(0, nx - 1),
            c.y.add(dy).clamp(0, ny - 1),
            c.z.add(dz).clamp(0, nz - 1)
          )
        );
        return select(n.z.greaterThan(0.5), n.xy, current);
      };

      const laplacian = at(1, 0, 0)
        .add(at(-1, 0, 0))
        .add(at(0, 1, 0))
        .add(at(0, -1, 0))
        .add(at(0, 0, 1))
        .add(at(0, 0, -1))
        .div(6)
        .sub(current);

      const wander = mx_noise_float(
        vec3(c)
          .mul(uniforms.driftScale)
          .add(vec3(0, uniforms.phase, 0))
      );
      const feed = uniforms.feedRate.add(wander.mul(uniforms.drift));
      const kill = uniforms.killRate.sub(wander.mul(uniforms.drift).mul(0.5));

      const uvv = current.x.mul(current.y).mul(current.y);
      const reaction = vec2(
        uvv.negate().add(feed.mul(float(1).sub(current.x))),
        uvv.sub(feed.add(kill).mul(current.y))
      );
      const diffusion = vec2(
        laplacian.x,
        laplacian.y.mul(uniforms.diffusionV)
      ).mul(uniforms.diffusionScale);
      const next = current
        .add(diffusion.add(reaction).mul(DT))
        .clamp(0, 1)
        .toVar();

      const alive = float(1).sub(
        smoothstep(
          uniforms.front.sub(uniforms.frontSoftness),
          uniforms.front,
          reach
        )
      );

      textureStore(fields[to], c, vec4(mix(current, next, alive), 1, reach));
    })().compute(voxelCount);
  }

  function clearPass(index) {
    return Fn(() => {
      const x = instanceIndex.mod(nx);
      const y = instanceIndex.div(nx).mod(ny);
      const z = instanceIndex.div(nx * ny);
      // Off-domain reach is huge, so a filtered read at the domain's edge never
      // reads as reached.
      textureStore(fields[index], ivec3(x, y, z), vec4(1, 0, 0, 1e4));
    })().compute(nx * ny * nz);
  }

  function seedPass(index) {
    return Fn(() => {
      const voxel = voxelBuffer.element(instanceIndex);
      const c = ivec3(voxel.xyz);
      // Round noise blobs at a scale the reaction can hold. Hashed cells
      // worked too, but read as squares at the front before they dissolve.
      const lit = mx_noise_float(
        vec3(c)
          .div(uniforms.diffusionScale.sqrt().mul(SEED_SCALE))
          .add(vec3(uniforms.seedSalt, 0, 0))
      ).greaterThan(float(1).sub(uniforms.seedCoverage.mul(2)));
      textureStore(
        fields[index],
        c,
        vec4(select(lit, 0.5, 1), select(lit, 0.25, 0), 1, voxel.w)
      );
    })().compute(voxelCount);
  }

  const clearPasses = [clearPass(0), clearPass(1), seedPass(0), seedPass(1)];
  const forwardPass = reactPass(0, 1);
  const returnPass = reactPass(1, 0);
  let cleared = false;

  function reset(renderer) {
    uniforms.seedSalt.value = Math.floor(Math.random() * 4096);
    clearPasses.forEach((pass) => renderer.compute(pass));
    cleared = true;
  }

  function update(renderer, delta = 1 / 60) {
    if (!cleared) reset(renderer);
    const pairs = Math.min(
      MAX_PAIRS,
      Math.max(MIN_PAIRS, Math.round(uniforms.stepScale.value / 2))
    );
    uniforms.phase.value += delta * uniforms.driftSpeed.value;
    for (let i = 0; i < pairs; i += 1) {
      renderer.compute(forwardPass);
      renderer.compute(returnPass);
    }
  }

  return {
    dispose: () => fields.forEach((texture) => texture.dispose()),
    fieldTexture: fields[0],
    reset,
    uniforms,
    update,
  };
}
