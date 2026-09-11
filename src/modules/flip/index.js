// Incompressible PIC/FLIP liquid solver on a staggered MAC grid, ported from
// https://github.com/jeantimex/fluid (src/flip/3d/webgpu_flip).
//
// Chosen over MLS-MPM for a specific reason: MPM is WEAKLY COMPRESSIBLE, with
// pressure as a stiff equation of state, so a pool under gravity compacts past
// its rest density and pushes back explosively. Every look problem in a pour
// traces back to that, and no amount of tuning removes it. FLIP enforces
// incompressibility properly, by solving a Poisson equation for pressure on the
// grid and subtracting its gradient so the velocity field comes out
// divergence-free. Measured: mean divergence residual falls from 1.85 before
// the solve to 0.18 after, and keeps falling with sweep count.
//
// That is also the sparse grid the reference visualisation is OF: Houdini's
// Axiom and Paradigm expose the adaptive grid their pressure solve runs on. The
// `marker` buffer here (air / fluid / solid) is the same classification, so a
// visualiser reads the solver's real state rather than re-deriving one.
//
// Scene specifics enter through hooks:
//   seed(index, vec, n)                     CPU, once
//   solid(cellCentre) -> vec4(normal, depth)  TSL, marks SOLID cells
//   collide({ position, velocity, index })    TSL, particle push-out
//   recycle({ position, velocity, extra, dt, index, phase })  TSL, emitters
//
// Everything lives in grid space, [0, gridSize] on every axis, so cells are
// unit-sized and the Poisson stencil needs no scaling.
export { default as FlipSimulator } from './FlipSimulator';
export { AIR, FLUID, SOLID } from './flipGrid';
