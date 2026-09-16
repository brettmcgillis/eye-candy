export const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?\'"-+=/()&#@*';

export const MAX_CELLS = 128;

export function glyphKey(char) {
  const upper = String(char).toUpperCase();
  return upper.length === 1 && CHARSET.includes(upper) ? upper : null;
}

// Lays text out on a fixed grid, one glyph per cell, row 0 at the top.
// `inLine` marks cells that belong to a line of text (spaces included), so
// per-line decoration like the sigil baseline stops where the line does.
export function layoutText(text, { lineGap = 0, maxCells = MAX_CELLS } = {}) {
  const lines = String(text ?? '').split('\n');
  const longest = Math.max(1, ...lines.map((line) => [...line].length));
  const cols = Math.min(longest, maxCells);
  const gap = Math.max(0, Math.round(lineGap));

  const grid = [];
  lines.forEach((line, index) => {
    if (index > 0) {
      for (let g = 0; g < gap; g += 1) {
        grid.push(Array.from({ length: cols }, () => null));
      }
    }
    const chars = [...line];
    grid.push(
      Array.from({ length: cols }, (_, col) =>
        col < chars.length ? { inLine: true, key: glyphKey(chars[col]) } : null
      )
    );
  });

  const rows = Math.max(1, Math.min(grid.length, Math.floor(maxCells / cols)));

  return {
    cells: grid.slice(0, rows).flat(),
    cols,
    rows,
    truncated: rows < grid.length || longest > cols,
  };
}
