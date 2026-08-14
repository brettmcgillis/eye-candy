import {
  TERM_COUNT,
  integrate,
  isBounded,
  minSpreadFor,
} from './odeIntegrator';

// A cheap single-point pre-filter, not the authoritative check — that's
// testGenerator.js's allRealStrandsBounded, which integrates every actual
// strand at full length. This just needs to weed out obviously-bad
// candidates before paying for that, so it caps its own probe length rather
// than scaling all the way up with a user-cranked `steps` control.
const PROBE_STEPS_CAP = 150;
const PROBE_DT = 0.02;
const MAX_ATTEMPTS = 30;
const TERM_INCLUDE_CHANCE = 0.55;

const probeOut = new Float32Array(PROBE_STEPS_CAP * 3);

function randomAxisCoeffs(rng, coeffRange) {
  const coeffs = new Array(TERM_COUNT).fill(0);
  for (let i = 0; i < TERM_COUNT; i += 1) {
    if (rng() < TERM_INCLUDE_CHANCE) {
      coeffs[i] = (rng() * 2 - 1) * coeffRange;
    }
  }
  return coeffs;
}

function randomCoeffs(rng, coeffRange) {
  return {
    dx: randomAxisCoeffs(rng, coeffRange),
    dy: randomAxisCoeffs(rng, coeffRange),
    dz: randomAxisCoeffs(rng, coeffRange),
  };
}

// Purely random quadratic-ODE coefficients diverge or collapse to a fixed
// point almost every time — this probes each candidate with a full-length
// integration from the bundle's own origin and rejects it before it's used,
// the way Sprott-style chaotic-flow searches do. `probeStart` must be the
// same point real strands will actually start near (testGenerator.js's
// bundle origin) — a field that's bounded near one point can still escape to
// infinity from another, so validating from a disconnected fixed point
// doesn't actually vouch for the strands that get built from it.
//
// `coeffRange` is the "chaos amount" control: larger coefficients make the
// field more strongly nonlinear (more curling, looping trajectories) but
// also more likely to diverge — rejection sampling filters out the ones that
// do. Falls back to the last (rejected) candidate after MAX_ATTEMPTS rather
// than looping forever — rare, and odeIntegrator's freeze-on-divergence
// keeps it safe to render even then, just less likely to be visually
// striking.
export default function findBoundedCoeffs(
  rng,
  probeStart,
  coeffRange,
  steps,
  freq,
  bounds
) {
  const probeSteps = Math.min(steps, PROBE_STEPS_CAP);
  // probeOut is a fixed-capacity buffer reused across every call; when
  // probeSteps < PROBE_STEPS_CAP only the prefix gets (re)written, so
  // isBounded must be scoped to that prefix or it'll also see stale trailing
  // data left over from a previous bundle's (possibly larger) probe.
  const probeView = probeOut.subarray(0, probeSteps * 3);
  const minSpread = minSpreadFor(bounds);
  let candidate = randomCoeffs(rng, coeffRange);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    integrate(
      candidate,
      probeStart,
      probeSteps,
      PROBE_DT,
      freq,
      bounds,
      probeOut
    );
    if (isBounded(probeView, bounds, minSpread)) {
      return candidate;
    }
    candidate = randomCoeffs(rng, coeffRange);
  }
  return candidate;
}
