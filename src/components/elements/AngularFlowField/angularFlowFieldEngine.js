/* eslint-disable no-param-reassign */
import createCurlNoiseField from './curlNoiseField';
import {
  buildDiscreteDirections,
  findNearestDiscreteDirection,
} from './discreteDirections';
import { buildSpatialBuckets, computeAlignmentForce } from './flockingForces';

const CENTER_BLEND = 0.6;
const MIN_GENERATION_DISTANCE = 0.0001;
const MIN_TRAIL_CAPACITY = 2;
const MAX_STEP_SECONDS = 0.05;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildEmitterOrigins({
  emitterCountX,
  emitterCountY,
  emitterCountZ,
  spacingX,
  spacingY,
  spacingZ,
}) {
  const countX = Math.max(1, Math.round(emitterCountX));
  const countY = Math.max(1, Math.round(emitterCountY));
  const countZ = Math.max(1, Math.round(emitterCountZ));
  const sx = Math.max(0.0001, spacingX);
  const sy = Math.max(0.0001, spacingY);
  const sz = Math.max(0.0001, spacingZ);

  const total = countX * countY * countZ;
  const result = new Float32Array(total * 3);
  let write = 0;
  for (let z = 0; z < countZ; z += 1) {
    for (let y = 0; y < countY; y += 1) {
      for (let x = 0; x < countX; x += 1) {
        result[write] = (x - (countX - 1) * 0.5) * sx;
        result[write + 1] = (y - (countY - 1) * 0.5) * sy;
        result[write + 2] = (z - (countZ - 1) * 0.5) * sz;
        write += 3;
      }
    }
  }
  return result;
}

// Bounded port of the reference SwarmTrailsEngine: curl-noise + flocking
// steering with discrete-direction snapping, but trail capacity is fixed at
// construction (`length`) instead of growing unbounded — at the cap, each
// emitter either hard-respawns from its origin (loopEnabled) or freezes
// (stops advancing, `!loopEnabled`).
export default class AngularFlowFieldEngine {
  constructor(settings) {
    this.rebuild(settings);
  }

  // Structural rebuild: reallocates every buffer. Call only when emitter
  // counts/spacing, length, discreteResolution, or seed change.
  rebuild(settings) {
    this.settings = { ...settings };
    this.trailCapacity = Math.max(
      MIN_TRAIL_CAPACITY,
      Math.round(settings.length)
    );
    this.curl = createCurlNoiseField(settings.seed);
    this.discreteDirections = buildDiscreteDirections(
      settings.discreteResolution
    );
    this.origins = buildEmitterOrigins(settings);
    this.emitterCount = this.origins.length / 3;
    this.time = 0;

    this.heads = Float32Array.from(this.origins);
    this.velocities = new Float32Array(this.emitterCount * 3);
    this.travel = new Float32Array(this.emitterCount);
    this.trailPoints = new Float32Array(
      this.emitterCount * this.trailCapacity * 3
    );
    this.filledLengths = new Int32Array(this.emitterCount);
    this.capped = new Uint8Array(this.emitterCount);

    for (let emitter = 0; emitter < this.emitterCount; emitter += 1) {
      const src = emitter * 3;
      const base = emitter * this.trailCapacity * 3;
      this.trailPoints[base] = this.origins[src];
      this.trailPoints[base + 1] = this.origins[src + 1];
      this.trailPoints[base + 2] = this.origins[src + 2];
      this.filledLengths[emitter] = 1;
    }

    // Scratch buffers reused every step — no per-frame allocation.
    this.nearestDirectionScratch = new Float32Array(3);
    this.latestPointScratch = new Float32Array(3);
    this.alignmentForceScratch = new Float32Array(3);
    this.divergenceForceScratch = new Float32Array(3);
    this.headsPrev = new Float32Array(this.emitterCount * 3);
    this.velocitiesPrev = new Float32Array(this.emitterCount * 3);
  }

  // Non-structural knobs (noise/flocking/damping/loop/generationDistance)
  // update in place — no reallocation, trails keep growing from where they are.
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  getTrailStateView() {
    return {
      trailPoints: this.trailPoints,
      filledLengths: this.filledLengths,
      trailCapacity: this.trailCapacity,
      emitterCount: this.emitterCount,
    };
  }

  getEmitterOrigins() {
    return this.origins;
  }

