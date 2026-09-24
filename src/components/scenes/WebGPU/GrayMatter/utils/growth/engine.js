/* eslint-disable class-methods-use-this, no-continue, no-param-reassign */
// Port of 260316_DifferentialLayers/src/core/differentialGrowthEngine.ts,
// generalised from the ground plane to a surface: positions are 3D, each point
// carries the surface normal under it, "the curve's normal" is taken in that
// surface's tangent plane, and every move ends by projecting back onto the
// surface. Growth, springs, retention, repulsion, smoothing, splitting and the
// curvature/displacement fields are the reference's, constants included.
import applyRepulsion from './repulsion';
import SeededRng from './seededRng';

const BRIDGE = 3;
const MIN_GAIN = 0.05;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const vec = (x = 0, y = 0, z = 0) => ({ x, y, z });
const copy = (p) => vec(p.x, p.y, p.z);

// The reference's pointNormal, in the plane perpendicular to `up`.
function curveNormal(points, ups, index, closed) {
  const count = points.length;
  const current = points[index];
  const hasPrev = closed || index > 0;
  const hasNext = closed || index < count - 1;
  const prev = hasPrev ? points[(index - 1 + count) % count] : current;
  const next = hasNext ? points[(index + 1) % count] : current;
  const tx = next.x - prev.x;
  const ty = next.y - prev.y;
  const tz = next.z - prev.z;
  const up = ups[index];
  const nx = up.y * tz - up.z * ty;
  const ny = up.z * tx - up.x * tz;
  const nz = up.x * ty - up.y * tx;
  const l = Math.hypot(nx, ny, nz);
  return l < 1e-12 ? vec(up.x, up.y, up.z) : vec(nx / l, ny / l, nz / l);
}

function renormalize(values) {
  let min = Infinity;
  let max = -Infinity;
  values.forEach((v) => {
    min = Math.min(min, v);
    max = Math.max(max, v);
  });
  const span = Math.max(max - min, 1e-6);
  for (let i = 0; i < values.length; i += 1) {
    values[i] = clamp((values[i] - min) / span, 0, 1);
  }
}

export default class SurfaceGrowthEngine {
  constructor(settings, seed, project) {
    this.settings = settings;
    this.rng = new SeededRng(seed);
    this.project = project;
    this.curves = [];
    this.gradientBlur = 0.35;
  }

  setCurve(points, closed) {
    const normals = points.map(() => vec());
    points.forEach((p, i) => this.project(p, normals[i]));
    const variation = new Float32Array(points.length);
    for (let i = 0; i < variation.length; i += 1)
      variation[i] = this.rng.signed();
    this.curves = [
      {
        basePoints: points.map(copy),
        baseNormals: normals.map(copy),
        closed,
        curvature: new Float32Array(points.length),
        displacement: new Float32Array(points.length),
        mask: new Float32Array(points.length),
        normals,
        points,
        variation,
      },
    ];
    this.updateScalarFields();
  }

  getTotalPointCount() {
    return this.curves.reduce((sum, curve) => sum + curve.points.length, 0);
  }

  step(deltaSeconds, growthSpeed, seedInfluence = 0.35) {
    if (this.curves.length === 0) return;
    const safeDt = Math.min(Math.max(deltaSeconds, 0), 1 / 20);
    if (safeDt <= 0) return;
    const subSteps = Math.max(1, Math.round(growthSpeed * 2));
    const dt = (safeDt * growthSpeed) / subSteps;
    for (let s = 0; s < subSteps; s += 1) {
      this.maybeSplitLongSegments();
      this.integrate(dt, seedInfluence);
      this.applyCurveSmoothing(
        Math.max(1, Math.round(1 + this.settings.smoothing * 3)),
        this.settings.smoothing * 0.34
      );
    }
    this.updateScalarFields();
  }

