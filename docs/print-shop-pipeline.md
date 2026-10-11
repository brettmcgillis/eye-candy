# PrintShop pipeline

PrintShop turns pieces of scenes into files a print service or slicer takes:
STL (geometry), 3MF (geometry + per-part materials, or per-vertex colour when
a piece is textured) and GLB (a viewable twin). It is a dev tool
(`src/dev/tools/printShop/`, `/dev/print-shop`) with a headless CLI over the
same code. Nothing here ships. Run `npm run print-shop:check` after changing
anything below, or the cloth/ghost element files it mirrors.

```
src/dev/tools/printShop/
  kernel/            three-free mesh pipeline, mm and Y-up throughout
    assemble.js      printable → scaled, trimmed, thickened, mounted, checked model
    clip.js          keep a surface where a field ≥ 0 (welded, manifold cut)
    surface.js       island removal, fold detection
    solidify.js      open sheet → closed shell (front/back skins + edge walls)
    stance.js        hem levelling (tilt + trim search for a stable stance)
    primitives.js    bases, flared stems, loops
    csg.js           booleans via manifold-3d (env.manifold), parts traced through
    marks.js         signature marks (argyle, Bret, Reversal) → two-layer prisms
    marks/*.json     Bret/Reversal outlines baked by scripts/print-shop-marks.mjs
    thumbnail.js     software-rasterised gallery preview (same in CLI and page)
    checks.js        watertight/manifold/shells/volume, ray casts, stability
    profiles.js      material rules of thumb (min/recommended wall, build size)
    printOptions.js  the shared option table + createPrintSchema(printable)
    writers/         STL, 3MF (stored zip), GLB
  printables/
    index.js         glob registry: ./*/printable.js
    ghost/           Gh0st: settle.js (CPU cloth), surface.js (cut + colour)
  printShop.worker.js  the page's builder (same kernel as the CLI)
scripts/print-shop-export.mjs   CLI; batches variants × sizes; --job for the tool
scripts/print-shop-check.mjs    drift checks
scripts/print-shop-marks.mjs    re-bake the mark outlines from public/models
src/dev/server/printShop/       job runner: spawns the CLI per batch
```

## Adding a printable

One folder, `printables/<id>/printable.js`, default-exporting:

| Field           | Meaning                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `label`   | slug and display name                                                                                                                                            |
| `source`        | the scene it comes from (shown in the picker)                                                                                                                    |
| `variants`      | names the CLI can batch over (usually the scene's preset keys), or omit                                                                                          |
| `options`       | its own specs, built with `@modules/optionSchema` (`num`, `choice`, `flag`); sections and `when` work as in every workbench                                      |
| `defaults`      | overrides for shared option defaults (`{ mount: 'base', size: 80 }`)                                                                                             |
| `sectionLabels` | labels for its own sections                                                                                                                                      |
| `build(o, env)` | async; returns a **piece** in the scene's own units, Y-up. `env.loadImage(url)` → `{ width, height, data }` RGBA (sharp in the CLI, OffscreenCanvas in the page) |

A piece is `{ surface, parts, vertexColors?, mountAxis?, stats?, warnings? }`:

- `surface` — an **open** indexed sheet (`kernel/mesh.js` shape). The kernel
  thickens it; its winding's front face is the `front` skin. Attributes it
  may carry: `rest` (xyz on the flat/rest sheet — enables fold detection),
  `front` / `back` (sRGB per vertex, used when `vertexColors` is true).
- `parts` — `{ front, back, edge, mount? }`, each `{ label, color }`: the
  3MF base materials and GLB materials.
- `mountAxis` — `[x, z]` the base stem / loop hang from (default: through the
  highest point).

The page, worker and CLI pick it up with no other change. A piece that is
already a closed solid is not supported yet: extend `assemble.js` with a
`solid` path rather than faking a sheet.

## The shared stages (`assemble.js`)

1. **Scale** so the piece's extent along `sizeAxis` is `size` mm.
2. **Hem** (mount `hem`): `levelHem` searches tilts (5° steps to 30°, nearest
   upright first) and trims (1 mm steps from `hemTrim`) for the first stance
   whose area centroid sits ≥ 3 mm inside the convex hull of the cut's edge
   crossings, then clips there and **rescales** so the standing piece is
   `size`. Only true crossings count as feet: vertices that merely graze the
   cut height once put the centroid "inside" a footprint that was not there.
3. **Clean**: drop specks under `minIsland` mm², and with `loose: drop` keep
   only the largest piece (torn-off cloth floats in a scene, falls out of a
   print).
4. **Folds**: two points closer than the wall whose rest positions are more
   than 3 walls apart are a fold — the skins will overlap there. Reported and
   drawn red in the preview; slicers union them, but they are where a print
   fuses.
5. **Solidify** at `wall` mm, centred on the sheet.
6. **Bodies** (`planMounts`, `planSignature`, then `csg.js`). Every mount
   and signature is a real boolean through manifold-3d, so each body is one
   watertight shell (three-bvh-csg left T-junctions here). Manifold keeps
   each output triangle's source (`runOriginalID` + the `faceID` we feed
   in), which is how parts and baked colours survive; its output splits
   vertices at property seams, so `toModel` re-welds with
   `mergeFromVert`/`mergeToVert` or the result reads as thousands of open
   edges.
   - `base` + `standJoin: fused`: disc and a stem flaring 45° into a pad whose
     top sits in the wall all round, unioned with the shell — one piece.
   - `base` + `removable`: the stand (disc ∪ stem) is its own body. The piece
     gains a flared sleeve hung from the inside of the head, bored to
     `stemRadius + socketFit`, `socketDepth` deep; the stem tip stops
     `socketFit` short of the bore top. The check measures the assembled
     overlap (0) and that a raised stand hits the bore.
   - `loop`: an upright torus sunk into the top, unioned.
