# Trucheterie3D pipeline

Trucheterie3D is the Trucheterie blob field built as real tubes: every lane a
tube, every pen stroke a wire, or both — or the lanes as one inflated
membrane, every stroke pinned as a seam (see Membrane below). It is a separate scene (not a 2D/3D
toggle on Trucheterie, for the reason IsoLines and IsoLinesRelief are split)
over the 2D generator, `@modules/trucheterieBlob`, which it uses unchanged
apart from a `weave` flag on the lane-channel solve. Run
`npm run trucheterie3d:check` after changing anything below, and
`npm run trucheterie:check` after touching the shared blob modules.

## The shape

```
@modules/trucheterieBlob        the 2D generator: field, lane radii, families, lane channels
@modules/trucheterie3d          three-free: tube solve, heights, crossings, verify,
                                mesh sweep + profiles, membrane strips, schema,
                                roller, framing, growth, inflate clock
@modules/trucheterie3dRender    createTubeRig: wraps the mesh, lane colours,
                                material, studio PMREM, floor; camera + lighting;
                                createMembraneSolver (GPU inflation)
        │                               │
  WebGPU/Trucheterie3D scene      scripts/lib/trucheterie3dRender.mjs
  (Leva generated from schema,      ├─ trucheterie3d-generate.mjs   stills per view
   tube solve + sweep in a worker)  ├─ trucheterie3d-video.mjs      growth / flow / turntable
                                    └─ trucheterie3d-check.mjs
            src/dev/server/trucheterie3d → src/dev/tools/trucheterie3d (Trucheterie3DCLI)
```

