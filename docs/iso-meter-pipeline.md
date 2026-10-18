# IsoMeter pipeline

A port of Frederik Vanhoutte's Isoverse (Ambifeuille, Dixfeuille,
Winterkammer) in the Subdivision arrangement: one three-free kernel, the
scene, headless SVG CLIs and IsoMeterCLI over them. Change the kernel first,
land every consumer in the same commit, and run `npm run iso-meter:check`.

```
@modules/isoMeter   rng/noise mirrors, lattice, pieces/*, palette remap, voxels,
                    painters, renderSvg, option schema, roll
@modules/isoMeterRender  three.js voxel objects (chunk meshes + fat lines),
                    block voxels, Winterkammer stage, voxel framing
        │                              │
  WebGPU/IsoMeter scene         scripts/iso-meter-generate.mjs   SVG → sharp → PNG / WebP / SVG
  (flat lattice, Canvas2D       scripts/iso-meter-video.mjs      SVG per frame (Winterkammer: per-frame
   Winterkammer, voxel view)                                      strokes composited) → ffmpeg
                                        │
               src/dev/server/isoMeter → src/dev/tools/isoMeter (IsoMeterCLI)
```

| Piece               | Rule                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/isoMeter` | **Three-free.** Gradient stops are passed in (`pieceFromConfig(config, { stops })`) and sampled with `@utils/paletteStops`.                                                                                                        |
| `renderOptions.mjs` | Every knob, once. Facets: `form`, `palette`. Leva is generated from it; `view`, `stackDepth` and motion are `sceneOnly`.                                                                                                           |
| Fidelity            | Palette `None` is the original, bit for bit. `iso-meter:check` holds goldens read out of the live originals; any change that moves them is a regression.                                                                           |
| Raster output       | `--display flat` (default): the flat render's SVG rasterised by sharp, no GPU. `--display voxel`: the voxel view on headless WebGPU (`scripts/lib/isoMeterVoxel.mjs`), the same `@modules/isoMeterRender` objects the scene draws. |

## The engine

A voxel `(i, j, k)` lands on the isometric triangle lattice at `a=k−j,
b=i−k, c=j−i`, six triangles per cube; each lattice cell keeps the triangle
of greatest `i+j+k` (least when seen from below), so hidden surfaces fall out
without a depth buffer. Outlines are drawn where a neighbour is missing or of
another layer, lines where orientation, depth or material changes. Lattice
orientation 0/1/2 is the cube's ±i/±j/±k face, which the voxel view reuses.

What broke exactness while porting, and must stay as it is:

- p5 `lerpColor` interpolates rounded `levels`: round after every lerp.
- Dixfeuille's first frame is frame 2 (p5 bumps `frameCount` before `draw`),
  so it builds levels 1…J; it keeps ties, Ambifeuille replaces them.
- Ambifeuille's inclusions mix the p5 LCG with `hl.random` for their rolls.
- Winterkammer: `randomFloatRange(a, b)` is `a + b·r`; every tile, and the
  background tile, is prepared twice at setup; `getPalette`'s shuffle acts on
  a copy, so it is the identity; regrowth content is the tile's RNG after
  −delay flicker rolls, then one prepare and one roll per regrowth.

Winterkammer paints onto a canvas that is never cleared, so the kernel ports
its draw loop (`pieces/winterkammer/run.js`) against a painter interface:
`createCanvasPainter` in the scene, `createSvgPainter` for stills (one SVG of
every stroke since the background), and per-frame stroke SVGs composited onto
the previous frame for video.

## Palettes

`createRecolor(stops, config)` remaps each piece's own 4-colour material
palettes. Every slot keeps its authored tone rank (the lightest slot takes
the lightest sample), so the per-face shading survives any gradient.
`layers` gives each material a slice of the gradient, `faces` one palette for
all, `strata` colours by height. `paletteBackground` and `paletteInk` take
the paper from the lightest stop and the ink from the darkest.

## Voxel view

The lattice records cubes (`createLattice({ record: true })`);
`createVoxelSet` meshes exposed faces and ink edges in chunks. During a build
chunks are meshed provisionally (neighbours are not revisited); once built,
`markAll` plus a budgeted `flush` settles them exactly. The check asserts the
chunked mesh equals a whole-set mesh. Winterkammer's voxel stage is a
reinterpretation: windows at their composition position × zoom, stacked
along the view axis in draw order.

## Voxel CLI

`--display voxel` loads three/Dawn and `@modules/isoMeterRender` only when
asked, so flat runs stay GPU-free. Stills write one image per `--views`
(`iso`, `left`, `back`, `right`, `top`); video takes `--cameraView` and
`--mode montage | build | turntable` (`turntable` needs voxel). Framing is the
scene's: an orthographic camera along +(1,1,1) whose height fits the piece
reference into the canvas, so `iso` lands exactly where the flat render does.
Turned views pivot on the block's middle, `centre + λ(1,1,1)`, which projects
to the same point in iso. Fat lines are `LineSegments2` widths in output
pixels (`width × pxPerRef × pixelRatio`) behind an MSAA pass. The
Winterkammer background block is pushed behind the stack by its own reach
plus half the stack, so it never intersects a window.

## Definition of done

- `npm run iso-meter:check`
- `npm run lint:fix`
- `npm run iso-meter:generate -- --count 3 --svg`
- `npm run iso-meter:video -- --count 1 --hold 1`
- `npm run iso-meter:generate -- --count 1 --display voxel --views iso,left --png`
- The scene still renders in the browser (human eyeball).
