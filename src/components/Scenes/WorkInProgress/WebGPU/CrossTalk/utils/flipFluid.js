// PIC/FLIP fluid solver, ported from Matthias Müller's "Ten Minute Physics"
// reference (MIT License, Copyright 2022 Matthias Müller —
// youtube.com/c/TenMinutePhysics — see references/flip.html in this folder
// for the original single-file demo this was ported from).
//
// Trimmed from the original: no draggable obstacle, no cell/particle color
// fields, no rendering — this scene has neither, and confineToMask
// (fluidWorld.js) replaces the original's obstacle/wall collision entirely
// (solid cells here come from covered browser-window rects, not a fixed
// rectangular tank).
//
// The diffuse whitewater layer (foam / spray / bubbles) is ported from the
// pic_flip / hybrid_flip 2D sims (examples/fluid/src/flip/2d/*), themselves
// modeled on GridFluidSim3D's diffuse-particle model: liquid particles in
// energetic regions (fast, turbulent, or on a sharp wavecrest) spawn diffuse
// particles that are typed every frame by the cell they sit in — submerged
// = bubble (buoyant, drags with the field), at the surface = foam (advects
// with the field), airborne = spray (ballistic, no grid coupling). In this
// scene "airborne" includes uncovered screen cells, so foam that leaves a
// window turns to spray and free-falls across the gap into the tab below.
//
// `continue` is used throughout in the original's exact hot-path style
// (tight nested loops over every cell/particle every frame) rather than
// restructured into early-return helpers, to keep this a faithful,
// diff-able port instead of a rewrite.
/* eslint-disable no-continue */

const AIR_CELL = 1;
const SOLID_CELL = 2;
const FLUID_CELL = 0;

export const DIFFUSE_BUBBLE = 0;
export const DIFFUSE_FOAM = 1;
export const DIFFUSE_SPRAY = 2;

// Emission-potential weights and per-type spawn scales, straight from the
// reference sims' defaults. Not worth Leva sliders — emission rate / min
// speed / lifetime are the knobs that actually shape the look.
const WEIGHT_KINETIC = 0.3;
const WEIGHT_TURBULENCE = 0.5;
const WEIGHT_WAVECREST = 0.8;
const BUBBLE_EMISSION_SCALE = 0.5;
const FOAM_EMISSION_SCALE = 1.0;
const SPRAY_EMISSION_SCALE = 1.0;

// The reference sims work in ~metre-scale world units; this scene's world
// units are screen pixels (gravity 1800 px/s² ≈ 9.8 m/s² implies ~180 px per
// "metre"), so the speed-based normalizations scale by that factor.
// Vorticity is 1/s in either unit system and keeps the reference constant.
const KINETIC_SPEED_RANGE = 900; // px/s ≈ reference's 5 m/s
const SPRAY_DOT_THRESHOLD = 180; // px/s ≈ reference's 1 m/s
const VORTICITY_NORM = 20;

// Soft diffuse-diffuse repulsion (anti-clumping) and the per-cell survivor
// cap used when compacting dead particles, both reference defaults.
const DIFFUSE_REPULSION_STRENGTH = 0.1;
const MAX_DIFFUSE_PER_CELL = 60;

