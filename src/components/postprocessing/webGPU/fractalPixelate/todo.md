# // FractalPixelate

# // TODO:

[Back to main TODO](../../../../../TODO.md)

Noise-driven quadtree pixelation — a screen-space pixelation grid whose cell
size subdivides per-cell via bounded per-level hash noise, instead of a
uniform grid. Core logic in `src/modules/tsl/fractalPixelate.js`, usable both as
a fullscreen post effect (`FractalPixelate.jsx`, this folder) and as a
per-object `backdropNode` (see LoGlow's Logo shells for an example).

- [ ] Content-aware quadtree: replace (or add as a mode alongside) the
      noise-driven subdivision with a variance/edge-driven one — build a
      mip-like pyramid of block-averages via compute passes, then have the
      final pass walk the pyramid so busy/detailed areas get finer pixels and
      flat areas stay chunky. Meaningfully more complex (several compute
      shaders) than the current single-pass approach; deferred until the
      noise-driven version has been used/seen in a few scenes.

# // Bugs
