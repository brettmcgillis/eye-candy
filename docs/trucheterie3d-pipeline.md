# Trucheterie3D pipeline

Trucheterie3D is the Trucheterie blob field built as real tubes: every lane a
tube, every pen stroke a wire, or both. It is a separate scene (not a 2D/3D
toggle on Trucheterie, for the reason IsoLines and IsoLinesRelief are split)
over the 2D generator, `@modules/trucheterieBlob`, which it uses unchanged
apart from a `weave` flag on the lane-channel solve. Run
`npm run trucheterie3d:check` after changing anything below, and
`npm run trucheterie:check` after touching the shared blob modules.

## The shape

```
@modules/trucheterieBlob        the 2D generator: field, lane radii, families, lane channels
@modules/trucheterie3d          three-free: tube solve, heights, crossings, verify,
                                mesh sweep + profiles, schema, roller, framing, growth
@modules/trucheterie3dRender    createTubeRig: wraps the mesh, lane colours,
                                material, studio PMREM, floor; camera + lighting
        │                               │
  WebGPU/Trucheterie3D scene      scripts/lib/trucheterie3dRender.mjs
  (Leva generated from schema,      ├─ trucheterie3d-generate.mjs   stills per view
   tube solve + sweep in a worker)  ├─ trucheterie3d-video.mjs      growth / flow / turntable
                                    └─ trucheterie3d-check.mjs
            src/dev/server/trucheterie3d → src/dev/tools/trucheterie3d (Trucheterie3DCLI)
```

| Piece                          | Rule                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@modules/trucheterie3d`       | **Three-free.** May import only `@modules/trucheterieBlob`. The check enforces it. The mesh lives here (plain typed arrays) so a worker can build it and an STL export can reuse it. |
| `@modules/trucheterie3dRender` | The only home of the look. `createTubeRig()`: `setTubes({ config, field, tubes, mesh? })`, `apply`, `setGrowth`, `setPalettePhase`, `updateEnvironment`, `setShadows`.               |
| `renderOptions.mjs`            | The 2D field/palette specs re-foldered, plus form, stage, motion, lighting and render keys. Facets: `structure`, `palette`, `form`, `atmosphere`.                                    |
| Keys                           | `TUBE_KEYS` change the solve, `MESH_KEYS` the sweep; anything else only re-dresses (colours repaint, transform moves). Scene keys match the 2D scene's, so a seed carries over.      |

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

- STL export (the mesh is ready; touching tubes and loose rings would print
  as separate parts until something bonds them).
- Spectrum flow in the shader rather than as CPU repaints.
- Weave dips are locally steep (rise over run ~4–6) at a few grid-corner
  crossings per field.
