import buildPanel from './panel';
import { STILL_TIME } from './pose';
import { PANEL_KEYS, PATCH_KEYS, SEQUENCE_KEYS } from './renderOptions.mjs';
import createPanelSession from './session';
import createPanelShow, { fitPanel } from './shows';

const MAX_DELTA = 1 / 15;
// A new fit waits until the view has held still this long, so orbiting
// round a fitted panel doesn't rebuild it at every step.
const FIT_HOLD = 0.4;

const keyOf = (keys) => (c) => JSON.stringify(keys.map((key) => c[key]));
const panelKeyOf = keyOf([...PANEL_KEYS, ...SEQUENCE_KEYS]);
const patchKeyOf = keyOf(PATCH_KEYS);
const fitKeyOf = (fit) => (fit ? `${fit.panelCols}x${fit.panelRows}` : '');

// The scene's clock over the kernel: a changed layout or look rebuilds the
// panel (rising in when Build In is on), Operate runs the controls' clock,
// and a hand's settings hold until released or the panel itself changes;
// patch edits re-make only the cables. A Sequence hands the panel to a
// show (Swap, Scroll), which changes what is settled as the clock runs.
// `statics` comes back only when the fixed parts changed. `eager` settles a
// Scroll's cables in full as chunks mount rather than to a frame budget, so
// an offline render is the same every time.
export default function createPanelDriver({ eager = false } = {}) {
  let panel = null;
  let panelKey = null;
  let patchKey = null;
  let clock = STILL_TIME;
  let build = null;
  let replayed = 0;
  let released = 0;
  let building = false;
  let session = null;
  let show = null;
  let adopted = null;
  let fit = null;
  let pendingFit = null;
  let pendingFor = 0;

  // The fit the panel should have: adopted at once the first time, then
  // only once a different one has held for FIT_HOLD.
  function fitFor(c, view, dt) {
    const wanted =
      view && !c.panelDesign && c.fitView && c.sequence !== 'scroll'
        ? fitPanel(view)
        : null;
    if (!panel || fitKeyOf(wanted) === fitKeyOf(fit)) {
      fit = panel ? fit : wanted;
      pendingFit = null;
      return fit;
    }
    if (fitKeyOf(wanted) !== fitKeyOf(pendingFit)) {
      pendingFit = wanted;
      pendingFor = 0;
    }
    pendingFor += dt;
    if (pendingFor >= FIT_HOLD) {
      fit = pendingFit;
      pendingFit = null;
    }
    return fit;
  }

  return {
    get panel() {
      return panel;
    },

    get session() {
      return session;
    },

    get show() {
      return show;
    },

    step(config, delta, { audio, release, replay, view }) {
      const dt = Math.min(delta, MAX_DELTA);
      const fitted = fitFor(config, view, dt);
      const c = fitted ? { ...config, ...fitted } : config;
      let statics = null;
      let rebuilt = false;
      const key = panelKeyOf(c);
      if (key !== panelKey) {
        rebuilt = true;
        session?.dispose();
        show = createPanelShow(c, { eager });
        panel = show ? show.panel : buildPanel(c);
        panelKey = key;
        build = c.buildIn ? 0 : null;
        session = createPanelSession(panel, c, { show });
        show?.attach?.(session);
        patchKey = patchKeyOf(c);
      } else if (patchKeyOf(c) !== patchKey) {
        patchKey = patchKeyOf(c);
        if (show?.repatch) show.repatch(c);
        else session.repatch(c);
      }
      if (replay !== replayed) {
        replayed = replay;
        build = 0;
      }
      if (release !== released) {
        released = release;
        session.releaseControls();
      }
      if (c.motionMode === 'operate') clock += dt;
      if (build != null) {
        build += dt;
        if (build > c.buildSeconds) build = null;
      }
      const moved = show ? show.update(clock, view) : false;
      if (show?.patch && show.patch !== adopted) {
        adopted = show.patch;
        session.adopt(adopted);
      }
      const nowBuilding = build != null;
      if (rebuilt || moved || nowBuilding !== building) {
        const source = show ?? panel;
        statics = nowBuilding ? source.chassis : source.statics;
      }
      building = nowBuilding;
      session.step(dt, { config: c, audio, build, t: clock });
      return {
        moving: session.moving(),
        offset: session.offset,
        patch: session.patch,
        offsets: session.offsets(),
        reveals: session.reveals(),
        statics,
      };
    },
  };
}
