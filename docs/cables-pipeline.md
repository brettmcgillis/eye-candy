# Cables pipeline

zoso95's **Hair** turtle (turtletoy.net/turtle/36d793188c, CC BY-NC-SA 4.0;
source in `src/components/scenes/WebGPU/Cables/references/hair.turtle`) as
rubber cables coming up out of one hole in the floor. One kernel, two
renderers (the WebGPU scene and the headless CLIs), CablesCLI over the CLIs —
the HyperCubes arrangement (`docs/render-workbench.md`).

```
@modules/cables          three-free: walk, lay, colours, framing, plot, roll, schema
@modules/cablesRender    three: rig (tubes, plugs, floor + hole), stage, studio
scenes/WebGPU/Cables     Leva from the schema; lays cables in a worker
scripts/cables-*.mjs     generate / video / check
src/dev/tools/cables     CablesCLI (RollWorkbench + Live tab)
src/dev/server/cables    createSchemaToolPlugin
```

## The walk (`walk.js`, `noise.js`) — a port

`layout: flat` is the reference line for line: the same 512-entry noise
table, the same 10-octave fBm, heading `ang + noise · turn` degrees, step,
then the bounds test on the position read _before_ the step (so a strand
ends one step past ±100). `Math.random` is replaced by the kernel's seeded
stream, drawn in the reference's order: the 512 table entries, then the
offset `p`. `ang` is `index · 360 / strands`, which is the reference's
`+= 0.5` at 720 strands. `npm run cables:check` runs the reference under a
stub Turtle with that stream and fails if any strand differs; keep the draw
order and loop shape exactly as they are.

Deviations, all additive: a strand stops after `maxSteps` (a static field can
trap the turtle in a loop forever), and every reference value is a knob.

`layout: tangle` is the repo's 3D extension: a second noise table (drawn
after the first and `p`) sets pitch the way the first sets yaw, both scaled
by `turn`. A strand's field is the shared field turned so its first step
leaves along its launch direction (a golden spiral over a cone of `spread`
degrees round vertical), then twisted about that direction by its `ang` —
the 3D analogue of the flat walk turning the whole field by `ang`. A strand
ends at the sphere of radius 100 or when it comes back down to the floor.

## The lay (`routes.js`) — geometric, not physics

Turtle units map to metres by `fieldSize / 200`. Each route drops down the
hole (two anchored points, where the cable rises), then follows its strand
from the hole's rim, resampled to `spacing`.

Cables are laid one at a time in a seeded order:

- **flat** — a height grid (cell = cable diameter). Where a cable meets
  cables already laid, it steers sideways toward lower ground (`drift`, with
  a smoothed velocity so it bends rather than kinks), held to its line by
  `pull` (height per metre off the route), then sits on what is under it and
  drapes over piles no steeper than `grade`. Streamlines that converge in the
  drawing become wide cable runs instead of towers.
- **tangle** — a 3D hash of cables already threaded; each point is pushed
  off any earlier cable it would pass through, sideways to its own tangent,
  with the same smoothed steering. About 2% of points still graze another
  cable.

`@modules/ropePhysics` was tried first and rejected: at these densities
(50k+ nodes, hundreds of segments per hash cell where streamlines meet) 60
cables took 4.5 s for 20 ticks and still pushed cables through each other.

## Look (`@modules/cablesRender`)

One merged tube mesh for every cable (8 sides, Catmull-Rom between nodes,
parallel-transport frames, a cone cap at the free end; subdivision drops as
the node count rises to stay near 160k rings), ControlPanel's mottled rubber
material, an instanced moulded plug on every free end (≤ 720, under the
1024-instance uniform limit), a floor with the hole cut through it over a
dark shaft, and a PMREM softbox studio tinted by `envTint`. The key light's
shadow extent is sized to the field. Meshes are rebuilt per generation, never
re-geometried.

## Framing and plot

`frameView` fits the flat layout to the turtle's canvas square, so a strand
leaves the frame where it leaves the drawing, and the tangle to its own
bounds. Views: `top` (the drawing's orientation: +x right, turtle y down),
`hero`, `low`, `side`.

`plot.js` projects every cable: `svgStyle: outline` draws both silhouette
edges (the centre pushed ± radius across the view), `centerline` one line
like the turtle. With `svgOcclusion` the stage's depth pass breaks a line
where a cable laid on top hides it. One pen per cable colour.

## Rolls and facets

`field` (layout, seed, strands, scale, turn, cone), `cables` (radius, lay,
colours, palette), `atmosphere` (floor, backdrop, studio, key light). The
scene's Leva has a roll button per facet that holds the other two.

## Scene

`useGeneration` lays cables in `utils/cables.worker.js` (a few hundred
milliseconds for 360 strands) and keeps the last generation on screen until
the next arrives; look-only keys re-dress the rig without a rebuild.
Static for now — motion is deferred.
