import { isAvatarSeed, randomAvatarSeed } from './avatar';
import { PLAYER_COLORS } from './palette';
import { sanitizeSettings, settingsFromConfig } from './roomSettings';

const MAX_NAME = 16;
export const HOST_ACTIONS = new Set([
  'clear',
  'lobby',
  'preset',
  'prompt',
  'settings',
  'start',
]);

function cleanName(name) {
  const trimmed = String(name ?? '')
    .trim()
    .slice(0, MAX_NAME);
  return trimmed || 'Scribbler';
}

function pickColor(requested, taken, fallback) {
  const valid = (index) =>
    Number.isInteger(index) &&
    index >= 0 &&
    index < PLAYER_COLORS.length &&
    !taken.has(index);
  if (valid(requested)) return requested;
  if (valid(fallback)) return fallback;
  const free = PLAYER_COLORS.findIndex((_, index) => !taken.has(index));
  return free >= 0 ? free : taken.size % PLAYER_COLORS.length;
}

export default function createPartyRules(gameRules, defaultPreset) {
  const rulesFor = (meta) => gameRules[meta.preset] ?? gameRules[defaultPreset];
  const gameCtx = (ctx) => ({
    ...ctx,
    game: ctx.meta.game,
    players: ctx.meta.players,
    settings: ctx.meta.settings ?? settingsFromConfig(ctx.config),
  });

  return {
    init(ctx) {
      const { preset } = ctx.config;
      ctx.meta.players = {};
      ctx.meta.settings = settingsFromConfig(ctx.config);
      ctx.meta.preset = gameRules[preset] ? preset : defaultPreset;
      ctx.meta.game = rulesFor(ctx.meta).createMeta(ctx.config);
    },
    onJoin(ctx, id, profile) {
      const { players } = ctx.meta;
      const existing = players[id];
      const taken = new Set(
        Object.entries(players)
          .filter(([pid]) => pid !== id)
          .map(([, player]) => player.color)
      );
      players[id] = {
        avatar: isAvatarSeed(profile?.avatar)
          ? profile.avatar
          : (existing?.avatar ?? randomAvatarSeed()),
        color: pickColor(profile?.color, taken, existing?.color),
        joinedAt: existing?.joinedAt ?? ctx.now,
        name: cleanName(profile?.name),
      };
    },
    onLeave(ctx, id) {
      delete ctx.meta.players[id];
      rulesFor(ctx.meta).onLeave?.(gameCtx(ctx), id);
    },
    onAction(ctx, action, from) {
      if (HOST_ACTIONS.has(action?.type)) {
        if (from !== ctx.selfId) return;
      } else if (!ctx.meta.players[from]) return;
      if (action.type === 'settings') {
        ctx.meta.settings = {
          ...(ctx.meta.settings ?? settingsFromConfig(ctx.config)),
          ...sanitizeSettings(action.patch),
        };
        return;
      }
      if (action.type === 'preset') {
        if (!gameRules[action.preset] || action.preset === ctx.meta.preset)
          return;
        ctx.meta.preset = action.preset;
        ctx.meta.game = gameRules[action.preset].createMeta(ctx.config);
        ctx.clear();
        return;
      }
      rulesFor(ctx.meta).onAction?.(gameCtx(ctx), action, from);
    },
    onTick(ctx) {
      rulesFor(ctx.meta).onTick?.(gameCtx(ctx));
    },
  };
}
