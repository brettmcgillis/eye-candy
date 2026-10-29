export const PALETTES = {
  signal: ['#f3eadb', '#c53544', '#171b27', '#e8a94a', '#e37b71'],
  bauhaus: ['#eee6d4', '#c53b2c', '#234e8a', '#e5b22f', '#292a2c'],
  lagoon: ['#d7e7d7', '#11696a', '#113d52', '#e3b85c', '#66a8a2'],
  orchid: ['#211c32', '#ae7ebf', '#e7a7b6', '#ea6548', '#6257a5'],
  citrus: ['#eee9cc', '#7c922d', '#e9b52b', '#e46939', '#234d45'],
  mineral: ['#e7e2d8', '#486c78', '#31444a', '#b67559', '#8da8a4'],
  nocturne: ['#131e2b', '#e36051', '#e0b36a', '#4d8d92', '#b7c6bc'],
  sorbet: ['#f3dfda', '#b86d88', '#e6a16b', '#687caa', '#90aaa2'],
  ember: ['#241e21', '#ce5132', '#e3a044', '#8e303e', '#d8c2a5'],
};
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export const rgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
export const hex = (c) =>
  `#${c
    .map((v) =>
      Math.round(clamp(v) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
export const linear = (v) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
export function paletteFor(c) {
  if (c.palette === 'custom') return [c.inkA, c.inkB, c.inkC, c.inkA].map(rgb);
  return PALETTES[c.palette].slice(1).map(rgb);
}
export function colorCoordinate(c, tile, noise, turn) {
  const { x, y, layer } = tile;
  const scale = c.colorScale;
  let t = layer * 0.25 * (0.45 + c.layerContrast * 0.55);
  if (c.colorMode === 'layers') {
    const phase = t + c.colorShift + Math.sin(turn) * c.colorMotion * 0.06;
    return ((phase % 1) + 1) % 1;
  }
  if (c.colorMode === 'bands') t = (x + y * 0.4) * scale;
  if (c.colorMode === 'radial') t = Math.hypot(x, y) * scale;
  if (c.colorMode === 'noise') t = 0.5 + noise(x * scale, y * scale, 7) * 0.55;
  if (c.colorMode === 'checker') t = (Math.abs(tile.col + tile.row) % 4) / 4;
  t += c.colorShift + Math.sin(turn) * c.colorMotion * 0.25;
  t += layer * c.layerContrast * 0.5;
  return ((t % 1) + 1) % 1;
}
