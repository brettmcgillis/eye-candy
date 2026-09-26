# // ShadingMotion

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

Port of Maxime Heckel's
[Shading Motion](https://blog.maximeheckel.com/posts/shading-motion/). Core
logic in `src/modules/tsl/shadingMotion/`. Two components in this folder:

- `ShadingMotion.jsx` — frame differencing (compute) → a motion `mode`
- `MotionBlur.jsx` + `VelocityProxy.jsx` — the velocity-map motion blur

## // TODO:

- [x] Motion mask with decay: `mask`, `heatmap`, `ditheredMask`, `ascii`
- [x] Blob tracking (`blobs`): 5x5 weighted probe per slot, exclusion
      between slots; `segments` chains slots with straight→curved
      (`segmentCurve`) Béziers; `fill` runs `thermal` or `dither` inside
      boxes (`fillOutside` flips it)
- [x] Optical flow (`flow`): neighbor-matched direction in the state
      texture's GB channels, arrow field + bloom
- [x] Velocity-map motion blur: the article's velocity-scene approach —
      moving meshes are mirrored into a separate scene with a velocity
      material, then a dilated 16-tap blur runs along it
- [ ] Object smear (wagon-wheel fix) is not ported. It is scene-side: it
      needs the object's known trajectory to place ~40 ghost copies with a
      raised-cosine shutter weight
      (`opacity = (1 - cos(phase·2π)) / 2 · strength · 0.35`), fading in above
      a speed threshold.
- [ ] CPU readback for sound (article's blob-tracking-2 demo):
      `createShadingMotion().blobBuffer` is exposed for
      `renderer.getArrayBufferAsync(blobBuffer.value)` — 9 × vec4 (center,
      size, confidence).
- [ ] Input is the scene, rendered into the effect's own target each frame
      (it doubles as the background). The article's video / webcam input
      would need a source seam in `createShadingMotion`.
- [ ] `ditheredMask` draws from the shared compute mask. The article's widget
      did its own fragment-shader differencing with a different ramp
      (`threshold → threshold + 0.04`).
- [ ] `VelocityProxy` runs at `useFrame` priority -1. Move targets before
      that or velocity lags a frame. Velocity is per-object center (no
      rotation), and proxies aren't occluded by the rest of the scene — both
      are limits of the article's approach.
- [ ] `detectionScale`, `maxBlobs`, `fill`, `segments` and canvas size are
      baked in; changing them rebuilds the effect and resets the trail.
- [ ] Owns its own `RenderPipeline`, so it can't yet be chained with the
      other effects.

## // Presets

## // Features

## // Interactivity

## // Bugs
