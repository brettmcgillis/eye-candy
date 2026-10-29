import {
  EMBER_STATE_PARAMS,
  emberGlow,
  flameSignal,
  isLit,
  smokeAmount,
} from '@modules/candle';

const SNUFF_SECONDS = 0.45;

// The stage's one clock and the flame signal every system reads from it:
// the sim, the lights, the wax glow, the wick ember and the smoke emitter.
// `snuffAt` (seconds) puts a lit candle out mid-shot.
export default function createDriver() {
  const drive = {
    clock: 0,
    config: null,
    delta: 0,
    ember: 1,
    lit: 1,
    signal: { emit: 1, light: 1, sway: [0, 0], wind: [0, 0] },
    smoke: 0,
    snuffAt: null,
    t: 0,
  };

  drive.reset = (config, snuffAt = null) => {
    Object.assign(drive, { clock: 0, config, delta: 0, snuffAt, t: 0 });
    drive.update();
  };

  drive.update = () => {
    const { config, snuffAt, t } = drive;
    if (!config) return;
    let lit = isLit(config) ? 1 : 0;
    if (lit && snuffAt != null && t > snuffAt) {
      lit = Math.max(0, 1 - (t - snuffAt) / SNUFF_SECONDS);
    }
    const { snuffed } = EMBER_STATE_PARAMS;
    drive.lit = lit;
    drive.signal = flameSignal(config, t);
    drive.smoke =
      snuffAt != null && isLit(config)
        ? smokeAmount(config) * lit + snuffed.smoke * (1 - lit)
        : smokeAmount(config);
    drive.ember =
      snuffAt != null && isLit(config)
        ? lit + snuffed.ember * (1 - lit)
        : emberGlow(config);
  };

  // `delta` is how far the stage moves this frame: the frame's own time,
  // or for clay a whole pose every 1/fps seconds and nothing between.
  drive.advance = (delta) => {
    const step = Math.min(Math.max(delta, 0), 1 / 15);
    drive.clock += step;
    const fps = drive.config?.look === 'clay' ? (drive.config.clayFps ?? 0) : 0;
    const t = fps > 0 ? Math.floor(drive.clock * fps) / fps : drive.clock;
    drive.delta = t - drive.t;
    drive.t = t;
    drive.update();
  };

  return drive;
}
