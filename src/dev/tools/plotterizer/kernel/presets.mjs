const IN = 25.4;

export const PAPERS = [
  { heightMm: 6 * IN, id: '8.5x6', label: '8.5 × 6 in', widthMm: 8.5 * IN },
  { heightMm: 11 * IN, id: 'letter', label: 'Letter', widthMm: 8.5 * IN },
  { heightMm: 7 * IN, id: '5x7', label: '5 × 7 in', widthMm: 5 * IN },
  { heightMm: 6 * IN, id: '4x6', label: '4 × 6 in', widthMm: 4 * IN },
  { heightMm: 210, id: 'a5', label: 'A5', widthMm: 148 },
  { heightMm: 297, id: 'a4', label: 'A4', widthMm: 210 },
];

export const PAPER_COLORS = [
  { color: '#ffffff', label: 'White' },
  { color: '#f3ead7', label: 'Cream' },
  { color: '#141414', label: 'Black' },
];

const pen = (id, name, color, nibMm) => ({ color, id, name, nibMm });

export const DEFAULT_PENS = [
  pen('black-03', 'Black 0.3', '#111111', 0.3),
  pen('gray-03', 'Gray 0.3', '#7a7a7a', 0.3),
  pen('red-03', 'Red 0.3', '#d0312d', 0.3),
  pen('orange-03', 'Orange 0.3', '#f28c28', 0.3),
  pen('yellow-03', 'Yellow 0.3', '#f5d000', 0.3),
  pen('green-03', 'Green 0.3', '#3a9d3a', 0.3),
  pen('dark-green-03', 'Dark green 0.3', '#1f5f2e', 0.3),
  pen('blue-03', 'Blue 0.3', '#2a5db0', 0.3),
  pen('purple-03', 'Purple 0.3', '#7b3fa0', 0.3),
  pen('brown-03', 'Brown 0.3', '#7a4a24', 0.3),
  pen('black-sketch', 'Black sketch pen', '#111111', 0.5),
  pen('white-gel', 'White gel', '#f4f4f4', 0.5),
];
