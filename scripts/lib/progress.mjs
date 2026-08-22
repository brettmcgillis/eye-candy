import process from 'node:process';

const BAR_WIDTH = 24;
// Throttle redraws so a fast loop doesn't spend its time writing to the
// terminal, and so a piped log doesn't fill with thousands of lines.
const MIN_INTERVAL_MS = 100;
const CLEAR_LINE = '\r[K';

function bar(fraction) {
  const filled = Math.round(fraction * BAR_WIDTH);
  return `${'#'.repeat(filled)}${'-'.repeat(BAR_WIDTH - filled)}`;
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Reports progress on one rewritten line when attached to a terminal, and as
// occasional plain lines when the output is piped or redirected — where a
// carriage return would just concatenate everything into one unreadable row.
export default function createProgress(label, total) {
  const interactive = Boolean(process.stdout.isTTY);
  const started = Date.now();
  let lastDraw = 0;
  let lastPercent = -1;
  let finished = false;

  function draw(current, force) {
    if (finished) return;
    const now = Date.now();
    if (!force && now - lastDraw < MIN_INTERVAL_MS) return;
    lastDraw = now;

    const fraction = total > 0 ? Math.min(1, current / total) : 0;
    const percent = Math.floor(fraction * 100);
    const elapsed = (now - started) / 1000;
    const eta = fraction > 0 ? elapsed / fraction - elapsed : Infinity;

    if (interactive) {
      process.stdout.write(
        `${CLEAR_LINE}  ${label} [${bar(fraction)}] ${String(percent).padStart(3)}%  ` +
          `${current}/${total}  eta ${formatEta(eta)}`
      );
      return;
    }

    // Piped: one line per 10% so logs stay readable.
    if (percent >= lastPercent + 10) {
      lastPercent = percent - (percent % 10);
      process.stdout.write(
        `  ${label} ${percent}% (${current}/${total}) eta ${formatEta(eta)}\n`
      );
    }
  }

  return {
    done(message) {
      if (finished) return;
      finished = true;
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      if (interactive) process.stdout.write(CLEAR_LINE);
      process.stdout.write(`  ${message ?? label} — ${elapsed}s\n`);
    },
    update: (current) => draw(current, false),
  };
}
