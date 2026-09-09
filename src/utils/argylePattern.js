// The argyle logo's geometry, and the single source of truth for it.
//
// Eleven squares of one size on a grid, meant to be drawn in a space rotated 45
// degrees so they read as diamonds. Layer 'b' is the seven that sit at
// multiples of 1.5 and are drawn red; layer 't' is the four at the diagonal
// half-offsets, drawn black on top.
//
// Lives here rather than in the loader because the loader is app-shell code and
// scenes may not reach into it (docs/scene-conventions.md §0). Pure data, no
// dependencies, so both the loader and any scene can hold it.

// Grid unit, in the loader's canvas pixels. A square is one unit across, and
// the 'b' squares are 1.5 apart — so they never touch, and the 't' squares
// overlap their neighbours' corners by a quarter of a square.
export const SQ = 36;

export const SQUARES_H = [
  { sx: 0.0, sy: 0.0, layer: 'b', i: 0 },
  { sx: 1.5, sy: -1.5, layer: 'b', i: 1 },
  { sx: -1.5, sy: 1.5, layer: 'b', i: 2 },
  { sx: 0.0, sy: 1.5, layer: 'b', i: 3 },
  { sx: 0.0, sy: -1.5, layer: 'b', i: 4 },
  { sx: 1.5, sy: 0.0, layer: 'b', i: 5 },
  { sx: -1.5, sy: 0.0, layer: 'b', i: 6 },
  { sx: -0.75, sy: -0.75, layer: 't', i: 7 },
  { sx: 0.75, sy: -0.75, layer: 't', i: 8 },
  { sx: -0.75, sy: 0.75, layer: 't', i: 9 },
  { sx: 0.75, sy: 0.75, layer: 't', i: 10 },
];

// V is SQUARES_H rotated 90° CW in grid space: (sx, sy) → (sy, -sx).
// This keeps the portrait shape (caps at top/bottom instead of wings at
// left/right) while preserving the index→role mapping so every animation
// order works identically in both orientations.
//
//   i:1 → far top   (H: far right)    i:2 → far bottom  (H: far left)
//   i:3 → lower-right (H: lower-left) i:4 → upper-left  (H: upper-right)
//   i:5 → upper-right (H: lower-right) i:6 → lower-left (H: upper-left)
export const SQUARES_V = [
  { sx: 0.0, sy: 0.0, layer: 'b', i: 0 },
  { sx: -1.5, sy: -1.5, layer: 'b', i: 1 },
  { sx: 1.5, sy: 1.5, layer: 'b', i: 2 },
  { sx: 1.5, sy: 0.0, layer: 'b', i: 3 },
  { sx: -1.5, sy: 0.0, layer: 'b', i: 4 },
  { sx: 0.0, sy: -1.5, layer: 'b', i: 5 },
  { sx: 0.0, sy: 1.5, layer: 'b', i: 6 },
  { sx: -0.75, sy: -0.75, layer: 't', i: 7 },
  { sx: 0.75, sy: -0.75, layer: 't', i: 8 },
  { sx: -0.75, sy: 0.75, layer: 't', i: 9 },
  { sx: 0.75, sy: 0.75, layer: 't', i: 10 },
];
