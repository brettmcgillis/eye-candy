import * as THREE from 'three';

// ─── Canvas → Scene coordinate transform ─────────────────────────────────────
//
// Points are authored in Spline Editor canvas space:
//   x → right, y → down, origin top-left.
//   CANVAS_H = 445 is the barrel-tip's canvas y-coordinate.
//
// toScene() flips y so that the barrel tip (canvas y=CANVAS_H) maps to
// local origin (0, 0). The smoke <group> in ThatsAllFolks.jsx handles
// world positioning via Leva X / Y / Z controls.
//   canvas y=CANVAS_H → local y=0
//   canvas y=0        → local y=CANVAS_H*SCALE ≈ 365
//
// Scene units: 1 unit ≈ 1 cm.

const CANVAS_H = 445;
const SCALE = 0.82;

export function toScene(pts) {
  return pts.map(({ x, y }) => new THREE.Vector3(x, (CANVAS_H - y) * SCALE, 0));
}

// ─── Per-letterform canvas control-points (x→right, y→down) ─────────────────

// Capital T stroke
export const CAPITAL_T = [
  { x: 91, y: 156 },
  { x: 91, y: 169 },
  { x: 70, y: 173 },
  { x: 60, y: 156 },
  { x: 71, y: 138 },
  { x: 99, y: 126 },
  { x: 130, y: 116 },
  { x: 157, y: 99 },
  { x: 151, y: 110 },
  { x: 132, y: 134 },
  { x: 120, y: 162 },
  { x: 112, y: 198 },
  { x: 100, y: 240 },
  { x: 86, y: 270 },
  { x: 58, y: 279 },
  { x: 36, y: 267 },
  { x: 30, y: 243 },
  { x: 49, y: 220 },
  { x: 65, y: 225 },
  { x: 60, y: 235 },
  { x: 55, y: 228 },
];

// h, a, t, s strokes
export const HATS = [
  { x: 142, y: 172 },
  { x: 162, y: 152 },
  { x: 180, y: 132 },
  { x: 188, y: 114 },
  { x: 189, y: 94 },
  { x: 182, y: 85 },
  { x: 175, y: 95 },
  { x: 166, y: 115 },
  { x: 158, y: 145 },
  { x: 153, y: 177 },
  { x: 150, y: 201 },
  { x: 142, y: 233 },
  { x: 142, y: 215 },
  { x: 151, y: 192 },
  { x: 166, y: 172 },
  { x: 183, y: 160 },
  { x: 186, y: 173 },
  { x: 182, y: 188 },
  { x: 179, y: 203 },
  { x: 179, y: 217 },
  { x: 194, y: 205 },
  { x: 202, y: 193 },
  { x: 206, y: 178 },
  { x: 211, y: 158 },
  { x: 220, y: 148 },
  { x: 228, y: 151 },
  { x: 221, y: 147 },
  { x: 211, y: 151 },
  { x: 202, y: 169 },
  { x: 200, y: 185 },
  { x: 205, y: 202 },
  { x: 217, y: 201 },
  { x: 226, y: 193 },
  { x: 229, y: 179 },
  { x: 234, y: 158 },
  { x: 238, y: 144 },
  { x: 231, y: 167 },
  { x: 237, y: 190 },
  { x: 251, y: 177 },
  { x: 263, y: 157 },
  { x: 268, y: 123 },
  { x: 274, y: 88 },
  { x: 269, y: 113 },
  { x: 262, y: 141 },
  { x: 258, y: 180 },
  { x: 264, y: 187 },
  { x: 275, y: 175 },
  { x: 284, y: 154 },
  { x: 297, y: 126 },
  { x: 305, y: 115 },
  { x: 300, y: 126 },
  { x: 307, y: 138 },
  { x: 313, y: 159 },
  { x: 304, y: 174 },
  { x: 290, y: 165 },
  { x: 299, y: 161 },
];

// T crossbar
export const T_CROSSBAR = [
  { x: 224, y: 121 },
  { x: 256, y: 107 },
  { x: 291, y: 94 },
];

// Apostrophe
export const APOSTROPHE = [
  { x: 294, y: 70 },
  { x: 293, y: 67 },
  { x: 299, y: 64 },
  { x: 300, y: 74 },
  { x: 293, y: 80 },
];

// "All" letterforms (A, l, l)
export const ALL_LETTERS = [
  { x: 331, y: 166 },
  { x: 343, y: 156 },
  { x: 346, y: 141 },
  { x: 350, y: 122 },
  { x: 361, y: 105 },
  { x: 374, y: 105 },
  { x: 365, y: 101 },
  { x: 354, y: 109 },
  { x: 345, y: 125 },
  { x: 344, y: 141 },
  { x: 349, y: 155 },
  { x: 357, y: 153 },
  { x: 369, y: 138 },
  { x: 375, y: 115 },
  { x: 381, y: 99 },
  { x: 372, y: 128 },
  { x: 372, y: 150 },
  { x: 379, y: 152 },
  { x: 394, y: 139 },
  { x: 411, y: 111 },
  { x: 426, y: 81 },
  { x: 436, y: 46 },
  { x: 433, y: 20 },
  { x: 417, y: 39 },
  { x: 410, y: 68 },
  { x: 402, y: 98 },
  { x: 400, y: 119 },
  { x: 404, y: 145 },
  { x: 430, y: 128 },
  { x: 460, y: 96 },
  { x: 476, y: 56 },
  { x: 476, y: 15 },
  { x: 458, y: 34 },
  { x: 450, y: 65 },
  { x: 444, y: 107 },
  { x: 443, y: 135 },
  { x: 448, y: 148 },
  { x: 466, y: 129 },
];