  integrate(dt, seedInfluence) {
    const { settings } = this;
    const influence = clamp(seedInfluence, 0, 1);
    const dynamicNoise = 0.06 * influence;
    const staticVariation = 0.9 * influence;
    const sideBias = clamp(settings.sideBias / 100, -1, 1);
    const preferredSideSign = sideBias >= 0 ? 1 : -1;
    const biasMix = Math.abs(sideBias);
    const push = this.curves.map(
      (curve) => new Float64Array(curve.points.length * 3)
    );
    const delta = this.curves.map(
      (curve) => new Float64Array(curve.points.length * 3)
    );

    this.curves.forEach((curve, c) => {
      const { points } = curve;
      const count = points.length;
      const d = delta[c];
      const g = push[c];

      for (let i = 0; i < count; i += 1) {
        const current = points[i];
        const pi = this.previousIndex(curve, i);
        const ni = this.nextIndex(curve, i);
        const prev = pi >= 0 ? points[pi] : current;
        const next = ni >= 0 ? points[ni] : current;
        const curvature =
          Math.hypot(
            (prev.x + next.x) * 0.5 - current.x,
            (prev.y + next.y) * 0.5 - current.y,
            (prev.z + next.z) * 0.5 - current.z
          ) / Math.max(settings.targetEdgeLength, 1e-6);

        const normal = curveNormal(points, curve.normals, i, curve.closed);
        // The reference measures a point's side from where it sits on the
        // drawn path. Here every path point descends from a tiny seed loop at
        // the jaw, so that is meaningless away from it; instead each point
        // carries its own drift since birth (`current.o`) and grows toward the
        // side it has already moved to, which is the same buckle-amplifying
        // rule measured locally. Growth runs along the local curve normal.
        const drift = current.o ?? vec();
        const signedMedianOffset =
          drift.x * normal.x + drift.y * normal.y + drift.z * normal.z;
        const medianBand = Math.max(settings.targetEdgeLength * 0.02, 1e-5);
        let sideSign = Math.sign(signedMedianOffset);
        if (Math.abs(signedMedianOffset) <= medianBand) {
          sideSign = curve.variation[i] >= 0 ? 1 : -1;
        }
        const gx = normal.x;
        const gy = normal.y;
        const gz = normal.z;
        const mobility = 1 - clamp(curve.mask[i], 0, 1);
        const jitter = this.rng.signed() * dynamicNoise;
        const seeded = Math.max(0.12, 1 + curve.variation[i] * staticVariation);
        const growth = Math.max(
          0,
          settings.growthStep *
            dt *
            mobility *
            (0.58 + curvature * 0.92 + jitter) *
            seeded
        );
        const direction =
          sideSign * (1 - biasMix) + preferredSideSign * biasMix;
        g[i * 3] += gx * growth * direction;
        g[i * 3 + 1] += gy * growth * direction;
        g[i * 3 + 2] += gz * growth * direction;
      }

      const limit = curve.closed ? count : count - 1;
      for (let i = 0; i < limit; i += 1) {
        const n = (i + 1) % count;
        const a = points[i];
        const b = points[n];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length <= 1e-6) continue;
        const correction = (length - settings.targetEdgeLength) * 0.52 * dt;
        d[i * 3] += (dx / length) * correction;
        d[i * 3 + 1] += (dy / length) * correction;
        d[i * 3 + 2] += (dz / length) * correction;
        d[n * 3] -= (dx / length) * correction;
        d[n * 3 + 1] -= (dy / length) * correction;
        d[n * 3 + 2] -= (dz / length) * correction;
      }

      const retention = settings.shapeRetention * 0.18 * dt;
      if (retention > 0) {
        for (let i = 0; i < count; i += 1) {
          d[i * 3] += (curve.basePoints[i].x - points[i].x) * retention;
          d[i * 3 + 1] += (curve.basePoints[i].y - points[i].y) * retention;
          d[i * 3 + 2] += (curve.basePoints[i].z - points[i].z) * retention;
        }
      }
    });

    applyRepulsion(this, delta, dt);

