/* eslint-disable no-param-reassign */
import {
  LINE_WIDTH,
  framePolygon,
  outlineWidth,
  paintFills,
  paintLines,
  paintOutlines,
} from './paint';
import addSlab from './slab';
import { BUILDING_KINDS, levelsFor } from './tiles';

const AXIS = ['i', 'j', 'k'];
const SETTLE_FRAMES = 10;
const QUIET_MS = 1e4;

export default function createRun(
  piece,
  { fps = 30, settleFrames = SETTLE_FRAMES } = {}
) {
  const fills = (painter, ...args) => painter && paintFills(painter, ...args);
  const outlines = (painter, ...args) =>
    painter && paintOutlines(painter, ...args);
  const lines = (painter, ...args) => painter && paintLines(painter, ...args);
  const { aspect, baseZoom, master } = piece;
  const outline = outlineWidth(baseZoom);
  const frameInk = { color: piece.inks.final, width: outline };
  const state = {
    frame: 0,
    redraw: true,
    settle: settleFrames,
    trigger: false,
  };
  const now = () => (state.frame * 1000) / fps;

  piece.tiles.forEach((tile) => {
    Object.assign(tile, { built: false, first: true, rendered: false });
  });

  const paintFinal = (painter, tile, { withLines }) => {
    fills(painter, tile);
    outlines(painter, tile, frameInk);
    if (withLines)
      lines(painter, tile, { color: piece.inks.final, width: LINE_WIDTH });
  };

  const drawBuilding = (painter, tile) => {
    if (!tile.visibleAt(aspect) || tile.rendered) return;
    const naked = tile.kind === 'naked';
    if (tile.buildStep <= 0 || tile.built) {
      const show =
        tile.first || (tile.buildStep <= 0 && tile.rng.roll() < 0.32);
      if ((show && state.settle <= 0) || state.settle > 0) {
        painter?.polygon(framePolygon(tile, naked ? 0.95 : 1), {
          fill: naked ? piece.background : tile.bkg,
          stroke: naked ? null : frameInk,
        });
      }
    }
    if (state.settle > 0) return;
    if (tile.built) {
      paintFinal(painter, tile, { withLines: !naked });
      tile.rendered = true;
      return;
    }
    tile.first = false;
    const top = tile.buildStep - 1;
    const bottom = tile.buildStep - 3;
    if (tile.buildStep > 0) addSlab(tile, tile.drawOrder, top);
    const axis = AXIS[tile.drawOrder];
    const include = (tri) => tri[axis] > bottom && tri[axis] <= top;
    fills(painter, tile, include);
    outlines(painter, tile, {
      color: piece.lineColor,
      include,
      width: outline,
    });
    if (!naked)
      lines(painter, tile, {
        color: piece.lineColor,
        include,
        width: LINE_WIDTH,
      });
    tile.buildStep += 1;
    if (tile.buildStep > levelsFor(tile)) {
      tile.built = true;
      tile.lastBuilt = now();
    }
  };

  const drawSigil = (painter, tile) => {
    if (tile.active) {
      tile.lattice.clear();
      tile.heightMap.fill(0);
      if (!tile.visibleAt(aspect)) return;
      painter?.polygon(framePolygon(tile, 0.95), { fill: piece.background });
      if (state.settle > 0) return;
      for (let level = 0; level < tile.dims.J; level += 1)
        addSlab(tile, 1, level);
      paintFinal(painter, tile, { withLines: true });
      tile.active = false;
    } else if (state.trigger && tile.rng.roll() < 0.25) {
      tile.prepare();
      state.trigger = false;
    }
  };

  const drawPlaceholder = (painter, tile) => {
    if (!tile.visibleAt(aspect)) return;
    if (!tile.rendered || state.settle > 0) {
      painter?.polygon(framePolygon(tile), {
        fill: piece.background,
        stroke: frameInk,
      });
    }
    tile.rendered = true;
  };

  const drawBackground = (painter) => {
    const tile = piece.backgroundTile;
    fills(painter, tile);
    lines(painter, tile, { color: piece.inks.background, width: LINE_WIDTH });
    outlines(painter, tile, {
      color: piece.inks.background,
      width: LINE_WIDTH,
    });
  };

  const step = (painter) => {
    state.frame += 1;
    const time = now();
    if (state.redraw) painter?.background(piece.background);
    if (state.redraw || state.settle > 0) drawBackground(painter);
    piece.tiles.forEach((tile) => {
      if (BUILDING_KINDS.includes(tile.kind)) drawBuilding(painter, tile);
      else if (tile.kind === 'sigil') drawSigil(painter, tile);
      else if (tile.kind === 'placeholder') drawPlaceholder(painter, tile);
      if (
        tile.built &&
        time - tile.lastBuilt > tile.lifespan &&
        time > QUIET_MS
      ) {
        tile.prepare(0);
        if (master.roll() < 0.25) state.trigger = true;
      }
    });
    if (state.settle > 0) state.settle -= 1;
    state.redraw = false;
  };

  const settled = () =>
    piece.tiles.every(
      (tile) =>
        !tile.visibleAt(aspect) ||
        (BUILDING_KINDS.includes(tile.kind) ? tile.rendered : !tile.active)
    );

  return {
    get frame() {
      return state.frame;
    },
    get settled() {
      return state.settle <= 0 && settled();
    },
    step,
  };
}
