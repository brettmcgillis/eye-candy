# Trucheterie designs

A design is a blob field drawn by hand instead of rolled from a seed: square
cells on the micro-grid and which of each cell's four sides connect. Every
renderer that takes a seeded field takes a design unchanged, so one design
drives the 2D scene, the 3D tubes and membrane, the SVG export and both CLIs.
The user's calls (2026-10-12): viewers edit cells (paint, erase, size) and
connectors; a design is rendered exactly, and CLI variations only roll the
look (palette, lane mode, paths per unit, 3D form, and rotation unless the design saved one). Public sharing
of viewer designs is deferred.

Run `npm run trucheterie:check` after changing anything below, and
`npm run trucheterie3d:check` too if the 3D side is touched.

## The shape

```
@modules/trucheterieBlob        design.js: model, edits, neighbour rule, codec, fieldFromDesign
                                fieldFromConfig: the one field builder (design or seed)
                                designs/*.json: saved designs (the designer writes, the CLIs read)
@modules/trucheterieDesigner    BlobDesignEditor (R3F overlay + pointer tools),
                                useDesignHistory, useSceneDesign
        │                                │
  WebGPU/Trucheterie, Trucheterie3D   src/dev/tools/trucheterieDesigner (TrucheterieDesigner)
  (Design folder + "Design Your Own")  src/dev/server/trucheterieDesigner (/dev-api/trucheterie-designer/designs)
                                       src/dev/trucheterieDesigns (saved-design hooks for the workbenches)
  scripts/lib/trucheterieDesigns.mjs   --blobDesign NAME|PATH|CODE for both CLIs
```

## The model (`design.js`)

- `{ cells: [{ column, row, size, mask }] }`. The grid has no edge:
  coordinates are signed (±32767) and cell sizes run to 255. `designFrame`
  is the square the field draws in, the design's extent plus one cell each
  side, centred; `fieldFromDesign` shifts cells into it and sets the field's
  `gridSize` to its size, so a design always fills the canvas (the CLIs then
  frame by bounds anyway). An empty design's frame is 20, about the origin.
  `mask` bits 0–3 are
  the field's `connectorMask` sides: top 1, right 2, bottom 4, left 8. Bit 64
  (`PINNED_CHOICES`) pins the cell's choices: 16 (`ALT_PAIRING`) pairs a
  four-way cell's other diagonal, and 32 (`SWAPPED_ORDER`) reverses its draw
  order. Designs are immutable; every edit returns a normalized design.
- **The neighbour rule** is the reference's `checkNeighborConnections`: a
  side is open only if it borders cells all the way along, each with its
  facing side open. That is what makes every arc reaching an edge meet
  another. `normalizeDesign` enforces it; a seeded field already satisfies it
  (the check asserts this). A neighbour only counts if its facing side lies
  on the same grid line, which rules out a cell overlapping from inside a
  bigger one.