| Piece                          | Rule                                                                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@modules/trucheterie3d`       | **Three-free.** May import only `@modules/trucheterieBlob`. The check enforces it. The mesh lives here (plain typed arrays) so a worker can build it and an STL export can reuse it.                                                 |
| `@modules/trucheterie3dRender` | The only home of the look. `createTubeRig()`: `setTubes({ config, field, tubes, mesh? })`, `apply`, `setGrowth`, `setPalettePhase`, `updateEnvironment`, `setShadows`.                                                               |
| `renderOptions.mjs`            | The 2D field/palette specs re-foldered, plus form, stage, motion, lighting and render keys. Facets: `structure`, `palette`, `form`, `atmosphere`.                                                                                    |
| Keys                           | `TUBE_KEYS` change the solve, `MESH_KEYS` the sweep, `MEMBRANE_KEYS` only move the membrane's simulation; anything else only re-dresses (colours repaint, transform moves). Scene keys match the 2D scene's, so a seed carries over. |

## The solve (grid units: one micro-cell = 1, y down, z up)

1. **Strands** (`strands.js`): every lane (mid radius, width one pitch) and
   every stroke of every family as a circular arc on its wedge (start
   `edge·π/2`, span 2π / π / π/2), clipped to what 2D shows: the second
   family loses the span inside the first's disc (`d ≤ rMax0`), unless the
   cell weaves. Odd half-pitch discs become beads.
2. **Chains** (`chains.js`): arcs meet cell edges square, so ends are joined
   by key (crossing point + direction). Keys with more than two ends (strokes
   meeting at a grid corner) are left unjoined. End types: `cut` (a lane
   stopped by a T-junction), `dead` (unmatched), `weld` (a stroke cut by a
   T-junction — it stops on the outline stroke it meets — or crowding a
   grid corner: in 2D these touch, so they fuse). Samples every
   0.375 / pathsPerUnit and every π/48 of turn — never coarser, the solve
   resolves against them.
3. **Heights** (`heights.js`): per-piece targets (`flat`, or `terrace` = one
   step per ring; dome and bowl modes were tried and dropped), a slope-limited envelope
   (`maxSlope`: the low side is lifted into a skirt, peaks keep their
   height), then a triangle-kernel ramp along each chain (`rampLength`).
   Ring-index heights alone jump several pitches where a strand enters a big
   cell beside its pivot corner; the envelope is what keeps them walkable.
4. **Taper** (`retract.js`): each open end narrows to the room it has, as
   the 2D lane narrows into its junction — in plan width only (half-height
   stays), so a ribbon ends as a rounded blade, never a spike. Walking in
   over its own half of the chain, a sample's half-width is the smallest
   plan clearance seen between it and the end; only where even 30% of a tube
   will not fit is the end walked back (a handful of crumb slivers per
   field). Each end must taper only its own half, or a sliver too thin for
   a full tube carries the far end's zero room back and vanishes, leaving
   its bounding strokes bare. Every open stroke end is a `weld` and only
   makes room for lanes; with lanes + wires, a lane cut by a T-junction is
   `fused`: it may reach the outline stroke's centreline, half-embedded, as
   the 2D lane meets its outline. Contact zones mark both kinds of joint.
5. **Snap, lift, follow**: lane ends cut by a T-junction ease onto the
   height of what they meet (their cell's first family), never steeper than
   `maxSlope`. Then lanes are lifted at crossings; then each stroke takes
   the mean height of its own family's lanes beside it (so a stroke dips
   with its lane under a weave), smoothed; then strokes alone are lifted
   clear of anything left, lanes pinned. With no lanes, strokes snap their
   own welds instead.
6. **Crossings** (`crossings.js`): anything still too close in plan is a real
   crossing — Weave, a grazing near-tangent T-junction, or strokes at a
   corner. Over/under is the 2D rule (first-drawn family over) in the cell
   the crossing sits in, voted once per crossing cluster; unresolved clusters
   follow whichever strand is already higher. Lifts are symmetric (over up,
   under down) so the piece reads from both sides, annealed (overshoot and
   smoothing taper off), then push-only until clear.

### Invariants (what `verifyTubes` and the check assert)

The membrane has its own: the skin covers the 2D lanes' ground (IoU ≥ 0.99),
at most 0.1% of its plan triangles fold back (cut ends), and every
strip-edge vertex is pinned or welded. A headless solve keeps seams fixed
and welds whole, lifts the lanes, and comes back down with the pressure off.
A balloon inflates both skins apart, holds its seams, and keeps each skin on
its own side. Every finish draws, validated, at subdivision levels 0–2.

- No two tubes closer than the sum of their radii in 3D. Samples within π·R
  of each other along one chain (in plan) are exempt: a tube may bend.
- Every chain is a loop or has two ends that take hemispherical caps
  (sized to the tapered radius there).
- Clearance is elliptical: plan half-widths across, half-heights up.
- Joints are not collisions: a welded stroke end against what it meets, a
  fused lane end against its outline stroke.
- Why it holds: lane centrelines are at least one pitch apart in plan, so a
  round tube of radius ≤ pitch/2 can never touch another whatever the
  heights; the only exceptions are open ends (taper) and crossings (lift). Every profile fits inside its unit circle (ribbon height ≤ 1).
- Lanes + wires: `R_lane + R_wire ≤ pitch/2`, built into `tubeRadii`.
- Weave holds lane thickness to `WEAVE_MAX_THICKNESS` (0.9): at full width
  the lanes touch edge to edge and three-way contacts at grid corners have
  no solution.

## Membrane

`lanesAs: membrane` swaps the lane tubes for one single-surface skin,
inflated by a port of `~/dev/examples/260421_CatenaryCanopy`'s solver. The
user's calls (2026-10-08): strokes are seams (quilted, each lane billows on
its own), a faithful single surface lifted straight up (not a closed
two-skin pillow), a mode of this scene, and inflation is the motion.
`buildForm` is the one entry point: tubes, or the membrane plus — with
`strands: both` — the wires solved alone, capped and flat, as piping in the
seams. A membrane is always Cap and flat; Weave and Terrace do not apply.

- **Strips, not a triangulation** (`membrane.js`). Each lane chain is a
  structured strip: columns are the chain's samples, `membraneRows + 1`
  rows run across the lane. Lanes are concentric arcs, so each column's
  rows run radially from one seam to the other and the seams are the 2D
  strokes exactly. Strips meet only on pinned seams, so no welding is
  needed between them.
- **Its own lane pieces.** The tube solve clips a second family's lane at
  its mid radius. A rim that bites only partway into a lane would then
  split it into two overlapping strips. Here a lane is cut only where the
  occluding disc covers its whole width. Each column then takes the part
  of its ray outside the disc (`radialSpan`), so the rim becomes that side's
  seam and a cut end narrows to a point on it.
- **Pins**: every strip-edge row that lies on a stroke, plus the end
  columns of open chains. A row at radius 0 (a corner family's lane 0
  wrapping a grid point) is pinned when only part of the wrap is there,
  because a stroke ends on that point. A whole-disc wrap (a loop of nothing
  but pivots, and beads) has a free centre split across its columns. Those
  copies are a weld group, averaged after every relaxation pair, or the
  dome tears open.
- **Solve** (`membraneSolver.js`, TSL compute). Per substep, as in the
  reference: a uniform +Z lift `pressure · scale · (1 + crown · crownBias)`
  (not normal pressure), velocity damped by `exp(-damping·dt)`, spring
  corrections on the triangle edges (rest = flat length, half each side, or
  whole against a pin), then velocity = Δposition / dt. Pressure eases to
  its target at `pressureResponse`. The reference relaxes springs one after
  another; here every vertex gathers its own springs (Jacobi), with the same
  per-spring magnitudes. Neighbours are implicit in the strip layout, so
  there are no adjacency buffers. The sim runs in lane units (pitch = 1),
  where the reference's defaults land at its own mesh scale.
- **Motion.** `inflate` holds pressure on for `inflateSeconds`, then off for
  `deflateSeconds`; with no gravity, the springs pull the skin back toward
  flat. Other modes inflate once and hold. The rig stops stepping once
  pressure has held at its target for a few seconds, and wakes when a
  membrane knob or the target moves. The CLI settles a membrane before a
  still; video mode `inflate` steps it from flat at 1/fps.
- **Balloons** (`membraneSides: double`). `sewBelow` repeats every strip as
  a bottom skin with the same seams, so the two skins are sewn wherever the
  top is pinned. Every vertex carries its skin's side (rest flags:
  pinned + 2 · bottom), and the lift pushes each skin away from the other.
  By symmetry the skins meet on the seams' plane, so the relaxation holds
  each one on its own side of it. Without that, normal pressure pushed the
  skins through each other beside the seams. That contact is the only
  addition to the reference's physics, and only for balloons.
- **Pressure direction** (`membranePressureMode`). `lift` is the reference:
  straight up, or straight down for the bottom skin. `normal` pushes along
  each skin's own normal, as gas does on a balloon. It needs a normals pass
  on the sim grid every substep. It works on a single skin too.
- **Display** (`membraneDisplay.js`, `membraneLevels.js`). The reference
  draws through its render topology: Loop subdivision with the outline as a
  crease, then `level` Laplacian passes at 0.18 that skip creases, then
  pinned sim vertices snapped back. Every strip edge is a crease here. The
  strips stay regular triangulated grids at every level, so each level is a
  fixed-stencil GPU pass over a 2× finer grid instead of per-vertex stencil
  tables (~150 MB at level 1 for this mesh). Normals come off the finest
  grid by central differences, as the reference's `computeVertexNormals`
  would. Along a row collapsed to a point the row tangent is taken from the
  next row in, or rounding noise flips the normal. Levels run 0–2 (the
  reference allows 4): each level quadruples the triangles, ~2.9M at level
  2 and 3 paths per unit. The subdivision level and the finish re-dress the
  drawn skin without restarting the simulation. Unlike the reference,
  interior edges joining two crease vertices (the diagonals at an open
  strip's corners) are not creased.
- **Finish** (`membraneFinish`). `palette` dresses the skin like the tubes.
  `foil` and `matte` are the reference's two MeshPhysical styles, including
  its "egg iridescence" thin-film tint, ported from its `onBeforeCompile`
  GLSL to TSL (`iridescence.js`). `tintedFoil` lays the foil over the lane
  colours instead of the reference's near-white. Their environment strength
  only applies through the material's own `envMap`, so the rig hands them
  the studio PMREM. The film's world normal follows `faceDirection`, so a
  balloon's underside shimmers too.
- **Cost.** About 255k vertices at the default 6 paths per unit, and ~90
  dispatches per frame. Headless Dawn takes ~45 ms per frame there and
  ~28 ms at 3 paths per unit, so the membrane presets use 4. A balloon
  doubles the vertices (~45 ms at 3 paths per unit). The display passes
  run only when the solve steps.

## Look

- One merged mesh in centred grid units, placed by its transform
  (`planeRotation`, `blobCanvasSize`), so neither rebuilds it. Rings are
  decimated where a strand runs straight and level, its taper and colour
  hold; a ring is kept every 0.05 rad of turn, finer than that reads as
  faceted.
- The tube Mesh is created when geometry first arrives and replaced on
  rebuild — never an empty placeholder: WebGPU caches a render object's
  attributes from its first draw, so a placeholder keeps drawing nothing.
- Vertex colours are the 2D lane colours (`resolveLaneColors` /
  `laneColorAt`, with Weave's joins), so a seed wears its 2D palette; wires
  take the stroke colour. The channel solve is cached per field, so a
  drifting palette only re-picks colours.
- Growth: each vertex carries the moment its centreline sample appears
  (a front from the field's centre, along each chain); the material
  collapses unreached vertices onto the centreline, so tips taper. Shadows
  follow it.
- Physical material (clearcoat plastic by default) over a baked studio
  PMREM; a key light casts shadows onto a floor `floorGap` below the lowest
  tube; a hemisphere fill keeps the underside readable for the `under` view.

## Scene

The tube solve and the mesh sweep run in a worker
(`utils/tubes.worker.js`), latest request wins; the main thread only wraps
the arrays and paints colours. `motionMode`: `grow` loops the extrusion,
`flow` drifts the palette (repaint rate backs off so it takes at most a
quarter of the frame; Spectrum is the costly mode).

## Not yet

- Membrane: seams at terrace heights; pinning every Nth stroke for wider
  pillows; thickening for print (a balloon is already a closed volume per
  lane, but each one only touches the next at a seam).

- STL export (the mesh is ready; touching tubes and loose rings would print
  as separate parts until something bonds them).
- Spectrum flow in the shader rather than as CPU repaints.
- Weave dips are locally steep (rise over run ~4–6) at a few grid-corner
  crossings per field.
