# // Morphing ASCII

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

Port of Niccolò Fanton's
[morphing-ascii-shader](https://github.com/niccolofanton/morphing-ascii-shader)
(MIT). Core logic in `src/modules/tsl/ascii/`, fullscreen pass in `Ascii.jsx`
(this folder), Darkroom technique in `src/dev/tools/darkroom/techniques/ascii/`
with the demo's three per-video looks as presets.

`AsciiEffect` → `kernel.js`, `MemoryGrid` → `MemoryNode.js` (a TempNode, so it
runs inside the pipeline), `InkBleedEffect` → `inkBleed.js`, postprocessing's
layer blend functions → `blend.js`.

## // TODO:

- [ ] Owns its own `RenderPipeline` like Halftone, so it can't yet be chained
      with Bloom or the other effects.

## // Presets

## // Features

## // Interactivity

## // Bugs
