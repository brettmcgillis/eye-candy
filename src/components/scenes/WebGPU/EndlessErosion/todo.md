# // Endless Erosion

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Endless eroded mountain range, scrolling under a fixed frame forever.
- Rune Skovbo Johansen's Advanced Terrain Erosion Filter ported to TSL, with
  Phacelle Noise underneath it. Shared as `@modules/terrainErosion`.
- Terrain rendering ported from Fewes' raymarched heightfield Shadertoy.
- The filter is stateless: nothing is simulated over time. The sense of erosion
  in progress comes from the scroll plus the reference's own parameter tour.
- Second render path displaces a real mesh from the same baked field, so the
  filter can be reused anywhere a heightmap is wanted.

## // TODO:

- [ ] Blue-noise dither texture; the pixel hash stand-in bands on gradients.
- [ ] Debug layer is raymarch-only; the mesh view has no equivalent.
- [ ] Tree channel is a mask, not geometry — consider real instanced trees.

## // Presets

- [x] Endless Erosion — the reference's animated tour on the long lens.
- [x] Low Ridge — the reference's closer, wider second camera.
- [x] Ridge Map — the filter's drainage by-product, unshaded.
- [x] Paint Mountains — mouse-painted base, scroll stopped.
- [x] Displaced Mesh — same field as real geometry.
- [x] Unfiltered Base — strength at zero, the argument for the filter.

## // Features

- [x] Raymarch and mesh views over one baked field.
- [x] Endless scroll split into integer bake offset and fractional read offset.
- [x] Animated erosion parameters and waterline on independent cycles.
- [x] Full control surface over the filter, base noise, palette and sun.

## // Interactivity

- [x] Drag to raise terrain, shift-drag to lower, in paint mode.

## // Bugs
