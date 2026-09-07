# // Apollian

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- An explorable Apollonian fractal
- Both originals are fixed-view. The scene keeps their exact framing as the
  default look and adds a second view mode driven by the scene camera.
- The two shaders share everything except their distance estimator, so they
  live in one fragment shader behind a `domain` switch and ship as presets.
- The originals are kept verbatim in `references/` — the port is diffed
  against them, not against memory.

## // TODO:

- [ ] Compare Shader Camera mode side by side with both Shadertoys and fix any drift
- [ ] Tune Scene Camera mode: AO and step count are tuned for the original shot and band at other angles
- [ ] Find good pivot + zoom presets for deep exploration
- [ ] Decide mobile render scale default
- [ ] Port to WebGPU/TSL once the WebGL version is the agreed ground truth

## // Presets

## // Features

## // Interactivity

## // Bugs