- **Empty corners.** Cells may overlap where the bigger one's arcs never
  reach (both, for equal sizes): a corner turn leaves its far corner free (a
  3 fits in a 12's), a stub its far half, rings their four corners. A
  micro-cell is inked if it lies within a family's `rMax` plus `INK_MARGIN`
  (0.5, for the pen and the 3D tubes) of its pivot; `inkClashes` counts
  overlaps that break this. `occupancy` writes bigger cells first, so the
  cell sitting in a corner owns it (picking, neighbours, and the 3D crossing
  lookup in `buildTubes`). Every edit that would leave a clash is refused and
  returns the design unchanged: that includes closing a stub's last side or
  erasing its neighbour (its rings would cover the corner) and opening a side
  that sweeps arcs over the corner. The renderers need nothing else: the 2D
  fill is only drawn inside the arcs, and SVG, lanes, tubes and membrane are
  all built from the arcs.
- Sides are all-or-nothing across every neighbour, so `sideCascade` opens a
  side together with every side it reaches (a big cell's side and each small
  neighbour's facing side, and onwards). It returns null if any of that
  touches empty grid. Closing a side lets normalization close the rest.
- `placeCell` refuses a clash; with `connect` it opens sides one at a time and
  keeps each only if it adds no clash, so a big cell can be placed around a
  small one (its rings would clash until a side opens). `canPlace` is that
  test. `eraseCell` closes the sides that faced the erased cell.
- **Choices.** A four-way cell's diagonal pairing and which family draws
  first (over/under in 3D) are pinned when the mask has bit 64. Otherwise they
  come from a PRNG seeded by the cell's own position (`resolveConnections`,
  shared with the seeded generator's `Cell.getConnections`), so editing one
  cell never reshuffles another. "Pinned" means reverse or keep the canonical
  `resolveConnections` order, so it stays meaningful after a connector edit.
- **Editing choices.** `flipDiagonal` (four-way cells only) and `swapOrder`
  (cells with two families only) pin the cell's current choices, then toggle
  one bit. On any other cell they return the design unchanged.
- **From a seed.** `designFromField` / `designFromSeed(config)` pin every
  cell's choices, so a seeded field becomes a design that draws identically.
  Hash-only, about half the cells drew differently; the check compares
  `conn0`/`conn1`.
- `fieldFromDesign` sorts cells as the generator does and builds through the
  same `assembleField`. The field carries `gridSize`, and every consumer
  (pen width, tube solve, membrane) reads it from the field, not from
  `blobGridSize`.
- **Codec.** `blobDesign` holds `tb2.` + base64url of, per cell, int16
  column, int16 row, uint8 size, uint8 mask (little-endian, 6 bytes). Legacy
  `tb1.` codes (`[gridSize, (column, row, size, mask)…]`, still in the
  presets) decode with their gridSize ignored. Saved files hold `cells` as
  `[column, row, size, mask]` rows, so a design diffs line by line; an old
  file's `gridSize` is ignored. `designFromJson`/`decodeDesign` refuse
  out-of-range cells and clashes rather than drop them.

## Straights

- Mask bit 128 (`STRAIGHT`) draws a cell with one opposite pair of sides
  open, and at most one more, as straight lanes: family type 3, edge 0 runs
  top-bottom and 1 left-right. With a third open side it is a T-junction,
  `[[1, branch], [3, axis]]`: the stub draws first, so the straight lanes
  stop against it. Four-way cells (crosses) are not supported, because the
  family on top would hide the other entirely. The bit is ignored while a
  cell is not eligible. Designer tool: Straight (`canStraighten`,
  `toggleStraight`). Seeded: `blobStraights` is the chance per eligible cell
  (`openStraights`, position-seeded, before symmetry). Rolls give it
  `STRAIGHTS_ROLL_CHANCE` (0.35) of being on, at a chance in [0.2, 0.7].
- The GPU shader draws real lines (`blobArcs.js`, lanes counted from the
  left/top edge, `along` from the top/right end). On the CPU a straight
  family is arcs about a centre `1e5 · size` off (`straightFrame`): every
  arc-based consumer keeps its maths (lane channels, occluders, SVG, 3D
  strands, membrane, heights), the bend is ~1e-5 of a cell, and 3D joins
  ends by lattice point. The SVG writes slivers of angle as lines.
  `familySector` gives a straight a disc that covers its whole cell, which
  is right for ink and bounds; it must never be a slot-0 occluder, and
  `connectionsFor` never puts it first.
- Mirrors map the axis through the side map (`map[edge] % 2`); a cell on
  the symmetry axis keeps its straight bit.

## Irregular connections

- With the design's `irregular` flag on (designer checkbox; `blobIrregular`
  for seeded fields), a small cell's side may open against part of a bigger
  cell's closed side: `normalizeCells` keeps a side open when its one
  aligned neighbour is bigger and its facing side is closed. Connect falls
  back to this when the full cascade can't open; turning the flag off
  (`setIrregular`) closes those sides. Codes carry it as `tb3.` (the `tb2`
  layout), JSON as `"irregular": true`.
- The bigger cell draws its own families exactly as with that side closed,
  plus one family per irregular neighbour (`irregularFamilies`): a
  **pocket** (a stub of a virtual cell the neighbour's size, on the shared
  stretch) or, when the stretch reaches a corner whose other side is open, a
  **bend** (a corner turn of that virtual cell, carrying the lines through
  to that side). Every line still closes.
- `fieldFromDesign` emits these as extra field entries (`virtual: true`,
  `host`) after every real cell, so the GPU draws them on top with no shader
  change. Each entry carries `occluders`, the sectors painted over it (a
  host: all its extras; an extra: the ones after it), and every CPU
  consumer clips against them besides the usual first-family occluder: lane
  channels, SVG strokes, 3D strands and membrane. `designFromField` skips
  virtual entries. Pocket and bend ink counts toward the empty-corner clash
  rule.
- Seeded: `openIrregular` opens each eligible closed side with a
  position-seeded 0.6 chance, before symmetry (so the mirror copies them).
  Rolls turn `blobIrregular` on with `IRREGULAR_ROLL_CHANCE` (0.35), after
  the symmetry draws.

## Symmetry (seeded fields)

- `blobSymmetry` (`none`, `vertical`, `horizontal`, `diagonal`,
  `antidiagonal`; a structure-facet generator key in both schemas and
  `TUBE_KEYS`) mirrors a seeded field: `fieldFromConfig` builds the reference
  packing untouched, reads it back as a design, and `symmetricDesign` keeps
  the cells wholly on one side of the axis, mirrors them across, and keeps a
  straddling cell only if it is centred on the axis. The grid keeps its
  `gridSize`, so the axis is the grid's centre line or diagonal. Designs
  ignore it.
- Mirrored cells carry the mirrored families in the same draw order
  (pinned via `choiceBits`). A cell on the axis gets its sides mirrored open
  and only self-mirroring family sets: on a vertical/horizontal axis three or
  four open sides drop the pair along the axis (leaving two stubs across
  it); on a diagonal the four-way pairing is the one whose corners sit on
  the axis. Normalization can close sides, so the mirror is rebuilt from the
  normalized half until nothing changes. Meatballs 0 drops cells left
  unconnected.
- Rolls: on with `SYMMETRY_CHANCE` (0.12), the last draws of the structure
  stream, so earlier keys of a seed are unchanged. The axis follows the
  rotation: square on (rotation nearest a multiple of 90°) gives vertical or
  horizontal, turned 45° gives a diagonal. It is realigned after pins, so a
  pinned rotation (a saved design's) still gets a matching axis, keeping its
  parity (vertical ↔ diagonal, horizontal ↔ antidiagonal). Pin
  `--blobSymmetry none` to keep it off, or an axis to force one.

## Triangle grids

Built 2026-10-26. A field is square or triangle, never both: seeded fields
pick it with `blobGridShape` (`square`, `triangle`; a structure facet, rolled
to triangle at `TRIANGLE_ROLL_CHANCE`, 0.25, as the last structure draw), and
a design carries its own (`shape: "triangle"` in JSON, `tb4.` / `tb5.`
for packed designs, `tb7.` for subdivision with edge connectors; `tb6.` is migrated).
`gridShapeOf(config)` says which a config draws. The user's call: triangles
follow the square rule that curves continue through neighbours or turn back.
Subdivision designs use **edge connectors**, like squares. Legacy packed
designs retain their corner connectors.

- **Reference subdivision is the default** (`blobTriangleLayout: "subdivide"`).
  `triSubdivision.js` ports Jurgen's [More Multi-Scale Truchet Tiles](https://turtletoy.net/turtle/fa14c628d4)
  (CC BY-NC-SA 4.0): the alternating root triangles and four-child split,
  with probability `splitProbability ** (1 + startRes - generation)`, the
  generation-dependent sizes, and random corner order. The four source
  knobs are `blobTriangleSplitProbability` (0.7), `blobTriangleStartRes` (4),
  `blobTriangleMinRes` (1) and `blobTriangleBigTileSize` (80). The source's
  constant world-space pitch is 4 paths per micro-cell; Paths Per Unit
  remains the shared density control (unpinned reference rolls use 4).
  Reference pen weight follows the square grid, capped at one quarter of
  the lane pitch so dense fields retain visible colour between outlines. We draw the complete patch with the
  app's framing, rather than Turtletoy's fixed 200-unit canvas crop.
- **Closed lane topology** (2026-10-27). The source permits clipping at the
  patch boundary; this scene does not. `triSides.js` groups reciprocal edges
  over their complete lattice-unit spans. An edge opens only when every
  facing neighbour opens with it. A missing neighbour closes that edge,
  without closing the triangle's other edges or flooding through corner
  groups. Small cells against a larger side share that side's group.
- A subdivision leaf's three mask bits name its **sides**, clockwise from
  corner 0 to corner 1. The user's call (2026-10-28) is the reference's
  corner fans inside the patch, with the square scene's closed-boundary
  rule. `triFans.js` keeps all three ordered fans for connected groups of
  three or more tiles: top and bottom reach three quarters of a side, the
  middle half, with the reference's half-side minimum leaf and inclusive
  outer arc. It does not replace these with a combined path or warp circles.
- **Boundary returns.** Each exposed side gets a nested semicircular return
  (type 12), at the same `1 / Paths Per Unit` pitch. Its diameter meets the
  reference's half-pitch edge crossings. The return's inward half copies
  its host's original fans; only the outside bends back. The circular outer
  outline closes intersections with neighbouring returns. The first
  half-pitch corner wedge stays clear, as in the reference, so no terminal
  dots are needed. An odd central crossing joins the first return as a T.
  The smallest one-crossing tile uses its closed incircle. An isolated
  triangle and a two-triangle component retain their closed circular motifs.
- `laneChannels.js` joins the return bands to the host fans and keeps closed
  networks separate. Cycle, Depth, Random and lane-following Spectrum use
  the same lookup in all consumers. `capShader.js` copies the host's three
  fan families without changing their circle distances. `capTextures.js`
  retains the GPU lookup objects but recreates their storage when the field
  changes; this fixes the native WebGPU failure when painting a third tile.
  The look still uses the existing instanced renderer and has no global
  per-pixel search over the field. Metadata uploads are cached per field.
- `triContours.js` and `circleClip.js` clip circular arcs analytically for
  SVG and the verifier; `triangleSvg.js` shares the field and lane lookup.
  Pen-only SVG contains native arc and line geometry with occluded strokes
  removed. The check verifies actual visible stroke endpoints against other
  outlines, including T-junctions, densities 1–20, holes and connector edits.
  The native WebGPU capture also exercises adding 1–4 tiles on one renderer.
  Designs and codecs retain every source tile; preview framing includes the
  extra space needed by boundary returns.
- **Subdivision designs** carry `layout: "subdivide"`,
  `connectors: "edges"` in JSON and `tb7.` codes. Old `tb6.` / unmarked
  subdivision JSON corner flags migrate to their incident edges and then
  normalize. Existing `tb4.` / `tb5.` packed designs retain their original
  model. Connect targets the nearest side of a subdivision cell; opening
  or closing it updates the whole reciprocal group. Order is available on
  three-way cells. Move, duplicate, codecs, the scene, workbench and SVG
  all use the same normalized field.
- **Packed cells** (`blobTriangleLayout: "packed"`) retains the original
  arbitrary-size blob packing and strict corner groups, described below.
  Its missing boundary neighbours can close large mixed-size groups even
  at full fill/connectivity; raising fill alone does not reproduce the
  reference. Square-specific packing controls are hidden for reference
  subdivision, and the four subdivision controls are hidden for squares.

- **Why corners.** A 60° corner has no room for a stub's semicircle (0.5 of a
  side needed, 0.43 available) or a corner turn reaching the full side (1
  needed, 0.87 available), so an arc crossing a side near corner A can only
  turn about A and leave through A's other side.
- **Lattice** (`triangle.js`): point (a, b) sits at a·(1, 0) + b·(½, √3/2),
  micro-cell units, y down. A cell is `{ column: a, row: b, size, mask }`;
  mask bit 8 (`UP`) points it up. Down cells have corners (a, b), (a+n, b),
  (a, b+n); up cells (a+n, b), (a+n, b+n), (a, b+n). Corners run clockwise
  on screen. Any integer size tiles.
- **Mask** (`triDesign.js`): bits 0–2 are corners; 64 pins the order, bits
  16–32 name the corner on top and 128 swaps the other two. Unpinned orders
  hash the cell's position, as square choices do.
- **Families.** An open corner draws a fan (type 4) of 60° arcs over the half
  of each side next to it. Arcs sit at (k + ½)/pathDiv, so no arc ever
  crosses a side at a lattice point, where a smaller neighbour's corner may
  be; on whole multiples, a big cell's arc ended dead on a small cell's
  corner. One or two open corners reach half a side; with all three open
  the top and bottom fans reach ¾ (the reference turtle's look) and the
  first drawn covers the rest. No open corner draws rings about the centroid
  (type 5). The fan edge packs corner + 3·up + 6·long.
- **The corner rule.** A corner opens only if both its half-sides are faced,
  all along, by neighbours' open halves (probed every half-unit). Faced
  halves form groups that open and close together: same-size triangles make
  one group per vertex (a full disc), and a bigger cell's half-side joins
  every small vertex along it, so groups thread through mixed sizes.
  `normalizeTriDesign` closes any group with a closed or unfaced member;
  `cornerCascade` is what Connect opens.
- **Three-way cells are two field entries**: the bottom fan alone (`under`,
  drawn first, with the top and middle fans as `occluders`) and then the top
  and middle fans, so the shader stays at two families. Entries share a
  `group`, which keys their growth delay. Occluders on triangle entries are
  `{ cell, type, edge }`, resolved with the lane pitch (`occluderSector`).
- **Packed seeded fields** (`triField.js`): the square recipe on the lattice, about the
  origin in a gridSize square: rays from the centre, gaps filled nearest
  first with size-1 triangles (`blobOneFill`), holes, then whole corner
  groups closed, **picked evenly** (a random corner nearly always lands in
  the biggest group), closing only groups that fit within the remaining
  `1 − connectivity` budget. An indivisible group may leave connectivity
  above the target; it must never overshoot and collapse a larger network.
  Prune keeps the biggest network. Gaps close every corner round them, so
  triangles want a higher One Fill than squares (default 0.25 leaves ~38% of
  cells as rings; the Triangles preset uses 0.9). Triangle structure rolls
  use One Fill 0.85–1, Connectivity 0.9–1 and Holes 0–0.06 on their own
  deterministic stream; pins and held structure still win. Square roll ranges
  and seeds are unchanged. These ranges reduce the fragmentation of the
  connected field into isolated rings.
- **Symmetry** axes run through the lattice origin: vertical and horizontal,
  and diagonal / antidiagonal are the lines that stand upright and level once
  the field turns 30° (triangle rolls turn 0° or 30°; `symmetryAxis` takes
  the shape). A cell on the axis with all three corners open drops the one
  on the axis.
- **Empty corners** (2026-10-26): a cell may overlap a bigger one where
  none of the bigger one's families reach (its disc at the finest pitch plus
  `INK_MARGIN`, 0.5; both cells' for equal sizes): a closed corner's region,
  or a ring cell's three corners. `triOccupancy` writes bigger cells first, so
  the cell sitting in the corner owns it. Probes skip a stretch of a side a
  smaller cell sits on top of (the inside probe must find the cell itself),
  so the bigger cell's half there faces nothing and stays closed, and the
  neighbours across meet the corner cell instead. `triInkClashes` counts
  breaks; placing, connecting, erasing, ordering, moving and loading all
  refuse an edit that leaves one, as on squares.
- **Irregular connections** (designs only, the `irregular` flag; `tb5.`
  codes): a smaller cell's whole side lying along one bigger cell's side may
  stay open where the bigger cell's halves along it are closed. The bigger
  cell draws a **pocket** (type 6, semicircles about that side's midpoint,
  needing `m/2 + 0.25` of room to its other sides) or, where such sides from
  both of its sides meet at one of its corners with the same length, a
  **bend** (type 7, a fan about that corner reaching m). Joins are hard
  except across a side that draws; whether it draws is judged against each
  group closed on its own (`drawnSides`), or the small corner would close
  with the bigger cell's half before it could. Extras are `virtual` field
  entries after every real one, with `occluders` as on squares.
- **Why irregular is rare on triangles:** a small vertex on the bigger
  cell's side shares its fan with the next small cell along it, so pockets
  come as a run along the whole side, and a run can only end at the bigger
  cell's 60° corners, where a pocket has no room, in a bend that needs the
  next side in the same state. In practice the bigger cell must be closed
  and ringed by smaller cells all round. Seeded fields never are (none in 40
  fields at full fill), so seeded triangle fields ignore `blobIrregular`
  (rolls clear it, the Leva toggle hides), unlike squares. In the designer,
  with Irregular on, Connect falls back to opening the whole run when the
  ordinary cascade cannot open, and closing a bigger cell's corner leaves
  the runs that can draw open as pockets and bends.
- **Not on triangles:** straights, the debug overlay, and Trucheterie3D
  (`buildField` throws for a triangle grid).
- **Shader:** `triangleArcs.js` (fan and ring fields, the triangle
  footprint, nested returns and turns). The return warp is evaluated only
  inside its triangle. Ordinary fans may overhang with pure ink, so their
  antialiased rim cannot tint a neighbour with this cell's fill. Past 1024 instances the instance matrices move to a
  storage attribute (`applyFieldToMesh`), or three adds a ninth vertex buffer
  and the pipeline fails; triangle fields reach that easily.
- **Designer:** Auto Paint uses the triangle containing the pointer on a
  brush-sized lattice, so both orientations work at every brush size. Up /
  Down choose an orientation explicitly and snap its centre to the micro-grid.
  Picking the first containing candidate biases larger brushes down; choosing
  by centroid alone is also ambiguous when size is divisible by three, when
  opposite triangles can have identical centroids.
  On subdivision designs Connect toggles the nearest edge group.
  On packed designs it toggles the nearest corner group; Order raises the clicked
  corner, or swaps the other two when it is already on top; Move and
  Duplicate step by lattice translations (`dragStep`). TrucheterieDesigner
  switches the active grid immediately, keeping a separate in-memory draft
  for each shape (including its name, saved state, rotation and anchor).
  The selector follows undo/redo and opened designs. Triangle seeds use
  reference subdivision, and triangle grids turn in 30° steps. `trucheterie:check` covers it (`checkTriangles`), including a
  crossing test that every visible fan arc meets one across its side.

## Keys

- `blobDesign` (both schemas, a generator and tube key, never rolled). Empty
  means seeded. When set, the seeded generator's knobs are ignored (the 2D
  Leva hides them), and so is `blobGridSize` (Start From Seeded Field still
  uses it, with the other Blob Field knobs).
- `designTool` (`off` = View, `paint`, `erase`, `connect`, `diagonal`,
  `order`, `straight`, `move`, `duplicate`), `designBrush` (cell size) and `designAutoConnect` are scene
  controls that are never
  render options. They are in every preset (2D: written out, 3D: through
  `sceneDefaults()`), so switching away from a design preset clears it.

## Editor (`BlobDesignEditor`)

- Mounted in the field's own frame: inside the 2D scene's `planeRotation`
  group, and in 3D inside a Y rotation plus −90° about X (grid x → x,
  grid y → z). Pointer rays hit an invisible plane, so any camera angle
  works. The editable area is the design's frame plus `MAX_BRUSH` on every
  side, so painting near any edge grows it. In the scenes the canvas is
  fixed, so the field rescales as the frame grows.
- Strokes: a pointerdown on the grid takes the stroke (orbit controls are
  disabled until pointerup); off the grid the camera orbits as usual. Paint
  and erase interpolate along the drag; connect, diagonal and order act once
  per press. Connect acts on the side of the cell under the pointer nearest
  to it; diagonal and order act on the cell under the pointer. The hover preview shows
  the brush (green fits, red blocked), the whole cascade a click would
  toggle, or, for diagonal and order, the pivots the arcs will turn about
  afterwards (both corners of the new pairing, or the family that ends up
  on top). Red means the cell has no such choice.
- Move: a press on a cell takes its `connectedGroup` (every cell reachable
  through open sides) and the drag moves it live by whole micro-cells
  through `moveCells`. A landing that would clash or change any side's mask
  (the group's own, or a neighbour's) is refused: the design stays at the
  last good offset and a red ghost shows the target. Landing beside a cell
  leaves the sides between them closed. Moved cells are pinned first, since
  unpinned choices hash their position.
- Duplicate: the same drag, but `duplicateCells` appends a pinned copy of the
  group at the offset and leaves the original; the same landing rules apply.
- Overlay geometry is rebuilt per edit, and each mesh is **keyed by its
  geometry's uuid**: under WebGPU, swapping `geometry` on a live mesh keeps
  the old vertex buffers ("Vertex buffer slot 0 … was not set"). An empty
  layer draws a degenerate triangle rather than a zero-length buffer.
- `setPointerCapture` is best-effort. If it throws, the stroke must still
  end, or the camera controls stay disabled.
- History: `useDesignHistory` keeps undo/redo of codes. A stroke is one
  step (checkpoint on stroke start). ⌘Z / ⇧⌘Z work while a tool is active,
  except in text inputs.

## Designer and CLIs

- TrucheterieDesigner (`/dev/trucheterie-designer`): the same editor over the
  scene's `BlobFieldMesh`, with a plain-DOM panel (no Leva). It sizes the
  canvas from the frame (`CELL_UNIT` world units per micro-cell) and offsets
  it from an anchor taken when a design is opened, started or seeded, so
  cells never move or rescale on screen as the design grows. Designs save to
  `src/modules/trucheterieBlob/designs/<name>.json` through the dev-server
  plugin. Once saved, it links to both workbenches with `?design=<name>`
  preselected, and shows the CLI command.
- Opening or seeding a design frames the camera to fit its extent. Painting,
  palette edits and other controls never refit or rescale the view.
- Shape and tools sit together at the top. Editing instructions live in a
  collapsed Editing help disclosure at the bottom of the control panel.
- Its Preview section exposes the scene's lane palette and modes, exact
  versus blended colors, shuffle seed and shuffle action, monochrome and
  its color, stroke color, silhouette fill (Tile Background), and Scene
  Background. Colors are view settings; the grid rotation is saved with the
  design as `rotation` (the scenes' `planeRotation`, degrees in 45° steps,
  −180..180) and restored on open. Old files without it load at 0°.
- Both CLIs resolve `--blobDesign` as a design code, a `.json` path, or a
  saved design's name, and pin the resolved code, so sidecars and promoted
  presets carry the design itself. A saved file's `rotation` is pinned as
  `planeRotation` unless one is typed (so the workbenches, which only send
  rollable options you pinned, get it too); a bare code carries no rotation.
  Each generation's seed still rolls the other look facets; the field never
  changes.

## Not yet

- Sharing a viewer's design from the public site (URL, export/import); the
  `tb1.` code is already URL-safe.
- The workbenches' design pickers show "None" when the base comes from a
  generation (its value is then a code, not a saved name), though the code
  is still submitted.
