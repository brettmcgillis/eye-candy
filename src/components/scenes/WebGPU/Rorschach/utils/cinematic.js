// The cinematic sweep's timing, kept apart from both the scene and the
// headless video script so the two can't drift: the camera orbits
// continuously, a system draws itself in over the near half of each
// revolution, flattens as the camera reaches the far side, and is replaced by
// a fresh roll as the camera passes behind. One system per half-revolution.

// The camera starts at -X, matching the todo's description of the shot.
const START_AZIMUTH = -Math.PI / 2;
// Fraction of a half-revolution spent growing. The remainder is the flatten,
// so a system is fully drawn well before the camera reaches the far side and
// has a beat to read as finished.
const GROWTH_FRACTION = 0.7;
// Where the flatten starts, as a fraction of the half-revolution. Overlaps the
// tail of growth deliberately — the squash reads better beginning while the
// last strands are still arriving than as a separate move afterwards.
const FLATTEN_START = 0.62;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export const SECONDS_PER_SYSTEM = 8;

// The Growth Speed that makes a system finish drawing exactly when the sweep
// expects it to. Derived rather than rolled or hand-set, because the whole
// point of the shot is that growth and rotation stay locked together.
export function growthSpeedFor(steps, secondsPerSystem, baseRate) {
  const window = GROWTH_FRACTION * (secondsPerSystem || SECONDS_PER_SYSTEM);
  return window > 0 ? steps / window / baseRate : 1;
}

// `elapsed` is seconds since the sweep started. Returns everything a frame
// needs: where the camera is, how much of the system has been drawn, how flat
// it is, and which system this is — the caller re-rolls whenever
// `systemIndex` changes.
export function cinematicState(elapsed, options = {}) {
  const { secondsPerSystem = SECONDS_PER_SYSTEM } = options;
  const period = secondsPerSystem > 0 ? secondsPerSystem : SECONDS_PER_SYSTEM;

  const systems = elapsed / period;
  const systemIndex = Math.floor(systems);
  const phase = systems - systemIndex;

  return {
    azimuth: START_AZIMUTH + systems * Math.PI,
    flatten: smoothstep((phase - FLATTEN_START) / (1 - FLATTEN_START)),
    growth: smoothstep(clamp01(phase / GROWTH_FRACTION)),
    phase,
    systemIndex,
  };
}

export default cinematicState;
