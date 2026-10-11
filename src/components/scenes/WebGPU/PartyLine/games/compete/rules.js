/* eslint-disable no-param-reassign */
import { QUANT, clamp, sanitizePoints } from '../../utils/quantize';
import { applyOp, countOwners, createGrid } from './ownershipGrid';

export const COUNTDOWN_MS = 3000;

function roundFromConfig(config, settings) {
  return {
    brush: clamp(config.competeBrushRadius, 0.5, 8, 1.6),
    eraserEvery: clamp(
      settings.competeEraserEvery ?? config.competeEraserEvery,
      0,
      60,
      8
    ),
    eraserSeconds: clamp(config.competeEraserSeconds, 0.5, 8, 2.2),
    eraserSize: clamp(config.competeEraserSize, 0.02, 0.3, 0.07),
    grid: Math.round(clamp(config.competeGridSize, 64, 1024, 384)),
    seconds: clamp(
      settings.competeRoundSeconds ?? config.competeRoundSeconds,
      5,
      300,
      45
    ),
  };
}

function scheduleEraser(game, now) {
  const every = game.round.eraserEvery;
  game.nextEraserAt =
    every > 0 ? now + every * 1000 * (0.5 + Math.random()) : 0;
}

function launchEraser(game, now) {
  const across = 0.15 + Math.random() * 0.7;
  const forward = Math.random() < 0.5;
  const horizontal = Math.random() < 0.6;
  const [from, to] = forward ? [-0.12, 1.12] : [1.12, -0.12];
  const a = horizontal ? [from, across] : [across, from];
  const b = horizontal
    ? [to, Math.min(0.9, Math.max(0.1, across + (Math.random() - 0.5) * 0.5))]
    : [Math.min(0.9, Math.max(0.1, across + (Math.random() - 0.5) * 0.5)), to];
  game.eraser = {
    a,
    amp: 0.03 + Math.random() * 0.06,
    b,
    freq: 1 + Math.random() * 2,
    last: null,
    spin: (Math.random() - 0.5) * 8,
    t0: now,
  };
}

function eraserPose(eraser, t) {
  const eased = t * t * (3 - 2 * t);
  const dx = eraser.b[0] - eraser.a[0];
  const dy = eraser.b[1] - eraser.a[1];
  const len = Math.hypot(dx, dy) || 1;
  const wobble = eraser.amp * Math.sin(t * Math.PI * 2 * eraser.freq);
  return {
    angle: Math.atan2(dy, dx) + eraser.spin * t + wobble * 6,
    x: eraser.a[0] + dx * eased - (dy / len) * wobble,
    y: eraser.a[1] + dy * eased + (dx / len) * wobble,
  };
}

function advanceEraser(ctx) {
  const { game } = ctx;
  const { round } = game;
  if (!game.eraser) {
    if (game.nextEraserAt && ctx.now >= game.nextEraserAt)
      launchEraser(game, ctx.now);
    return;
  }
  const t = Math.min(
    1,
    (ctx.now - game.eraser.t0) / (round.eraserSeconds * 1000)
  );
  const pose = eraserPose(game.eraser, t);
  const point = [Math.round(pose.x * QUANT), Math.round(pose.y * QUANT)];
  const last = game.eraser.last ?? point;
  ctx.emit({
    a: Math.round(pose.angle * 100) / 100,
    k: 'e',
    p: [...last, ...point],
    r: round.eraserSize * round.grid,
  });
  game.eraser.last = point;
  if (t >= 1) {
    game.eraser = null;
    scheduleEraser(game, ctx.now);
  }
}

export function scoreLog(log, round, roster) {
  const grid = createGrid(round.grid);
  log.forEach((op) => applyOp(grid, op));
  const counts = countOwners(grid);
  const total = round.grid * round.grid;
  const byColor = new Map();
  Object.values(roster).forEach((entry) => {
    if (!byColor.has(entry.color)) byColor.set(entry.color, entry);
  });
  return [...byColor.values()]
    .map((entry) => ({
      avatar: entry.avatar,
      cells: counts[entry.color + 1],
      color: entry.color,
      name: entry.name,
      share: counts[entry.color + 1] / total,
    }))
    .sort((x, y) => y.cells - x.cells);
}

function startRound(ctx) {
  const { game } = ctx;
  game.round = roundFromConfig(ctx.config, ctx.settings);
  game.phase = 'countdown';
  game.endsAt = ctx.now + COUNTDOWN_MS;
  game.results = null;
  game.eraser = null;
  game.nextEraserAt = 0;
  game.roster = {};
  ctx.clear();
}

const competeRules = {
  createMeta: () => ({
    endsAt: 0,
    eraser: null,
    nextEraserAt: 0,
    phase: 'lobby',
    results: null,
    roster: {},
    round: null,
  }),
  onAction(ctx, action, from) {
    const { game } = ctx;
    if (action.type === 'start') {
      if (game.phase === 'lobby' || game.phase === 'results') startRound(ctx);
    } else if (action.type === 'lobby') {
      if (game.phase === 'results') game.phase = 'lobby';
    } else if (action.type === 'stroke' && game.phase === 'drawing') {
      const p = sanitizePoints(action.p);
      if (!p) return;
      const player = ctx.players[from];
      game.roster[from] = {
        avatar: player.avatar,
        color: player.color,
        name: player.name,
      };
      ctx.emit({ k: 's', o: player.color + 1, p, r: game.round.brush });
    }
  },
  onTick(ctx) {
    const { game } = ctx;
    if (game.phase === 'countdown' && ctx.now >= game.endsAt) {
      game.phase = 'drawing';
      game.endsAt = ctx.now + game.round.seconds * 1000;
      scheduleEraser(game, ctx.now);
    } else if (game.phase === 'drawing') {
      advanceEraser(ctx);
      if (ctx.now >= game.endsAt) {
        game.phase = 'results';
        game.eraser = null;
        game.results = scoreLog(ctx.getLog(), game.round, game.roster);
      }
    }
  },
};

export default competeRules;