function clamp(x, min, max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

export default class FlipFluid {
  constructor(density, width, height, spacing, particleRadius, maxParticles) {
    this.density = density;
    this.fNumX = Math.floor(width / spacing) + 1;
    this.fNumY = Math.floor(height / spacing) + 1;
    this.h = Math.max(width / this.fNumX, height / this.fNumY);
    this.fInvSpacing = 1.0 / this.h;
    this.fNumCells = this.fNumX * this.fNumY;

    this.u = new Float32Array(this.fNumCells);
    this.v = new Float32Array(this.fNumCells);
    this.du = new Float32Array(this.fNumCells);
    this.dv = new Float32Array(this.fNumCells);
    this.prevU = new Float32Array(this.fNumCells);
    this.prevV = new Float32Array(this.fNumCells);
    this.p = new Float32Array(this.fNumCells);
    // Solid mask: 1 = fluid-capable (covered by a window), 0 = solid
    // (outside every window). Recomputed every frame from live window rects.
    this.s = new Float32Array(this.fNumCells);
    this.cellType = new Int32Array(this.fNumCells);

    this.maxParticles = maxParticles;
    this.particlePos = new Float32Array(2 * maxParticles);
    this.particleVel = new Float32Array(2 * maxParticles);
    this.particleDensity = new Float32Array(this.fNumCells);
    this.particleRestDensity = 0.0;

    this.particleRadius = particleRadius;
    this.pInvSpacing = 1.0 / (2.2 * particleRadius);
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
    this.pNumCells = this.pNumX * this.pNumY;

    this.numCellParticles = new Int32Array(this.pNumCells);
    this.firstCellParticle = new Int32Array(this.pNumCells + 1);
    this.cellParticleIds = new Int32Array(maxParticles);

    this.numParticles = 0;

    // ── Diffuse whitewater particles ─────────────────────────────────────
    // Storage starts empty; setWhitewaterSettings (called once per frame by
    // the sim step) sizes it to the live Leva control value.
    this.vorticity = new Float32Array(this.fNumCells);
    this.maxDiffuseParticles = 0;
    this.numDiffuseParticles = 0;
    this.diffusePos = new Float32Array(0);
    this.diffuseVel = new Float32Array(0);
    this.diffuseLife = new Float32Array(0);
    this.diffuseType = new Int8Array(0);
    this.diffuseEmissionRate = 0;
    this.diffuseMinSpeed = 0;
    this.diffuseLifetime = 1;

    // Diffuse spatial hash (reuses the liquid hash's cell spacing) for the
    // anti-clumping repulsion pass, plus a persistent scratch grid for the
    // per-cell survivor cap in removeDeadDiffuseParticles — allocated once
    // here since fNumCells is fixed for this solver's lifetime.
    this.numCellDiffuse = new Int32Array(this.pNumCells);
    this.firstCellDiffuse = new Int32Array(this.pNumCells + 1);
    this.cellDiffuseIds = new Int32Array(0);
    this.diffuseCountGrid = new Int16Array(this.fNumCells);
  }

  integrateParticles(dt, gravityX, gravityY) {
    for (let i = 0; i < this.numParticles; i += 1) {
      this.particleVel[2 * i] += dt * gravityX;
      this.particleVel[2 * i + 1] += dt * gravityY;
      this.particlePos[2 * i] += this.particleVel[2 * i] * dt;
      this.particlePos[2 * i + 1] += this.particleVel[2 * i + 1] * dt;
    }
  }

  pushParticlesApart(numIters) {
    this.numCellParticles.fill(0);

    for (let i = 0; i < this.numParticles; i += 1) {
      const x = this.particlePos[2 * i];
      const y = this.particlePos[2 * i + 1];
      const xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
      const yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
      this.numCellParticles[xi * this.pNumY + yi] += 1;
    }

    let first = 0;
    for (let i = 0; i < this.pNumCells; i += 1) {
      first += this.numCellParticles[i];
      this.firstCellParticle[i] = first;
    }
    this.firstCellParticle[this.pNumCells] = first;

    for (let i = 0; i < this.numParticles; i += 1) {
      const x = this.particlePos[2 * i];
      const y = this.particlePos[2 * i + 1];
      const xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
      const yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
      const cellNr = xi * this.pNumY + yi;
      this.firstCellParticle[cellNr] -= 1;
      this.cellParticleIds[this.firstCellParticle[cellNr]] = i;
    }

    const minDist = 2.0 * this.particleRadius;
    const minDist2 = minDist * minDist;

    for (let iter = 0; iter < numIters; iter += 1) {
      for (let i = 0; i < this.numParticles; i += 1) {
        const px = this.particlePos[2 * i];
        const py = this.particlePos[2 * i + 1];

        const pxi = Math.floor(px * this.pInvSpacing);
        const pyi = Math.floor(py * this.pInvSpacing);
        const x0 = Math.max(pxi - 1, 0);
        const y0 = Math.max(pyi - 1, 0);
        const x1 = Math.min(pxi + 1, this.pNumX - 1);
        const y1 = Math.min(pyi + 1, this.pNumY - 1);

        for (let xi = x0; xi <= x1; xi += 1) {
          for (let yi = y0; yi <= y1; yi += 1) {
            const cellNr = xi * this.pNumY + yi;
            const first0 = this.firstCellParticle[cellNr];
            const last = this.firstCellParticle[cellNr + 1];
            for (let j = first0; j < last; j += 1) {
              const id = this.cellParticleIds[j];
              if (id === i) continue;
              const qx = this.particlePos[2 * id];
              const qy = this.particlePos[2 * id + 1];

              let dx = qx - px;
              let dy = qy - py;
              const d2 = dx * dx + dy * dy;
              if (d2 > minDist2 || d2 === 0.0) continue;
              const d = Math.sqrt(d2);
              const s = (0.5 * (minDist - d)) / d;
              dx *= s;
              dy *= s;
              this.particlePos[2 * i] -= dx;
              this.particlePos[2 * i + 1] -= dy;
              this.particlePos[2 * id] += dx;
              this.particlePos[2 * id + 1] += dy;
            }
          }
        }
      }
    }
  }

  updateParticleDensity() {
    const n = this.fNumY;
    const { h } = this;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;
    const d = this.particleDensity;

    d.fill(0.0);

    for (let i = 0; i < this.numParticles; i += 1) {
      let x = this.particlePos[2 * i];
      let y = this.particlePos[2 * i + 1];

      x = clamp(x, h, (this.fNumX - 1) * h);
      y = clamp(y, h, (this.fNumY - 1) * h);

      const x0 = Math.floor((x - h2) * h1);
      const tx = (x - h2 - x0 * h) * h1;
      const x1 = Math.min(x0 + 1, this.fNumX - 2);

      const y0 = Math.floor((y - h2) * h1);
      const ty = (y - h2 - y0 * h) * h1;
      const y1 = Math.min(y0 + 1, this.fNumY - 2);

      const sx = 1.0 - tx;
      const sy = 1.0 - ty;

      if (x0 < this.fNumX && y0 < this.fNumY) d[x0 * n + y0] += sx * sy;
      if (x1 < this.fNumX && y0 < this.fNumY) d[x1 * n + y0] += tx * sy;
      if (x1 < this.fNumX && y1 < this.fNumY) d[x1 * n + y1] += tx * ty;
      if (x0 < this.fNumX && y1 < this.fNumY) d[x0 * n + y1] += sx * ty;
    }

    if (this.particleRestDensity === 0.0) {
      let sum = 0.0;
      let numFluidCells = 0;
      for (let i = 0; i < this.fNumCells; i += 1) {
        if (this.cellType[i] === FLUID_CELL) {
          sum += d[i];
          numFluidCells += 1;
        }
      }
      if (numFluidCells > 0) this.particleRestDensity = sum / numFluidCells;
    }
  }

  transferVelocities(toGrid, flipRatio) {
    const n = this.fNumY;
    const { h } = this;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;

    if (toGrid) {
      this.prevU.set(this.u);
      this.prevV.set(this.v);
      this.du.fill(0.0);
      this.dv.fill(0.0);
      this.u.fill(0.0);
      this.v.fill(0.0);

      for (let i = 0; i < this.fNumCells; i += 1) {
        this.cellType[i] = this.s[i] === 0.0 ? SOLID_CELL : AIR_CELL;
      }

      for (let i = 0; i < this.numParticles; i += 1) {
        const x = this.particlePos[2 * i];
        const y = this.particlePos[2 * i + 1];
        const xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1);
        const yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1);
        const cellNr = xi * n + yi;
        if (this.cellType[cellNr] === AIR_CELL)
          this.cellType[cellNr] = FLUID_CELL;
      }
    }

    for (let component = 0; component < 2; component += 1) {
      const dx = component === 0 ? 0.0 : h2;
      const dy = component === 0 ? h2 : 0.0;

      const f = component === 0 ? this.u : this.v;
      const prevF = component === 0 ? this.prevU : this.prevV;
      const d = component === 0 ? this.du : this.dv;

      for (let i = 0; i < this.numParticles; i += 1) {
        let x = this.particlePos[2 * i];
        let y = this.particlePos[2 * i + 1];

        x = clamp(x, h, (this.fNumX - 1) * h);
        y = clamp(y, h, (this.fNumY - 1) * h);

        const x0 = Math.min(Math.floor((x - dx) * h1), this.fNumX - 2);
        const tx = (x - dx - x0 * h) * h1;
        const x1 = Math.min(x0 + 1, this.fNumX - 2);

        const y0 = Math.min(Math.floor((y - dy) * h1), this.fNumY - 2);
        const ty = (y - dy - y0 * h) * h1;
        const y1 = Math.min(y0 + 1, this.fNumY - 2);

        const sx = 1.0 - tx;
        const sy = 1.0 - ty;

        const d0 = sx * sy;
        const d1 = tx * sy;
        const d2 = tx * ty;
        const d3 = sx * ty;

        const nr0 = x0 * n + y0;
        const nr1 = x1 * n + y0;
        const nr2 = x1 * n + y1;
        const nr3 = x0 * n + y1;

        if (toGrid) {
          const pv = this.particleVel[2 * i + component];
          f[nr0] += pv * d0;
          d[nr0] += d0;
          f[nr1] += pv * d1;
          d[nr1] += d1;
          f[nr2] += pv * d2;
          d[nr2] += d2;
          f[nr3] += pv * d3;
          d[nr3] += d3;
        } else {
          const offset = component === 0 ? n : 1;
          const valid0 =
            this.cellType[nr0] !== AIR_CELL ||
            this.cellType[nr0 - offset] !== AIR_CELL
              ? 1.0
              : 0.0;
          const valid1 =
            this.cellType[nr1] !== AIR_CELL ||
            this.cellType[nr1 - offset] !== AIR_CELL
              ? 1.0
              : 0.0;
          const valid2 =
            this.cellType[nr2] !== AIR_CELL ||
            this.cellType[nr2 - offset] !== AIR_CELL
              ? 1.0
              : 0.0;
          const valid3 =
            this.cellType[nr3] !== AIR_CELL ||
            this.cellType[nr3 - offset] !== AIR_CELL
              ? 1.0
              : 0.0;

          const v = this.particleVel[2 * i + component];
          const dSum = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3;

          if (dSum > 0.0) {
            const picV =
              (valid0 * d0 * f[nr0] +
                valid1 * d1 * f[nr1] +
                valid2 * d2 * f[nr2] +
                valid3 * d3 * f[nr3]) /
              dSum;
            const corr =
              (valid0 * d0 * (f[nr0] - prevF[nr0]) +
                valid1 * d1 * (f[nr1] - prevF[nr1]) +
                valid2 * d2 * (f[nr2] - prevF[nr2]) +
                valid3 * d3 * (f[nr3] - prevF[nr3])) /
              dSum;
            const flipV = v + corr;

            this.particleVel[2 * i + component] =
              (1.0 - flipRatio) * picV + flipRatio * flipV;
          }
        }
      }

      if (toGrid) {
        for (let i = 0; i < f.length; i += 1) {
          if (d[i] > 0.0) f[i] /= d[i];
        }

        for (let i = 0; i < this.fNumX; i += 1) {
          for (let j = 0; j < this.fNumY; j += 1) {
            const solid = this.cellType[i * n + j] === SOLID_CELL;
            if (
              solid ||
              (i > 0 && this.cellType[(i - 1) * n + j] === SOLID_CELL)
            ) {
              this.u[i * n + j] = this.prevU[i * n + j];
            }
            if (
              solid ||
              (j > 0 && this.cellType[i * n + j - 1] === SOLID_CELL)
            ) {
              this.v[i * n + j] = this.prevV[i * n + j];
            }
          }
        }
      }
    }
  }

  solveIncompressibility(numIters, dt, overRelaxation, compensateDrift) {
    this.p.fill(0.0);
    this.prevU.set(this.u);
    this.prevV.set(this.v);

    const n = this.fNumY;
    const cp = (this.density * this.h) / dt;

    for (let iter = 0; iter < numIters; iter += 1) {
      for (let i = 1; i < this.fNumX - 1; i += 1) {
        for (let j = 1; j < this.fNumY - 1; j += 1) {
          if (this.cellType[i * n + j] !== FLUID_CELL) continue;

          const center = i * n + j;
          const left = (i - 1) * n + j;
          const right = (i + 1) * n + j;
          const bottom = i * n + j - 1;
          const top = i * n + j + 1;

          const sx0 = this.s[left];
          const sx1 = this.s[right];
          const sy0 = this.s[bottom];
          const sy1 = this.s[top];
          const s = sx0 + sx1 + sy0 + sy1;
          if (s === 0.0) continue;

          let div =
            this.u[right] - this.u[center] + this.v[top] - this.v[center];

          if (this.particleRestDensity > 0.0 && compensateDrift) {
            const compression =
              this.particleDensity[i * n + j] - this.particleRestDensity;
            if (compression > 0.0) div -= compression;
          }

          let p = -div / s;
          p *= overRelaxation;
          this.p[center] += cp * p;

          this.u[center] -= sx0 * p;
          this.u[right] += sx1 * p;
          this.v[center] -= sy0 * p;
          this.v[top] += sy1 * p;
        }
      }
    }
  }

  // ── Whitewater (diffuse foam / spray / bubble particles) ─────────────────

  setWhitewaterSettings(enabled, maxParticles, emissionRate, minSpeed, life) {
    const nextMax = Math.max(0, Math.floor(maxParticles));
    if (nextMax !== this.maxDiffuseParticles) {
      this.resizeDiffuseParticleStorage(nextMax);
    }
    this.diffuseEmissionRate = enabled ? Math.max(0, emissionRate) : 0;
    this.diffuseMinSpeed = Math.max(0, minSpeed);
    this.diffuseLifetime = Math.max(0.01, life);
  }

  resizeDiffuseParticleStorage(nextMax) {
    const keep = Math.min(this.numDiffuseParticles, nextMax);
    const nextPos = new Float32Array(2 * nextMax);
    const nextVel = new Float32Array(2 * nextMax);
    const nextLife = new Float32Array(nextMax);
    const nextType = new Int8Array(nextMax);
    nextPos.set(this.diffusePos.subarray(0, 2 * keep));
    nextVel.set(this.diffuseVel.subarray(0, 2 * keep));
    nextLife.set(this.diffuseLife.subarray(0, keep));
    nextType.set(this.diffuseType.subarray(0, keep));
    this.maxDiffuseParticles = nextMax;
    this.numDiffuseParticles = keep;
    this.diffusePos = nextPos;
    this.diffuseVel = nextVel;
    this.diffuseLife = nextLife;
    this.diffuseType = nextType;
    this.cellDiffuseIds = new Int32Array(nextMax);
  }

  // Cell-centered |curl u|, averaged from the four surrounding MAC-grid
  // corners where the discrete curl naturally lives. Drives the turbulence
  // emission potential.
  updateVorticity() {
    const n = this.fNumY;
    const h1 = this.fInvSpacing;
    this.vorticity.fill(0.0);

    for (let i = 1; i < this.fNumX - 1; i += 1) {
      for (let j = 1; j < this.fNumY - 1; j += 1) {
        let sum = 0.0;
        for (let ci = i; ci <= i + 1; ci += 1) {
          for (let cj = j; cj <= j + 1; cj += 1) {
            const dvdx = (this.v[ci * n + cj] - this.v[(ci - 1) * n + cj]) * h1;
            const dudy = (this.u[ci * n + cj] - this.u[ci * n + cj - 1]) * h1;
            sum += Math.abs(dvdx - dudy);
          }
        }
        this.vorticity[i * n + j] = 0.25 * sum;
      }
    }
  }

  // Bilinear grid-velocity sample at an arbitrary point, using the same
  // staggered offsets and valid-face gating as transferVelocities so air
  // cells' zero velocities never bleed into the result.
  sampleComponent(x, y, component) {
    const n = this.fNumY;
    const { h } = this;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;
    const dx = component === 0 ? 0.0 : h2;
    const dy = component === 0 ? h2 : 0.0;
    const f = component === 0 ? this.u : this.v;

    const cx = clamp(x, h, (this.fNumX - 1) * h);
    const cy = clamp(y, h, (this.fNumY - 1) * h);

    const x0 = Math.min(Math.floor((cx - dx) * h1), this.fNumX - 2);
    const tx = (cx - dx - x0 * h) * h1;
    const x1 = Math.min(x0 + 1, this.fNumX - 2);
    const y0 = Math.min(Math.floor((cy - dy) * h1), this.fNumY - 2);
    const ty = (cy - dy - y0 * h) * h1;
    const y1 = Math.min(y0 + 1, this.fNumY - 2);
    const sx = 1.0 - tx;
    const sy = 1.0 - ty;

    const nr0 = x0 * n + y0;
    const nr1 = x1 * n + y0;
    const nr2 = x1 * n + y1;
    const nr3 = x0 * n + y1;

    const offset = component === 0 ? n : 1;
    const valid0 =
      this.cellType[nr0] !== AIR_CELL ||
      this.cellType[nr0 - offset] !== AIR_CELL
        ? 1.0
        : 0.0;
    const valid1 =
      this.cellType[nr1] !== AIR_CELL ||
      this.cellType[nr1 - offset] !== AIR_CELL
        ? 1.0
        : 0.0;
    const valid2 =
      this.cellType[nr2] !== AIR_CELL ||
      this.cellType[nr2 - offset] !== AIR_CELL
        ? 1.0
        : 0.0;
    const valid3 =
      this.cellType[nr3] !== AIR_CELL ||
      this.cellType[nr3 - offset] !== AIR_CELL
        ? 1.0
        : 0.0;

    const d0 = sx * sy;
    const d1 = tx * sy;
    const d2 = tx * ty;
    const d3 = sx * ty;
    const dSum = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3;
    if (dSum === 0.0) return 0.0;

    return (
      (valid0 * d0 * f[nr0] +
        valid1 * d1 * f[nr1] +
        valid2 * d2 * f[nr2] +
        valid3 * d3 * f[nr3]) /
      dSum
    );
  }

  isNearAirCell(xi, yi) {
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const x = xi + ox;
        const y = yi + oy;
        if (x < 0 || x >= this.fNumX || y < 0 || y >= this.fNumY) continue;
        if (this.cellType[x * this.fNumY + y] === AIR_CELL) return true;
      }
    }
    return false;
  }

  hasFluidNeighbour(xi, yi) {
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const x = xi + ox;
        const y = yi + oy;
        if (x < 0 || x >= this.fNumX || y < 0 || y >= this.fNumY) continue;
        if (this.cellType[x * this.fNumY + y] === FLUID_CELL) return true;
      }
    }
    return false;
  }

  addDiffuseParticle(x, y, vx, vy, lifetime) {
    const i = this.numDiffuseParticles;
    this.numDiffuseParticles += 1;
    this.diffusePos[2 * i] = x;
    this.diffusePos[2 * i + 1] = y;
    this.diffuseVel[2 * i] = vx;
    this.diffuseVel[2 * i + 1] = vy;
    this.diffuseLife[i] = lifetime;
    this.diffuseType[i] = DIFFUSE_SPRAY;
  }

  // Spawn diffuse particles off energetic liquid particles. Emission
  // probability combines three potentials (kinetic energy, local vorticity,
  // wavecrest sharpness), scaled per spawn type. The wavecrest term reads
  // the liquid spatial hash built by pushParticlesApart — if particle
  // separation is disabled the hash is empty and that term degrades to 0.
  emitDiffuseParticles(dt) {
    if (this.diffuseEmissionRate <= 0 || this.maxDiffuseParticles === 0) return;
    const h1 = this.fInvSpacing;
    const searchRadius = 2.0 * this.particleRadius;

    for (
      let i = 0;
      i < this.numParticles &&
      this.numDiffuseParticles < this.maxDiffuseParticles;
      i += 1
    ) {
      const vx = this.particleVel[2 * i];
      const vy = this.particleVel[2 * i + 1];
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed < this.diffuseMinSpeed) continue;

      const x = this.particlePos[2 * i];
      const y = this.particlePos[2 * i + 1];
      const xi = clamp(Math.floor(x * h1), 1, this.fNumX - 2);
      const yi = clamp(Math.floor(y * h1), 1, this.fNumY - 2);
      const cell = xi * this.fNumY + yi;
      const nearAir = this.isNearAirCell(xi, yi);

      const energyPotential = Math.min(
        1.0,
        (speed - this.diffuseMinSpeed) / KINETIC_SPEED_RANGE
      );
      const turbulencePotential = Math.min(
        1.0,
        this.vorticity[cell] / VORTICITY_NORM
      );

      // Wavecrest sharpness: how one-sided the local particle neighborhood
      // is (surface particles have all neighbors to one side), gated on the
      // particle moving outward through that surface.
      let avgX = 0;
      let avgY = 0;
      let neighborCount = 0;
      const pxi = Math.floor(x * this.pInvSpacing);
      const pyi = Math.floor(y * this.pInvSpacing);
      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const cxi = clamp(pxi + ox, 0, this.pNumX - 1);
          const cyi = clamp(pyi + oy, 0, this.pNumY - 1);
          const cellNr = cxi * this.pNumY + cyi;
          for (
            let k = this.firstCellParticle[cellNr];
            k < this.firstCellParticle[cellNr + 1];
            k += 1
          ) {
            const id = this.cellParticleIds[k];
            const ndx = this.particlePos[2 * id] - x;
            const ndy = this.particlePos[2 * id + 1] - y;
            if (ndx * ndx + ndy * ndy < searchRadius * searchRadius) {
              avgX += ndx;
              avgY += ndy;
              neighborCount += 1;
            }
          }
        }
      }
      const dx = avgX / Math.max(1, neighborCount);
      const dy = avgY / Math.max(1, neighborCount);
      const d = Math.sqrt(dx * dx + dy * dy);
      const normalX = -dx / Math.max(0.001, d);
      const normalY = -dy / Math.max(0.001, d);
      const sharpness = Math.min(1.0, d / this.particleRadius);
      const dot = vx * normalX + vy * normalY;
      const wavecrestPotential = nearAir && dot > 0 ? sharpness : 0.0;

      const combined =
        WEIGHT_KINETIC * energyPotential +
        WEIGHT_TURBULENCE * turbulencePotential +
        WEIGHT_WAVECREST * wavecrestPotential;

      // Submerged spawns are bubbles; surface spawns moving fast outward are
      // spray, otherwise foam.
      let typeScale;
      if (!nearAir) {
        typeScale = BUBBLE_EMISSION_SCALE;
      } else {
        typeScale =
          dot > SPRAY_DOT_THRESHOLD
            ? SPRAY_EMISSION_SCALE
            : FOAM_EMISSION_SCALE;
      }

      const probability = Math.min(
        0.95,
        this.diffuseEmissionRate * dt * combined * typeScale
      );
      if (Math.random() > probability) continue;

      const r = this.particleRadius * Math.sqrt(Math.random());
      const theta = Math.random() * 2.0 * Math.PI;
      this.addDiffuseParticle(
        x + r * Math.cos(theta),
        y + r * Math.sin(theta),
        vx,
        vy,
        this.diffuseLifetime * (0.5 + 0.5 * Math.random())
      );
    }
  }

  // Retype every diffuse particle from the cell it currently occupies. In
  // this scene SOLID also means "uncovered screen", so whitewater that
  // leaves a window becomes spray and falls ballistically until it re-enters
  // covered space (or dies).
  updateDiffuseParticleTypes() {
    const h1 = this.fInvSpacing;
    for (let i = 0; i < this.numDiffuseParticles; i += 1) {
      const xi = clamp(
        Math.floor(this.diffusePos[2 * i] * h1),
        0,
        this.fNumX - 1
      );
      const yi = clamp(
        Math.floor(this.diffusePos[2 * i + 1] * h1),
        0,
        this.fNumY - 1
      );
      const cellType = this.cellType[xi * this.fNumY + yi];
      if (cellType === FLUID_CELL) {
        this.diffuseType[i] = DIFFUSE_BUBBLE;
      } else if (this.hasFluidNeighbour(xi, yi)) {
        this.diffuseType[i] = DIFFUSE_FOAM;
      } else {
        this.diffuseType[i] = DIFFUSE_SPRAY;
      }
    }
  }

  // Per-type motion. Life-decay modifiers match the reference (and
  // GridFluidSim3D): spray burns 2×, foam 1×, bubbles 0.333×. Unlike the
  // reference's rectangular tank, spray doesn't bounce off grid walls —
  // the grid boundary here is the margin outside every window, so anything
  // that reaches it just dies.
  advanceDiffuseParticles(dt, gravityX, gravityY, bubbleBuoyancy) {
    const minX = this.h;
    const maxX = (this.fNumX - 1) * this.h;
    const minY = this.h;
    const maxY = (this.fNumY - 1) * this.h;

    for (let i = 0; i < this.numDiffuseParticles; i += 1) {
      const type = this.diffuseType[i];
      let x = this.diffusePos[2 * i];
      let y = this.diffusePos[2 * i + 1];
      let vx = this.diffuseVel[2 * i];
      let vy = this.diffuseVel[2 * i + 1];

      if (type === DIFFUSE_SPRAY) {
        // Ballistic: gravity only, no grid coupling.
        vx += gravityX * dt;
        vy += gravityY * dt;
        this.diffuseLife[i] -= 2.0 * dt;
      } else if (type === DIFFUSE_BUBBLE) {
        // Snap to the local fluid velocity plus a buoyancy impulse opposite
        // gravity, so bubbles visibly rise through falling water.
        vx = this.sampleComponent(x, y, 0) - bubbleBuoyancy * gravityX * dt;
        vy = this.sampleComponent(x, y, 1) - bubbleBuoyancy * gravityY * dt;
        this.diffuseLife[i] -= 0.333 * dt;
      } else {
        // Foam: strong-but-finite drag toward the surface flow, with a
        // gravity make-up term so foam keeps pace with accelerating fluid.
        const gvx = this.sampleComponent(x, y, 0);
        const gvy = this.sampleComponent(x, y, 1);
        vx += (gvx - vx) * 0.5 + 0.5 * gravityX * dt;
        vy += (gvy - vy) * 0.5 + 0.5 * gravityY * dt;
        this.diffuseLife[i] -= dt;
      }

      x += vx * dt;
      y += vy * dt;

      if (x < minX || x > maxX || y < minY || y > maxY) {
        this.diffuseLife[i] = 0.0;
      }

      this.diffusePos[2 * i] = x;
      this.diffusePos[2 * i + 1] = y;
      this.diffuseVel[2 * i] = vx;
      this.diffuseVel[2 * i + 1] = vy;
    }
  }

  // Compact away dead particles, capping survivors per grid cell so a pile-up
  // in one corner can't hold thousands of invisible overlapping particles.
  removeDeadDiffuseParticles() {
    let dst = 0;
    const countGrid = this.diffuseCountGrid;
    countGrid.fill(0);
    for (let src = 0; src < this.numDiffuseParticles; src += 1) {
      if (this.diffuseLife[src] <= 0.0) continue;
      const xi = clamp(
        Math.floor(this.diffusePos[2 * src] * this.fInvSpacing),
        0,
        this.fNumX - 1
      );
      const yi = clamp(
        Math.floor(this.diffusePos[2 * src + 1] * this.fInvSpacing),
        0,
        this.fNumY - 1
      );
      const cell = xi * this.fNumY + yi;
      if (countGrid[cell] >= MAX_DIFFUSE_PER_CELL) continue;
      countGrid[cell] += 1;

      if (dst !== src) {
        this.diffusePos[2 * dst] = this.diffusePos[2 * src];
        this.diffusePos[2 * dst + 1] = this.diffusePos[2 * src + 1];
        this.diffuseVel[2 * dst] = this.diffuseVel[2 * src];
        this.diffuseVel[2 * dst + 1] = this.diffuseVel[2 * src + 1];
        this.diffuseLife[dst] = this.diffuseLife[src];
        this.diffuseType[dst] = this.diffuseType[src];
      }
      dst += 1;
    }
    this.numDiffuseParticles = dst;
  }

  // Soft anti-clumping repulsion between diffuse particles, so foam spreads
  // across the surface instead of stacking into bright dots. Same CSR hash
  // scheme as pushParticlesApart, but only pushes a `strength` fraction of
  // the penetration depth.
  pushDiffuseParticlesApart(numIters, strength) {
    if (this.numDiffuseParticles === 0 || strength <= 0) return;

    this.numCellDiffuse.fill(0);
    for (let i = 0; i < this.numDiffuseParticles; i += 1) {
      const xi = clamp(
        Math.floor(this.diffusePos[2 * i] * this.pInvSpacing),
        0,
        this.pNumX - 1
      );
      const yi = clamp(
        Math.floor(this.diffusePos[2 * i + 1] * this.pInvSpacing),
        0,
        this.pNumY - 1
      );
      this.numCellDiffuse[xi * this.pNumY + yi] += 1;
    }

    let first = 0;
    for (let i = 0; i < this.pNumCells; i += 1) {
      first += this.numCellDiffuse[i];
      this.firstCellDiffuse[i] = first;
    }
    this.firstCellDiffuse[this.pNumCells] = first;

    for (let i = 0; i < this.numDiffuseParticles; i += 1) {
      const xi = clamp(
        Math.floor(this.diffusePos[2 * i] * this.pInvSpacing),
        0,
        this.pNumX - 1
      );
      const yi = clamp(
        Math.floor(this.diffusePos[2 * i + 1] * this.pInvSpacing),
        0,
        this.pNumY - 1
      );
      const cellNr = xi * this.pNumY + yi;
      this.firstCellDiffuse[cellNr] -= 1;
      this.cellDiffuseIds[this.firstCellDiffuse[cellNr]] = i;
    }

    const minDist = this.particleRadius;
    const minDist2 = minDist * minDist;

    for (let iter = 0; iter < numIters; iter += 1) {
      for (let i = 0; i < this.numDiffuseParticles; i += 1) {
        const px = this.diffusePos[2 * i];
        const py = this.diffusePos[2 * i + 1];
        const pxi = Math.floor(px * this.pInvSpacing);
        const pyi = Math.floor(py * this.pInvSpacing);
        const x0 = Math.max(pxi - 1, 0);
        const y0 = Math.max(pyi - 1, 0);
        const x1 = Math.min(pxi + 1, this.pNumX - 1);
        const y1 = Math.min(pyi + 1, this.pNumY - 1);

        for (let xi = x0; xi <= x1; xi += 1) {
          for (let yi = y0; yi <= y1; yi += 1) {
            const cellNr = xi * this.pNumY + yi;
            for (
              let j = this.firstCellDiffuse[cellNr];
              j < this.firstCellDiffuse[cellNr + 1];
              j += 1
            ) {
              const id = this.cellDiffuseIds[j];
              if (id === i) continue;

              let dx = this.diffusePos[2 * id] - px;
              let dy = this.diffusePos[2 * id + 1] - py;
              const d2 = dx * dx + dy * dy;
              if (d2 > minDist2 || d2 === 0.0) continue;

              const d = Math.sqrt(d2);
              const s = (0.5 * strength * (minDist - d)) / d;
              dx *= s;
              dy *= s;
              this.diffusePos[2 * i] -= dx;
              this.diffusePos[2 * i + 1] -= dy;
              this.diffusePos[2 * id] += dx;
              this.diffusePos[2 * id + 1] += dy;
            }
          }
        }
      }
    }
  }

  // Per-frame whitewater step, called by useFluidSim after the liquid solve.
  // Advance-then-emit ordering matters: newborn particles must not be
  // integrated on their spawn frame or they visibly detach from the fluid.
  updateDiffuseParticles(dt, gravityX, gravityY, bubbleBuoyancy) {
    if (this.numDiffuseParticles > 0) {
      this.updateDiffuseParticleTypes();
      this.advanceDiffuseParticles(dt, gravityX, gravityY, bubbleBuoyancy);
      this.updateDiffuseParticleTypes();
      this.removeDeadDiffuseParticles();
    }
    this.emitDiffuseParticles(dt);
    this.pushDiffuseParticlesApart(1, DIFFUSE_REPULSION_STRENGTH);
  }
}
