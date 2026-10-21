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

## Keys

- `blobDesign` (both schemas, a generator and tube key, never rolled). Empty
  means seeded. When set, the seeded generator's knobs are ignored (the 2D
  Leva hides them), and so is `blobGridSize` (Start From Seeded Field still
  uses it, with the other Blob Field knobs).
- `designTool` (`off` = View, `paint`, `erase`, `connect`, `diagonal`,
  `order`, `move`), `designBrush` (cell size) and `designAutoConnect` are scene
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
