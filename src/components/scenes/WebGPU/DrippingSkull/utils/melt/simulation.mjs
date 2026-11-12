import { Quaternion, Vector3 } from 'three/webgpu';

import { createBlobs } from './blobs.mjs';
import { createDrops } from './drops.mjs';
import { createField } from './field.mjs';
import { createPendants, pendantLayout } from './pendants.mjs';
import { createPuddle } from './puddle.mjs';
import { createSurfaceWalk } from './surfaceWalk.mjs';
import { createTrails } from './trails.mjs';

const STEP = 1 / 60;

export default function createSimulation(shape, { lite, floorY, seed }) {
  const field = createField({ lite });
  field.setShape(shape);
  const walk = createSurfaceWalk(shape.walk, shape.topology());
  const trails = createTrails({ maxTrails: field.MAXT, points: field.P });
  const blobs = createBlobs(walk, { lite, maxBlobs: field.MAXB, seed, trails });
  const puddle = createPuddle({ lite, floorY });
  const drops = createDrops({ lite, floorY, puddle });
  const pendants = createPendants({
    lite,
    walk,
    field,
    sdf: shape.sdf,
    blobs,
    drops,
    seed,
    floorY,
  });
  blobs.setPendants(pendants);
  const gravity = [0, -1, 0];
  const eye = [0.34, 0.26, 1];
  const key = [-0.5, 0.9, 0.55];
  const inverse = new Quaternion();
  const vector = new Vector3();
  let accumulator = STEP;
  let cold = true;
  const frame = { poolCount: 0, dropCount: 0 };
  const api = {
    field,
    walk,
    blobs,
    trails,
    pendants,
    drops,
    puddle,
    layout: pendantLayout(lite),
    configure(config) {
      blobs.params.amount = pendants.params.amount = config.meltAmount;
      blobs.params.viscosity =
        trails.params.viscosity =
        pendants.params.viscosity =
          config.viscosity;
      blobs.params.size = pendants.params.size = config.meltSize;
      blobs.params.dripLength = pendants.params.dripLength = config.meltLength;
    },
    update(dt, body, camera) {
      inverse.copy(body.quaternion).invert();
      vector.set(0, -1, 0).applyQuaternion(inverse).toArray(gravity);
      vector
        .set(-0.5, 0.9, 0.55)
        .normalize()
        .applyQuaternion(inverse)
        .toArray(key);
      body.worldToLocal(vector.copy(camera.position)).normalize().toArray(eye);
      if (cold) {
        for (let i = 0; i < 240; i += 1) {
          blobs.step(1 / 20, gravity, eye, key);
          trails.step(1 / 20);
          if (i % 5 === 0) field.pack(blobs, trails, false, 0);
          for (let k = 0; k < 3; k += 1) {
            pendants.step(STEP, body.matrixWorld, gravity);
            drops.step(STEP);
            puddle.step(STEP);
          }
        }
        blobs.resetPrev.fill(1);
        field.prime();
        pendants.prime();
        drops.prime();
        puddle.prime();
        cold = false;
      } else {
        accumulator = Math.min(accumulator + dt, 4 * STEP);
        while (accumulator > STEP + 1e-6) {
          blobs.step(STEP, gravity, eye, key);
          trails.step(STEP);
          pendants.step(STEP, body.matrixWorld, gravity);
          drops.step(STEP);
          puddle.step(STEP);
          accumulator -= STEP;
        }
      }
      field.setPoses(body);
      const t = accumulator / STEP;
      const view = blobs.interpolate(t);
      field.pack(blobs, trails, dt > 0, 0, view);
      const poolCount = pendants.pack(view, t);
      const dropCount = drops.pack(t, dt, 0);
      puddle.upload(dt > 0);
      frame.poolCount = poolCount;
      frame.dropCount = dropCount;
      return frame;
    },
    reset() {
      blobs.reset();
      trails.reset();
      pendants.reset();
      drops.reset();
      puddle.reset();
      accumulator = STEP;
      field.prime();
    },
    dispose() {
      Object.values(field.uniforms).forEach(({ value }) => {
        if (value?.isTexture) value.dispose();
      });
      pendants.tex.dispose();
      drops.dispose();
      puddle.dispose();
    },
  };
  return api;
}