    const maxDisplacement = settings.targetEdgeLength * 0.24;
    this.curves.forEach((curve, c) => {
      const d = delta[c];
      const g = push[c];
      curve.points.forEach((p, i) => {
        // On a surface a move has no business leaving it: forces from across
        // a fold (under the chin, behind a cheekbone) would push points off,
        // and the projection back would then be a guess.
        const n = curve.normals[i];
        [d, g].forEach((v) => {
          const along =
            v[i * 3] * n.x + v[i * 3 + 1] * n.y + v[i * 3 + 2] * n.z;
          v[i * 3] -= n.x * along;
          v[i * 3 + 1] -= n.y * along;
          v[i * 3 + 2] -= n.z * along;
        });
        // The reference's 1/d^2 repulsion is stiffer than its step: points
        // overshoot and bounce back every step, pinned at the displacement
        // cap (measured: ~95% reverse each step), which reads as jitter. The
        // forces (springs, retention, repulsion) are damped per point: a
        // point whose force reverses has its share halved, one whose force
        // holds regains it. Growth is the steady push and is left alone.
        const fx = d[i * 3];
        const fy = d[i * 3 + 1];
        const fz = d[i * 3 + 2];
        const reversed = p.fx * fx + p.fy * fy + p.fz * fz < 0;
        p.gain = Math.min(
          Math.max((p.gain ?? 1) * (reversed ? 0.5 : 1.2), MIN_GAIN),
          1
        );
        p.fx = fx;
        p.fy = fy;
        p.fz = fz;
        const mx = g[i * 3] + fx * p.gain;
        const my = g[i * 3 + 1] + fy * p.gain;
        const mz = g[i * 3 + 2] + fz * p.gain;
        const length = Math.hypot(mx, my, mz);
        const scale =
          length > maxDisplacement && length > 1e-6
            ? maxDisplacement / length
            : 1;
        const before = copy(p);
        p.x += mx * scale;
        p.y += my * scale;
        p.z += mz * scale;
        this.project(p, curve.normals[i]);
        p.o = p.o ?? vec();
        p.o.x += p.x - before.x;
        p.o.y += p.y - before.y;
        p.o.z += p.z - before.z;
      });
    });
  }

  applyCurveSmoothing(iterations, amount) {
    const blend = clamp(amount, 0, 0.45);
    if (iterations <= 0 || blend <= 0) return;
    this.curves.forEach((curve) => {
      if (curve.points.length < 2) return;
      const work = curve.points.map(copy);
      for (let pass = 0; pass < iterations; pass += 1) {
        curve.points.forEach((p, i) => {
          const prev = this.previousIndex(curve, i);
          const next = this.nextIndex(curve, i);
          let ax = p.x;
          let ay = p.y;
          let az = p.z;
          let n = 1;
          [prev, next].forEach((k) => {
            if (k >= 0) {
              ax += curve.points[k].x;
              ay += curve.points[k].y;
              az += curve.points[k].z;
              n += 1;
            }
          });
          const local = blend * (1 - clamp(curve.mask[i], 0, 1));
          work[i].x = p.x + (ax / n - p.x) * local;
          work[i].y = p.y + (ay / n - p.y) * local;
          work[i].z = p.z + (az / n - p.z) * local;
        });
        curve.points.forEach((p, i) => {
          p.x = work[i].x;
          p.y = work[i].y;
          p.z = work[i].z;
          this.project(p, curve.normals[i]);
        });
      }
    });
  }

  // The reference splices each midpoint in, which is quadratic once a step
  // splits thousands of segments; this rebuilds each curve in one pass with
  // the same midpoints, still stopping at the vertex cap.
  maybeSplitLongSegments() {
    const { settings } = this;
    const splitLength = settings.targetEdgeLength * settings.splitThreshold;
    if (splitLength <= 1e-6) return;
    const mid = (a, b) =>
      vec((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, (a.z + b.z) * 0.5);
    let total = this.getTotalPointCount();

    for (let pass = 0, didSplit = true; didSplit && pass < 2; pass += 1) {
      didSplit = false;
      for (let c = 0; c < this.curves.length; c += 1) {
        const curve = this.curves[c];
        const count = curve.points.length;
        const out = {
          basePoints: [],
          baseNormals: [],
          mask: [],
          normals: [],
          points: [],
          variation: [],
        };
        for (let i = 0; i < count; i += 1) {
          out.points.push(curve.points[i]);
          out.normals.push(curve.normals[i]);
          out.basePoints.push(curve.basePoints[i]);
          out.baseNormals.push(curve.baseNormals[i]);
          out.mask.push(curve.mask[i]);
          out.variation.push(curve.variation[i]);

          const n = i + 1 < count ? i + 1 : 0;
          if ((curve.closed || i + 1 < count) && total < settings.maxVertices) {
            const a = curve.points[i];
            const b = curve.points[n];
            const length = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
            // An edge this long spans a hole in the surface (an orbit, the
            // nasal aperture): its midpoint snaps back to a rim, so splitting
            // it only piles points there, pass after pass.
            if (length > splitLength && length < splitLength * BRIDGE) {
              const point = mid(a, b);
              point.o = mid(a.o ?? vec(), b.o ?? vec());
              const normal = mid(curve.normals[i], curve.normals[n]);
              normal.t = curve.normals[i].t;
              this.project(point, normal);
              out.points.push(point);
              out.normals.push(normal);
              out.basePoints.push(
                mid(curve.basePoints[i], curve.basePoints[n])
              );
              out.baseNormals.push(
                mid(curve.baseNormals[i], curve.baseNormals[n])
              );
              out.mask.push((curve.mask[i] + curve.mask[n]) * 0.5);
              out.variation.push(
                (curve.variation[i] + curve.variation[n]) * 0.5
              );
              total += 1;
              didSplit = true;
            }
          }
        }
        if (out.points.length !== count) {
          curve.points = out.points;
          curve.normals = out.normals;
          curve.basePoints = out.basePoints;
          curve.baseNormals = out.baseNormals;
          curve.mask = Float32Array.from(out.mask);
          curve.variation = Float32Array.from(out.variation);
          curve.curvature = new Float32Array(out.points.length);
          curve.displacement = new Float32Array(out.points.length);
        }
      }
    }
  }

  updateScalarFields() {
    let minCurvature = Infinity;
    let maxCurvature = -Infinity;
    let maxDisplacement = 0;
    this.curves.forEach((curve) => {
      curve.points.forEach((p, i) => {
        const prev = this.previousIndex(curve, i);
        const next = this.nextIndex(curve, i);
        let curvature = 0;
        if (prev >= 0 && next >= 0) {
          const a = curve.points[prev];
          const b = curve.points[next];
          curvature = Math.hypot(
            (a.x + b.x) * 0.5 - p.x,
            (a.y + b.y) * 0.5 - p.y,
            (a.z + b.z) * 0.5 - p.z
          );
        }
        curve.curvature[i] = curvature;
        minCurvature = Math.min(minCurvature, curvature);
        maxCurvature = Math.max(maxCurvature, curvature);
        const base = curve.basePoints[i];
        const displacement = Math.hypot(
          p.x - base.x,
          p.y - base.y,
          p.z - base.z
        );
        curve.displacement[i] = displacement;
        maxDisplacement = Math.max(maxDisplacement, displacement);
      });
    });

    const invSpan = 1 / Math.max(maxCurvature - minCurvature, 1e-6);
    const invDisplacement = maxDisplacement > 1e-8 ? 1 / maxDisplacement : 0;
    this.curves.forEach((curve) => {
      for (let i = 0; i < curve.points.length; i += 1) {
        curve.curvature[i] = clamp(
          (curve.curvature[i] - minCurvature) * invSpan,
          0,
          1
        );
        curve.displacement[i] =
          invDisplacement > 0
            ? clamp(curve.displacement[i] * invDisplacement, 0, 1)
            : 0;
      }
      this.blurScalarCurve(curve.curvature, curve.closed);
      this.blurScalarCurve(curve.displacement, curve.closed);
      renormalize(curve.curvature);
      renormalize(curve.displacement);
    });
  }

  blurScalarCurve(values, closed) {
    const amount = clamp(this.gradientBlur * 0.42, 0, 0.42);
    if (amount <= 0 || values.length <= 2) return;
    const passes = Math.max(1, Math.round(1 + this.gradientBlur * 5));
    const work = new Float32Array(values.length);
    for (let pass = 0; pass < passes; pass += 1) {
      for (let i = 0; i < values.length; i += 1) {
        let prev = i > 0 ? i - 1 : -1;
        let next = i < values.length - 1 ? i + 1 : -1;
        if (closed) {
          prev = (i - 1 + values.length) % values.length;
          next = (i + 1) % values.length;
        }
        let sum = values[i];
        let count = 1;
        if (prev >= 0) {
          sum += values[prev];
          count += 1;
        }
        if (next >= 0) {
          sum += values[next];
          count += 1;
        }
        work[i] = values[i] + (sum / count - values[i]) * amount;
      }
      values.set(work);
    }
  }

  previousIndex(curve, index) {
    if (curve.closed)
      return (index - 1 + curve.points.length) % curve.points.length;
    return index > 0 ? index - 1 : -1;
  }

  nextIndex(curve, index) {
    if (curve.closed) return (index + 1) % curve.points.length;
    return index < curve.points.length - 1 ? index + 1 : -1;
  }

  areAdjacent(curveA, indexA, curveB, indexB) {
    if (curveA !== curveB) return false;
    if (Math.abs(indexA - indexB) === 1) return true;
    if (curveA.closed) {
      const count = curveA.points.length;
      return (
        (indexA === 0 && indexB === count - 1) ||
        (indexB === 0 && indexA === count - 1)
      );
    }
    return false;
  }
}
