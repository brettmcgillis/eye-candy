# Rope physics

`@modules/ropePhysics` is a three-free CPU Verlet/position-constraint rope
core. ControlPanel is its first consumer; socket families, plugs, patching
probabilities, styling and background treatment remain in ControlPanel.

`createRopeWorld(descriptions, options)` takes ropes with flat xyz `points`,
`length`, `radius` and optional `endRadii`. It exposes typed `positions`,
`previous`, inverse `mass`, `radii`, `ropes` (start/count) and segment indices.
Options include gravity, damping, bending, iterations, axis-aligned box
colliders, a y-floor and `minCellSize` (the contact hash's floor, 0.1 by
default; SurveillanceState passes 0 so its 5 cm segments hash into small cells,
which halves its settle time). No Three, React, GPU readback or browser APIs.

- `anchor(node, xyz | null)` pins/unpins an endpoint or any other node.
  ControlPanel pins an endpoint and its neighbour to hold a plug exit axis.
- `grab(node, xyz)`, `move(xyz)` and `release()` provide a temporary hand pin.
  The hand pin follows pointer updates immediately; neighbouring free nodes
  deform with it between anchors to avoid a long trailing segment. Kinematic
  points stay pinned during constraints; free-particle velocities remain bounded.
  ControlPanel automatically lifts over controls and grows cable length when
  dragged beyond reach.
- `setLength(ropeId, length)` updates distance/bending constraints and collision
  broad-phase bounds. Consumers persist the new length in their descriptions.
- `step(delta)` accumulates 1/120-second ticks with bounded catch-up;
  `settle(ticks)` advances exact ticks. A quiet world sleeps; `wake()` and
  interaction wake it, and `rest()` sends a world restored to a settled
  shape straight to sleep (ControlPanel's Scroll composes its cables so). `setBoxes(boxes)`
  rebuilds the solid contacts for a scene whose solids change under its
  ropes (ControlPanel's Swap, as modules come and go). Solver and collision arrays are reused.
- `snapshot()` / `restore(snapshot)` preserve versioned positions and previous
  positions for exact shape/velocity restoration. Consumers separately retain
  rope descriptions and anchor ownership, rebuilding the same topology first.

Distance constraints limit stretch; second-neighbour constraints resist sharp
bending. Endpoint particles can have larger collision radii and lower inverse
mass. A spatial hash limits segment self/inter-rope collision candidates;
adjacent segments of the same rope are excluded. Contacts use previous
separation directions to resist side swaps. Static solid contacts use a coarse
2D broad phase and expanded box boundaries.

This is a bounded discrete solver, not an exact knot-topology engine. Free-particle
movement is limited, but arbitrarily violent hand movement, low iteration settings
or extreme density can still cause overlap/stretch. Control colliders are
conservative envelopes rather than triangle-mesh collisions. Profile the real
consumer before raising particle counts or solver iterations.

ControlPanel's inventory check covers dragging a solo lead into a bay,
unplugging either end, immediate dragging, stretching, mixed-size Inventory
connections, loose-cable floor retention, exclusive attachments and snapshot
restoration. It also prints CPU timing; browser/mobile drag and
camera-motion performance still require visual review on the target device.

Implementation validation (desktop native GPU): the 10-cable/310-particle
inventory measured approximately 4–6 ms per 60 Hz physics step. This is a CPU
solver measurement, not a browser FPS or mobile claim. Inventory raster,
outline SVG, whole-panel shaded/fill SVG and two-panel video exports were
inspected/generated; the existing ControlPanel and Live-stage checks passed.
