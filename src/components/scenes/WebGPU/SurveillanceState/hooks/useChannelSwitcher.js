import { useCallback, useEffect } from 'react';

const NEXT_KEYS = new Set(['ArrowUp', 'PageUp', '+', '=', ']']);
const PREVIOUS_KEYS = new Set(['ArrowDown', 'PageDown', '-', '_', '[']);

const isTyping = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

// The Leva `channel` control is the one source of truth; the timer, the TV and
// the keyboard all just write it.
export default function useChannelSwitcher({
  autoCycle,
  channel,
  channelCount,
  cycleSeconds,
  setControls,
}) {
  const tune = useCallback(
    (next) => {
      const wrapped =
        (((next - 1) % channelCount) + channelCount) % channelCount;
      setControls({ channel: wrapped + 1 });
    },
    [channelCount, setControls]
  );
  const step = useCallback((delta) => tune(channel + delta), [channel, tune]);

  useEffect(() => {
    if (channel > channelCount) tune(channel);
  }, [channel, channelCount, tune]);

  useEffect(() => {
    if (!autoCycle || channelCount < 2) return undefined;
    const timer = setTimeout(() => step(1), cycleSeconds * 1000);
    return () => clearTimeout(timer);
  }, [autoCycle, channelCount, cycleSeconds, step]);

  useEffect(() => {
    const onKey = (event) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey) return;
      if (NEXT_KEYS.has(event.key)) step(1);
      else if (PREVIOUS_KEYS.has(event.key)) step(-1);
      else if (/^[1-9]$/.test(event.key)) {
        const picked = Number(event.key);
        if (picked <= channelCount) tune(picked);
      } else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [channelCount, step, tune]);

  return step;
}
