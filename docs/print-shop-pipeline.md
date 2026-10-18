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
scripts/print-shop-models.mjs   re-bake scene GLBs a printable poses (pigeon + camera head)
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

A printable may also declare `mounts` (the mount choices it offers) and
`signatureSpots` (`baseTop`, `baseUnder`, `inside`, `back`); options that only
serve the others drop out of its form and CLI.

A piece is either a **sheet** — `{ surface, parts, vertexColors?, mountAxis?,
lattice?, stats?, warnings? }` — or **solids** — `{ solids, solidParts,
mountColor?, markColor?, vertexColors?, stats?, warnings? }`:

- `surface` — an **open** indexed sheet (`kernel/mesh.js` shape). The kernel
  thickens it; its winding's front face is the `front` skin. Attributes it
  may carry: `rest` (xyz on the flat/rest sheet — enables fold detection),
  `front` / `back` (sRGB per vertex, used when `vertexColors` is true).
- `parts` — `{ front, back, edge, mount? }`, each `{ label, color }`: the
  3MF base materials and GLB materials.
- `mountAxis` — `[x, z]` the base stem / loop hang from (default: through the
  highest point).
- `solids` — closed meshes in scene units, each `{ positions, indices,
colors, part }`; `solidParts` names their parts in order (`{ id, label,
color }`). The kernel scales them, fills any hollow part (its cavities are
  dropped, so a shell around another part fuses with it), unions them with
  the mount and signature, and — with no mount — cuts the feet flat by
  `footTrim` so it stands. Mount `plinth` is a disc under whatever reaches
  within `plinthSink` of the bottom, sunk that far in.

The page, worker and CLI pick it up with no other change.

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
   - `base` ("Base + stem, one piece"): disc and a stem flaring 45° into a pad whose
     top sits in the wall all round, unioned with the shell — one piece.
   - `socket` ("Base + stem, two pieces"): the stand (disc ∪ stem) is its own body. The piece
     gains a flared sleeve hung from the inside of the head, bored to
     `stemRadius + socketFit`, `socketDepth` deep; the stem tip stops
     `socketFit` short of the bore top. The check measures the assembled
     overlap (0) and that a raised stand hits the bore.
   - `rest` ("Base + stem, two pieces (flat rest)"): the piece gains a
     flat-bottomed platform hung inside the head (`restRadius`, auto from
     the stem and piece size); the stand's stem flares 45° to a flat top of
     the same radius, `restGap` below it. The check confirms the two clear
     each other and bear when the stand is pushed up.
   - `loop`: an upright torus sunk into the top, unioned.
   - Booleans can leave zero-volume slivers where faces only graze; they
     are dropped after every body's boolean.
7. **Signature**: a two-layer mark (`marks.js`) — the base outline cut
   `signatureDepth`, the glyph twice that — at any of four spots, each a
   flag: **base top** (in front of the stem, reading upright from the
   front; cut or raised), **under the base** (always cut, so it sits flat),
   **inside the piece** (cut into the underside of a flat platform hung in
   the head — the same platform the "flat rest" stand seats on; one-piece
   and socket stands fill that space, so they warn instead), and the
   **back** (curved: the cutter is refined and warped to follow the
   surface, so the depth holds to its edges). Size 0 = auto per spot.
   Bret and Reversal are flat outlines projected from their GLBs' faces
   (the meshes are not closed solids).
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

- **Colour is what the scene shows, minus lighting**: albedo (textured,
  eyelined) plus the emissive glow ClothMesh adds per side
  (`colour × intensity × (1 − d·falloff)²` from `emissiveCenter`), clamped,
  sRGB-encoded. Part colours (3MF base materials) are each side's average.
  `textureProjection: 'screen'` projects through GhostBuster's default
  camera ((0, 1, 3.5) on the origin, fov 50) at `screenAspect`; TSL's
  `screenUV` was measured headlessly to run from the top-left, y down.
- **Wireframe** (`debugWireframe`, i.e. Matrix; or forced with Surface →
  Wireframe): struts of `strutRadius` along every edge of the render
  mesh's live triangles whose ends both show, balls at the nodes
  (`kernel/lattice.js`). The preview overlays them (`env.previewLattice`);
  a print unions them in manifold (~20 s for Matrix). Hem and back
  signatures do not apply to a wireframe.

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

## Surveillance pigeon

- **Models are baked, not loaded**: `npm run print-shop:models` decodes
  `pigeon.glb` and `security_camera.glb` (Draco, WebP), samples each texture
  onto its vertices, keeps what `CameraHead` keeps (the two highest meshes,
  raw geometry), welds and **closes** the camera's open shells (planar caps,
  nested openings as one cap with holes, a second pass for outlines that
  touch themselves, zero-area slits zipped by splitting their edge) and
  writes three.js JSON next to the printable.
- **Posing is three's own**: ObjectLoader rebuilds the rig; the root bone
  and skinned mesh hang straight off one group as `FakeBird` renders them;
  `AnimationMixer.setTime` + `applyBoneTransform` pose it; the camera head
  takes FakeBird's neck/head joint-triangle aim with the scene's
  `camScale`/`camOffset`/`camRot`, then CameraHead's pan and unit-box
  normalisation. Poses are named moments of the idle clip and the camera
  sweep (±`sweepRange`); Custom takes any clip time and pan.
- The legs are the weak point (~0.62 mm at 60 mm tall); the printable warns
  against the material's minimum and comfortable thickness with the size
  that clears each.
- Colour is per triangle corner (`cornerColors`), so the base and signature
  keep flat colours where they meet the textured feet.