  respawnEmitter(emitterIndex) {
    const src = emitterIndex * 3;
    const base = emitterIndex * this.trailCapacity * 3;
    this.trailPoints[base] = this.origins[src];
    this.trailPoints[base + 1] = this.origins[src + 1];
    this.trailPoints[base + 2] = this.origins[src + 2];
    this.filledLengths[emitterIndex] = 1;
    this.heads[src] = this.origins[src];
    this.heads[src + 1] = this.origins[src + 1];
    this.heads[src + 2] = this.origins[src + 2];
    this.velocities[src] = 0;
    this.velocities[src + 1] = 0;
    this.velocities[src + 2] = 0;
    this.travel[emitterIndex] = 0;
    this.capped[emitterIndex] = 0;
  }

  // Returns true if the point was written, false if the cap was hit (in
  // which case the emitter was either respawned or marked capped).
  pushTrailPoint(emitterIndex, x, y, z) {
    if (this.filledLengths[emitterIndex] >= this.trailCapacity) {
      if (this.settings.loopEnabled) {
        this.respawnEmitter(emitterIndex);
      } else {
        this.capped[emitterIndex] = 1;
      }
      return false;
    }
    const nextIndex = this.filledLengths[emitterIndex];
    const write = (emitterIndex * this.trailCapacity + nextIndex) * 3;
    this.trailPoints[write] = x;
    this.trailPoints[write + 1] = y;
    this.trailPoints[write + 2] = z;
    this.filledLengths[emitterIndex] = nextIndex + 1;
    return true;
  }

  getLatestTrailPoint(emitterIndex, out) {
    const pointIndex = Math.max(0, this.filledLengths[emitterIndex] - 1);
    const base = (emitterIndex * this.trailCapacity + pointIndex) * 3;
    out[0] = this.trailPoints[base];
    out[1] = this.trailPoints[base + 1];
    out[2] = this.trailPoints[base + 2];
  }