7. **Signature**: a two-layer mark (`marks.js`) — the base outline cut
   `signatureDepth`, the glyph twice that — on the stand base's underside
   (always cut, so it still sits flat; mirrored correctly via a right-handed
   surface frame) and/or the piece's back, found by a ray from −Z at
   `signatureHeight`. On the piece it is cut or raised (`signatureStyle`)
   and capped at 3/8 of the wall when cut. Size 0 = auto (base: 30% of the
   disc; piece: 14% of its height). Bret and Reversal are flat outlines
   projected from their GLBs' faces (the meshes are not closed solids, so a
   projection of the solid was not an option).
8. **Seat** the assembly on the bed (centred, lowest point at 0); exports
   re-seat each body on its own bed (`seatModel`). **Check** each body:
   watertight (every directed edge once, its reverse once), one shell,
   build size; then wall vs the material profile, folds, and stability for
   `hem`. Every warning ends in "Fix:" naming the controls that resolve it.

Writers: STL and 3MF rotate +Y onto +Z (a proper rotation, winding kept);
GLB stays Y-up in metres with COLOR_0 linear.

## Outputs and the page

- One folder per print: `<name>.{stl,3mf,glb}` for the piece,
  `<name>-stand.*` for a removable stand, `<name>.png` (the software
  thumbnail) and `props.json` (`name`, `printable`, `options`, `files`,
  `report`). The CLI writes it; the page's **Generate print** and **Generate
  batch** both queue the CLI as a job.
- The page is a render workbench: settings left, results right as the shared
  `ResultsPanel` with a leading **Preview** tab (`leadingTabs`). Transient
  and Saved are the shared gallery; the job service runs with
  `itemFolders: true`, so keeping or deleting a print moves its whole
  folder, and saved prints live in `output/print-shop-workbench/saved`
  (served at `/print-shop-saved`, never `public/`).
- Preview tools (draw only, never the print): shading (colour / clay /
  normals), backdrop (grey / light / dark), a section plane with the cut
  wall drawn in orange (back faces) for checking wall, socket and stem fit,
  explode (drops the stand away), wireframe and fold markers.

## Gh0st

- **Pose is a settled drape, not a capture.** `settle.js` runs
  GhostCharacter's frame loop (`@elements/WebGPU/ghost/ghostRig`, the same
  `stepGhostRig` the element calls) at 60 fps with six cloth steps per frame,
  as ClothMesh does at 360 Hz, over `clothCpu.js`. Wind uses the frame time.
  `calm` zeroes bob and sway; `animation` + `animationAt` capture that far
  into a wave/clap.
- **The CPU cloth is a mirror, not an approximation.** `clothTopology.js` is
  the one CPU construction both `createClothSimulation` and `clothCpu` use;
  `clothCpu` steps the same two passes in the same order, including the TSL's
  quirk of reading its pre-collision force copy while subtracting from the
  stored velocity. The check holds it to the GPU within 1e-5 over 5 frames
  in Dawn. Over a full settle, f32-vs-f64 rounding grows (cloth is chaotic),
  so a print is a faithful drape of that preset, not the frame on screen.
- **Surface** = the GPU's render mesh (one vertex per quad at its corners'
  mean, then the group's squash and tilt), refined `detail`× with
  Catmull-Rom, cut where the scene would draw it at ≥ `threshold` opacity:
  vertex alpha (edge fade, holes, tatter), the per-pixel smoothEdges noise
  and the eye cutouts, all from the same functions/constants the shader
  uses. The domain field puts the rim exactly on the outermost drawn
  vertices.
- **Sides**: the GPU winding's front face is the ghost's inside (ClothMesh
  marks `frontFacing` as inner), so `front` = inside colour, `back` =
  outside. Textures are composited as ClothMesh does: a node-sampled texture
  is not sRGB-decoded, so raw texels mix with the linear base colour and the
  result is sRGB-encoded — what a viewer of the scene sees, minus lighting.
- The cloth has no self-collision, so some presets (Nebula, Tinfoil, Starfield)
  pass their hem through itself; expect many fold spots there.
