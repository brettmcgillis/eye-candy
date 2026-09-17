# // FractalPixelate

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

## // TODO:

Noise-driven quadtree pixelation — a screen-space pixelation grid whose cell
size subdivides per-cell via bounded per-level hash noise, instead of a
uniform grid. Core logic in `src/modules/tsl/fractalPixelate/`, usable both as
a fullscreen post effect (`FractalPixelate.jsx`, this folder) and as a
per-object `backdropNode` (see LoGlow's Logo shells for an example).

- [x] Tri-xels, & Tri-tree — `shape: 'tri'` in `fractalPixelate()`
      (`src/modules/tsl/fractalPixelate/tri.js`) re-tiles the same bounded
      per-level split loop onto a 60° triangular lattice instead of a square
      one. `levels: 0` gives a plain fixed trixel grid ("tri-xels"); `levels
  > 0` gives the noise-driven multiscale version ("tri-tree") — same
      relationship the square grid already had between a uniform grid and
      the fractal quadtree, so both shapes share one `levels`/`threshold`
      control surface.
- [x] Interactive pixelation — `driver: 'pointer'` (`pointerSplit()` in
      `shared.js`) splits purely by distance to `pointerUV`, shrinking each
      level's radius so cells get progressively finer toward the cursor (a
      magnifying-glass falloff); `pointerStrength`'s sign flips it to grow
      cells toward the cursor instead. It's a driver like `noise`/`variance`,
      not a bias on top of them — switching `driver` away from `'pointer'`
      makes `pointerRadius`/`pointerStrength` inert, so there's no lingering
      effect from a slider left over from testing it. Works for both
      `shape`s. `FractalPixelate.jsx` wires up pointer tracking
      (`useFractalPixelatePointer.js`); the backdrop variant
      (`useBackdropPixelate.js`) doesn't yet — it would need the pointer
      projected onto the mesh's screen-space footprint rather than the plain
      viewport UV the fullscreen pass uses.
- [x] Content-aware quadtree/trixelation — `driver: 'variance'` samples the
      scene directly (the cell's would-be children for quad, the triangle's
      own corners for tri) and compares luminance spread against
      `varianceThreshold` instead of hashing. This ships as a **single-pass
      approximation** of the originally-scoped design below, not the full
      compute pyramid — cheap enough to not need render targets, but it
      re-samples the scene per level rather than reusing precomputed
      block averages.
  - [ ] Full mip-pyramid version: build the block-averages via compute
        passes (one dispatch per level, each reading the full-res scene
        texture) and have the fragment pass walk precomputed variance
        instead of re-sampling live — meaningfully more setup (storage
        textures, compute dispatch wired into the frame loop) for less
        per-fragment bandwidth. Worth it if `driver: 'variance'` turns out
        to be a bottleneck at higher `levels`.

## // Presets

## // Features

## // Interactivity

## // Bugs