// Capital F stroke
export const CAPITAL_F = [
  { x: 161, y: 278 },
  { x: 156, y: 287 },
  { x: 140, y: 285 },
  { x: 135, y: 269 },
  { x: 145, y: 255 },
  { x: 167, y: 247 },
  { x: 196, y: 238 },
  { x: 226, y: 221 },
  { x: 217, y: 235 },
  { x: 202, y: 254 },
  { x: 191, y: 273 },
  { x: 184, y: 302 },
  { x: 185, y: 335 },
  { x: 180, y: 367 },
  { x: 161, y: 385 },
  { x: 136, y: 379 },
  { x: 129, y: 361 },
  { x: 140, y: 344 },
  { x: 154, y: 342 },
  { x: 159, y: 351 },
  { x: 149, y: 356 },
];

// Exclamation mark shaft — reversed so smoke flows up (dot → top)
export const EXCLAMATION_LINE = [
  { x: 414, y: 300 },
  { x: 418, y: 248 },
  { x: 422, y: 206 },
];

// Exclamation mark dot
export const EXCLAMATION_DOT = [
  { x: 411, y: 330 },
  { x: 409, y: 325 },
  { x: 413, y: 319 },
  { x: 418, y: 327 },
];

// "olks" + connecting tail (redesigned).
// Barrel approach (Option C wide-S) prepended. Smoke emits from ~y=578,
// runs right briefly, S-curves up, then joins the letterforms.
// Use smokeX ≈ -296 to position the emitter at the gun barrel tip.
export const OLKS_TAIL = [
  // ── barrel approach — Option C (wide S, clean) ─────────────────────────
  { x: 270, y: 578 },
  { x: 315, y: 562 },
  { x: 310, y: 530 },
  { x: 280, y: 500 },
  // ── original olks+tail ──────────────────────────────────────────────────
  { x: 285, y: 468 },
  { x: 262, y: 442 },
  { x: 229, y: 426 },
  { x: 182, y: 415 },
  { x: 149, y: 410 },
  { x: 114, y: 412 },
  { x: 102, y: 434 },
  { x: 130, y: 452 },
  { x: 178, y: 445 },
  { x: 258, y: 420 },
  { x: 304, y: 405 },
  { x: 354, y: 385 },
  { x: 391, y: 367 },
  { x: 419, y: 349 },
  { x: 440, y: 335 },
  { x: 456, y: 324 },
  { x: 473, y: 320 },
  { x: 489, y: 336 },
  { x: 485, y: 359 },
  { x: 460, y: 367 },
  { x: 439, y: 359 },
  { x: 375, y: 319 },
  { x: 367, y: 321 },
  { x: 371, y: 336 },
  { x: 385, y: 332 },
  { x: 389, y: 318 },
  { x: 382, y: 298 },
  { x: 376, y: 286 },
  { x: 377, y: 278 },
  { x: 366, y: 295 },
  { x: 353, y: 321 },
  { x: 336, y: 334 },
  { x: 325, y: 325 },
  { x: 314, y: 311 },
  { x: 336, y: 307 },
  { x: 338, y: 293 },
  { x: 328, y: 286 },
  { x: 312, y: 297 },
  { x: 309, y: 326 },
  { x: 305, y: 341 },
  { x: 306, y: 311 },
  { x: 308, y: 273 },
  { x: 312, y: 235 },
  { x: 324, y: 211 },
  { x: 329, y: 226 },
  { x: 324, y: 263 },
  { x: 309, y: 294 },
  { x: 290, y: 326 },
  { x: 268, y: 347 },
  { x: 264, y: 332 },
  { x: 264, y: 311 },
  { x: 263, y: 275 },
  { x: 267, y: 243 },
  { x: 280, y: 220 },
  { x: 286, y: 234 },
  { x: 281, y: 276 },
  { x: 261, y: 309 },
  { x: 236, y: 323 },
  { x: 226, y: 319 },
  { x: 231, y: 313 },
  { x: 242, y: 325 },
  { x: 245, y: 342 },
  { x: 235, y: 360 },
  { x: 215, y: 361 },
  { x: 203, y: 344 },
  { x: 207, y: 321 },
  { x: 220, y: 308 },
  { x: 205, y: 308 },
  { x: 176, y: 314 },
  { x: 156, y: 321 },
  { x: 154, y: 319 },
];