  // Advances the sim by `deltaSeconds`. Returns { changed } so the caller can
  // skip rebuilding render geometry on frames where no trail point advanced.
  step(deltaSeconds) {
    if (this.emitterCount <= 0) {
      return { changed: false };
    }
    const dt = Math.min(Math.max(deltaSeconds, 0), MAX_STEP_SECONDS);
    if (dt <= 0) {
      return { changed: false };
    }

    const s = this.settings;
    this.headsPrev.set(this.heads);
    this.velocitiesPrev.set(this.velocities);

    let centroidX = 0;
    let centroidY = 0;
    let centroidZ = 0;
    let liveCount = 0;
    for (let i = 0; i < this.emitterCount; i += 1) {
      if (!s.loopEnabled && this.capped[i]) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const idx = i * 3;
      centroidX += this.headsPrev[idx];
      centroidY += this.headsPrev[idx + 1];
      centroidZ += this.headsPrev[idx + 2];
      liveCount += 1;
    }
    if (liveCount > 0) {
      centroidX /= liveCount;
      centroidY /= liveCount;
      centroidZ /= liveCount;
    }
    const targetX = centroidX * CENTER_BLEND;
    const targetY = centroidY * CENTER_BLEND;
    const targetZ = centroidZ * CENTER_BLEND;

    const damping = clamp(s.damping, 0, 0.9999);
    const targetForceStrength =
      Math.max(0, s.attraction) - Math.max(0, s.repulsion);
    const alignmentStrength = Math.max(0, s.alignmentStrength);
    const alignmentRadius = Math.max(0.001, s.alignmentRadius);
    const divergenceStrength = Math.max(0, s.divergenceStrength);
    const divergenceRadius = Math.max(0.001, s.divergenceRadius);
    const useAlignment = alignmentStrength > 1e-6 && liveCount > 1;
    const useDivergence = divergenceStrength > 1e-6 && liveCount > 1;
    const alignmentBuckets = useAlignment
      ? buildSpatialBuckets(this.headsPrev, this.emitterCount, alignmentRadius)
      : null;
    const sameRadius = Math.abs(divergenceRadius - alignmentRadius) <= 1e-6;
    // eslint-disable-next-line no-nested-ternary
    const divergenceBuckets = useDivergence
      ? useAlignment && sameRadius
        ? alignmentBuckets
        : buildSpatialBuckets(
            this.headsPrev,
            this.emitterCount,
            divergenceRadius
          )
      : null;

    const generationDistance = Math.max(
      MIN_GENERATION_DISTANCE,
      s.generationDistance
    );
    const curlParams = {
      noiseScale: s.noiseScale,
      noiseStrength: s.noiseStrength,
      vorticity: s.vorticity,
      octaves: s.octaves,
      lacunarity: s.lacunarity,
      gain: s.gain,
      warpStrength: s.warpStrength,
      warpScale: s.warpScale,
    };

    let changed = false;

    for (let i = 0; i < this.emitterCount; i += 1) {
      if (!s.loopEnabled && this.capped[i]) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const idx = i * 3;
      const px = this.headsPrev[idx];
      const py = this.headsPrev[idx + 1];
      const pz = this.headsPrev[idx + 2];

      const curl = this.curl.sample(px, py, pz, this.time, curlParams);

      let tx = targetX - px;
      let ty = targetY - py;
      let tz = targetZ - pz;
      const targetDistance = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (targetDistance > 1e-6 && Math.abs(targetForceStrength) > 1e-6) {
        const inv = targetForceStrength / targetDistance;
        tx *= inv;
        ty *= inv;
        tz *= inv;
      } else {
        tx = 0;
        ty = 0;
        tz = 0;
      }

      if (alignmentBuckets) {
        computeAlignmentForce(
          i,
          this.headsPrev,
          this.velocitiesPrev,
          alignmentBuckets,
          alignmentRadius,
          this.alignmentForceScratch
        );
      } else {
        this.alignmentForceScratch.fill(0);
      }
      if (divergenceBuckets) {
        computeAlignmentForce(
          i,
          this.headsPrev,
          this.velocitiesPrev,
          divergenceBuckets,
          divergenceRadius,
          this.divergenceForceScratch
        );
      } else {
        this.divergenceForceScratch.fill(0);
      }

      const ax =
        curl.x +
        tx +
        this.alignmentForceScratch[0] * alignmentStrength -
        this.divergenceForceScratch[0] * divergenceStrength;
      const ay =
        curl.y +
        ty +
        this.alignmentForceScratch[1] * alignmentStrength -
        this.divergenceForceScratch[1] * divergenceStrength;
      const az =
        curl.z +
        tz +
        this.alignmentForceScratch[2] * alignmentStrength -
        this.divergenceForceScratch[2] * divergenceStrength;

      const vx = this.velocitiesPrev[idx] * damping + ax * dt;
      const vy = this.velocitiesPrev[idx + 1] * damping + ay * dt;
      const vz = this.velocitiesPrev[idx + 2] * damping + az * dt;

      const nx = px + vx * dt;
      const ny = py + vy * dt;
      const nz = pz + vz * dt;
      this.velocities[idx] = vx;
      this.velocities[idx + 1] = vy;
      this.velocities[idx + 2] = vz;

      const dx = nx - px;
      const dy = ny - py;
      const dz = nz - pz;
      const segmentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const previousCarry = this.travel[i];
      const totalCarry = previousCarry + segmentLength;
      let headX = nx;
      let headY = ny;
      let headZ = nz;
      let respawned = false;

      if (segmentLength > 1e-8 && totalCarry >= generationDistance) {
        this.getLatestTrailPoint(i, this.latestPointScratch);
        let distanceToNextSample = generationDistance - previousCarry;
        while (distanceToNextSample <= segmentLength + 1e-8) {
          const t = distanceToNextSample / segmentLength;
          const rawX = px + dx * t;
          const rawY = py + dy * t;
          const rawZ = pz + dz * t;
          const stepX = rawX - this.latestPointScratch[0];
          const stepY = rawY - this.latestPointScratch[1];
          const stepZ = rawZ - this.latestPointScratch[2];
          const stepLength = Math.sqrt(
            stepX * stepX + stepY * stepY + stepZ * stepZ
          );

          if (stepLength > 1e-8) {
            const invStepLength = 1 / stepLength;
            findNearestDiscreteDirection(
              this.discreteDirections,
              stepX * invStepLength,
              stepY * invStepLength,
              stepZ * invStepLength,
              this.nearestDirectionScratch
            );
            const qx =
              this.latestPointScratch[0] +
              this.nearestDirectionScratch[0] * stepLength;
            const qy =
              this.latestPointScratch[1] +
              this.nearestDirectionScratch[1] * stepLength;
            const qz =
              this.latestPointScratch[2] +
              this.nearestDirectionScratch[2] * stepLength;
            const pushed = this.pushTrailPoint(i, qx, qy, qz);
            if (pushed) {
              changed = true;
              this.latestPointScratch[0] = qx;
              this.latestPointScratch[1] = qy;
              this.latestPointScratch[2] = qz;
              headX = qx;
              headY = qy;
              headZ = qz;
            } else if (s.loopEnabled) {
              respawned = true;
              changed = true;
              break;
            } else {
              break;
            }
          }
          distanceToNextSample += generationDistance;
        }
      }

      if (!respawned) {
        this.heads[idx] = headX;
        this.heads[idx + 1] = headY;
        this.heads[idx + 2] = headZ;
        this.travel[i] = totalCarry % generationDistance;
      }
    }

    this.time += dt * s.noiseSpeed;
    return { changed };
  }
}
