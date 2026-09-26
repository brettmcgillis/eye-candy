# // Halftone

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

Port of Maxime Heckel's
[Shades of Halftone](https://blog.maximeheckel.com/posts/shades-of-halftone/).
Core logic in `src/modules/tsl/halftone/`, fullscreen pass in `Halftone.jsx`
(this folder). Same `sampleFn(uv)` seam as FractalPixelate, so a per-object
`backdropNode` version needs no module changes.

## // TODO:

- [x] `dots` — classic grid; `offset` staggers odd rows, `useLuma` sizes dots
      by luma and outputs grayscale (sandbox scene 1)
- [x] `whiteDots` — white holes in colored cells, darker = bigger hole
- [x] `dotsAndSquares` — `whiteDots` for dark cells, colored dots on paper for
      light cells. The widget source wasn't in the article bundle; the
      luma-0.5 split follows the prose.
- [x] `rings` — luma-sized rings (`ringThickness`)
- [x] `cmyk` — four rotated grids, subtractive blend, RGB→CMYK by mattdesl.
      Defaults follow the sandbox (C15 M45 Y0 K75); the prose lists
      M75 / K45.
- [x] `cellWall` — 3x3 neighbor search so dots can outgrow their cell
- [x] `gooey` — 5x5 checkerboard dots merged with a polynomial smooth-min
- [x] `displacedRings` — 9x9 ring kernel pushed by a ping-pong cursor trail
      (`useHalftoneTrail.js` → `createMouseTrail()`)
- [ ] Moiré demo (two rotated grids / Poisson layers) not ported. It is a
      teaching widget in the article, not one of the effects.
- [ ] Grid variants sample the cell's corner like the source
      (`pixelSize * floor(uv / pixelSize)`), not its center — try center
      sampling for a half-cell-cleaner image.
- [ ] `kernelRadius` is baked into the shader. `displacedRings` at 4 costs 81
      iterations × 2 scene taps per pixel — the article flags it as expensive.
- [ ] `backdropNode` variant (see LoGlow's use of `fractalPixelate`).
- [ ] Owns its own `RenderPipeline` like FractalPixelate, so it can't yet be
      chained with Bloom or the other effects.

## // Presets

## // Features

## // Interactivity

- [x] `displacedRings` follows the R3F pointer (damped like the source);
      `showTrail` overlays the trail buffer for debugging.

## // Bugs
