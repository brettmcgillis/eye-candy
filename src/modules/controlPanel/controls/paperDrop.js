// Paper on a panel that moves has no floor to pile on: printers bound with
// `drop` tear their paper off and let it fall out of frame (culled CULL
// cells down). The tallest controls stand about 1.3 cells proud, so paper
// that reaches below its own module's foot must get clear of them: the
// strip's path bends out from the panel over RUN cells there (tilting up to
// TILT from the vertical, then back) and hangs on straight, and a torn
// sheet drifts OUT cells away as it falls. Both move the page as one piece,
// row against row.
export const DROP_GRAVITY = 9;
const STEP = 0.02;
const TILT = 1.1;
const RUN = 1.5;
const OUT = 1.6;
const CULL = 14;

const smooth = (x) => x * x * (3 - 2 * x);

// A strip's path from its slit, `s` along it: how far down and out it has
// gone and its angle `phi` below the horizontal. `phiOf` is the printer's
// own droop; `slitY` and `foot` are in its coordinates, `scale` its
// transform's. Past `length` it carries on straight.
export function createDropPath({ foot, length, phiOf, scale, slitY }) {
  const run = RUN / scale;
  const n = Math.ceil(length / STEP);
  const down = [0];
  const out = [0];
  const phi = [phiOf(0)];
  for (let i = 1; i <= n; i += 1) {
    const d = foot - (slitY - down[i - 1]);
    const tilt = d > 0 && d < run ? TILT * Math.sin((Math.PI * d) / run) : 0;
    const p = phiOf((i - 0.5) * STEP) - tilt;
    down.push(down[i - 1] + Math.sin(p) * STEP);
    out.push(out[i - 1] + Math.cos(p) * STEP);
    phi.push(p);
  }
  const read = (table, s, extend) => {
    if (s >= n * STEP) return table[n] + extend * (s - n * STEP);
    const x = Math.max(s, 0) / STEP;
    const i = Math.min(Math.floor(x), n - 1);
    return table[i] + (table[i + 1] - table[i]) * (x - i);
  };
  return {
    down: (s) => read(down, s, 1),
    out: (s) => read(out, s, 0),
    phi: (s) => read(phi, s, 0),
  };
}

// How far a sheet torn `tau` seconds ago has fallen, in a printer's own
// coordinates; null once it is past the cull.
export function dropped(tau, scale) {
  const fall = (0.5 * DROP_GRAVITY * Math.max(tau, 0) ** 2) / scale;
  return fall > CULL / scale ? null : fall;
}

// How far a sheet that has fallen `fall` has drifted out from the panel.
export const drift = (fall, scale) =>
  (OUT / scale) * smooth(Math.min((fall * scale) / RUN, 1));
