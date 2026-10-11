import { isInkIndex } from '../../utils/palette';
import { clamp, sanitizePoints } from '../../utils/quantize';
import PROMPTS from './prompts';

export const BRUSH_WIDTHS = [4, 10, 24];
const FIRST_PROMPT_DELAY_MS = 4000;

function nextPrompt(ctx) {
  const { game } = ctx;
  let index = Math.floor(Math.random() * PROMPTS.length);
  if (index === game.promptIndex) index = (index + 1) % PROMPTS.length;
  game.promptIndex = index;
  game.prompt = PROMPTS[index];
  game.promptAt = ctx.now;
  game.promptSeq += 1;
}

const collabRules = {
  createMeta: () => ({
    prompt: null,
    promptAt: 0,
    promptIndex: -1,
    promptSeq: 0,
    startedAt: 0,
  }),
  onAction(ctx, action, from) {
    if (action.type === 'stroke') {
      const p = sanitizePoints(action.p);
      if (!p) return;
      const w = clamp(action.w, 1, 80, BRUSH_WIDTHS[1]);
      if (action.erase === true) {
        ctx.emit({ k: 'e', p, pid: from, w });
        return;
      }
      ctx.emit({
        c: isInkIndex(action.c) ? action.c : ctx.players[from].color,
        k: 's',
        p,
        pid: from,
        w,
      });
    } else if (action.type === 'clear') {
      ctx.clear();
    } else if (action.type === 'prompt') {
      nextPrompt(ctx);
    }
  },
  onTick(ctx) {
    const { game } = ctx;
    if (!game.startedAt) game.startedAt = ctx.now;
    const seconds = ctx.settings.collabPromptSeconds;
    if (!(seconds > 0)) return;
    const due = game.prompt
      ? game.promptAt + seconds * 1000
      : game.startedAt + FIRST_PROMPT_DELAY_MS;
    if (ctx.now >= due) nextPrompt(ctx);
  },
};

export default collabRules;
