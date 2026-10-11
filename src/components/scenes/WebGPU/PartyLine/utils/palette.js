export const PLAYER_COLORS = [
  { hex: '#e63946', name: 'Red' },
  { hex: '#f77f00', name: 'Orange' },
  { hex: '#ffc300', name: 'Yellow' },
  { hex: '#70c22e', name: 'Lime' },
  { hex: '#0f9d6e', name: 'Green' },
  { hex: '#2ec4f0', name: 'Sky' },
  { hex: '#2f6cf6', name: 'Blue' },
  { hex: '#7b3fe4', name: 'Purple' },
  { hex: '#ff4fa3', name: 'Pink' },
  { hex: '#8d5a3b', name: 'Brown' },
  { hex: '#1f1f1f', name: 'Black' },
  { hex: '#8a9199', name: 'Gray' },
  { board: '#d3d8de', hex: '#ffffff', name: 'White' },
];

export const INK_COLORS = [
  ...PLAYER_COLORS,
  { hex: '#ffb38a', name: 'Peach' },
  { hex: '#e9c46a', name: 'Sand' },
  { hex: '#b07d4f', name: 'Wood' },
  { hex: '#7a1f2b', name: 'Maroon' },
  { hex: '#3fa34d', name: 'Grass' },
  { hex: '#b5ead7', name: 'Mint' },
  { hex: '#8ee3ef', name: 'Aqua' },
  { hex: '#4f9fd8', name: 'Sea' },
  { hex: '#1b2a6b', name: 'Navy' },
  { hex: '#c3a6ff', name: 'Lavender' },
  { hex: '#ffd6e8', name: 'Bubblegum' },
];

export function playerHex(colorIndex) {
  return PLAYER_COLORS[colorIndex]?.hex ?? PLAYER_COLORS[0].hex;
}

export function playerBoardHex(colorIndex) {
  const color = PLAYER_COLORS[colorIndex] ?? PLAYER_COLORS[0];
  return color.board ?? color.hex;
}

export function inkHex(inkIndex) {
  return INK_COLORS[inkIndex]?.hex ?? INK_COLORS[0].hex;
}

export function isInkIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < INK_COLORS.length;
}
