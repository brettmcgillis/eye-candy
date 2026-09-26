# // Dither

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

Port of Maxime Heckel's
[The Art of Dithering and Retro Shading for the Web](https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/).
Core logic in `src/modules/tsl/dither/`, fullscreen pass in `Dither.jsx` (this
folder). Pipeline: pixelate → threshold map (`pattern`) → color reduction
(`quantize`) → optional CRT finish (`crt`) → optional Bloom (`bloom`).

## // TODO:

- [x] Patterns: `whiteNoise`, `bayer2` / `bayer4` / `bayer8`, `blueNoise`
- [x] Quantize: `threshold` (1-bit), `grayscale`, `color` (per channel),
      `palette` (grayscale level → palette color, Acerola's approach),
      `hueLightness` (Alex Charlton's two-nearest-hues dither)
- [x] Pixelization (`pixelSize`)
- [x] CRT: XorDev's staggered RGB-cell mask (`maskIntensity`,
      `maskBlending`, `maskBorder`), chromatic `spread`, scanlines, `shake`,
      curved bezel (`curve`)
- [x] Each demo nudged its threshold differently: `ditherOffset` is added,
      then `ditherStrength` scales it. Defaults per `quantize` (and for
      `crt`) match the demos.
- [ ] Bayer lookups index the pixelated sample position, as the article does,
      so at `pixelSize` ≥ 2 only some matrix entries get used (`bayer2` at
      `pixelSize: 2` reads a single entry and goes flat). The article calls
      this out as expected. Option: index by output-pixel cell instead.
- [ ] Blue noise is generated in code (void-and-cluster, 64², ~150 ms on first
      use, cached) instead of the article's 128² `bn.png`. Bake it to a file
      if the first-use hitch matters.
- [ ] Default `palette` is Game Boy DMG green — the article's `palette.png`
      was not downloaded. `palette` / `huePalette` take hex strings (or linear
      `[r, g, b]` for `huePalette`); length is baked, colors update live.
- [ ] `threshold` defaults (`ditherOffset` 0.7 bayer / 0.85 blue noise) come
      from bright demo scenes and read almost all black on dark scenes.
- [ ] `curve` only shapes the bezel. Sampling through the curved UV is the
      article's aside — it shows cell artifacts at small `pixelSize`.
- [ ] `bloomRadius` has no match for the article's pmndrs
      `luminanceSmoothing: 0.9`; tune by eye.
- [ ] Error diffusion (Floyd–Steinberg) skipped, as in the article — it is
      sequential. A compute pass per row could do it.
- [ ] Owns its own `RenderPipeline`, so it can't yet be chained with the
      other effects.

## // Presets

## // Features

## // Interactivity

## // Bugs
