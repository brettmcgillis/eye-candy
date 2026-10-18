# Trucheterie designs

A design is a blob field drawn by hand instead of rolled from a seed: square
cells on the micro-grid and which of each cell's four sides connect. Every
renderer that takes a seeded field takes a design unchanged, so one design
drives the 2D scene, the 3D tubes and membrane, the SVG export and both CLIs.
The user's calls (2026-10-12): viewers edit cells (paint, erase, size) and
connectors; a design is rendered exactly, and CLI variations only roll the
look (palette, lane mode, paths per unit, rotation, 3D form). Public sharing
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

- `{ gridSize, cells: [{ column, row, size, mask }] }`. `mask` bits 0–3 are
  the field's `connectorMask` sides: top 1, right 2, bottom 4, left 8. Bit 64
  (`PINNED_CHOICES`) pins the cell's choices: 16 (`ALT_PAIRING`) pairs a
  four-way cell's other diagonal, and 32 (`SWAPPED_ORDER`) reverses its draw
  order. Designs are immutable; every edit returns a normalized design.
- **The neighbour rule** is the reference's `checkNeighborConnections`: a
  side is open only if it borders cells all the way along, each with its
  facing side open. That is what makes every arc reaching an edge meet
  another. `normalizeDesign` enforces it; a seeded field already satisfies it
  (the check asserts this).
- Sides are all-or-nothing across every neighbour, so `sideCascade` opens a
  side together with every side it reaches (a big cell's side and each small
  neighbour's facing side, and onwards). It returns null if any of that
  touches empty grid. Closing a side lets normalization close the rest.
- `placeCell` refuses overlaps; with `connect` it opens every side that can
  open. `eraseCell` closes the sides that faced the erased cell.
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
- **Resize.** `resizeDesign` pins every cell first (the position hash would
  otherwise reshuffle after the shift), shifts cells to stay centred, drops
  any that no longer fit, and normalizes.
- `fieldFromDesign` sorts cells as the generator does and builds through the
  same `assembleField`. The field carries `gridSize`, and every consumer
  (pen width, tube solve, membrane) reads it from the field, not from
  `blobGridSize`.
- **Codec.** `blobDesign` holds `tb1.` + base64url of
  `[gridSize, (column, row, size, mask)…]`, 4 bytes per cell. Saved files
  hold `cells` as `[column, row, size, mask]` rows, so a design diffs line
  by line. `designFromJson`/`decodeDesign` refuse overlapping or out-of-grid
  cells rather than drop them.

## Keys

- `blobDesign` (both schemas, a generator and tube key, never rolled). Empty
  means seeded. When set, the seeded generator's knobs are ignored (the 2D
  Leva hides them), and so is `blobGridSize` except as the size of a new
  blank design.
- `designTool` (`off` = View, `paint`, `erase`, `connect`, `diagonal`,
  `order`), `designBrush`
  (cell size), `designAutoConnect` and `designGridSize` (the size New Blank
  and Resize Grid use; Start From Seeded Field uses the Blob Field knobs,
  seed and Grid Size included) are scene controls that are never
  render options. They are in every preset (2D: written out, 3D: through
  `sceneDefaults()`), so switching away from a design preset clears it.

## Editor (`BlobDesignEditor`)

- Mounted in the field's own frame: inside the 2D scene's `planeRotation`
  group, and in 3D inside a Y rotation plus −90° about X (grid x → x,
  grid y → z). Pointer rays hit an invisible plane, so any camera angle
  works.
- Strokes: a pointerdown on the grid takes the stroke (orbit controls are
  disabled until pointerup); off the grid the camera orbits as usual. Paint
  and erase interpolate along the drag; connect, diagonal and order act once
  per press. Connect acts on the side of the cell under the pointer nearest
  to it; diagonal and order act on the cell under the pointer. The hover preview shows
  the brush (green fits, red blocked), the whole cascade a click would
  toggle, or, for diagonal and order, the pivots the arcs will turn about
  afterwards (both corners of the new pairing, or the family that ends up
  on top). Red means the cell has no such choice.
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
  scene's `BlobFieldMesh`, with a plain-DOM panel (no Leva). Designs save to
  `src/modules/trucheterieBlob/designs/<name>.json` through the dev-server
  plugin. Once saved, it links to both workbenches with `?design=<name>`
  preselected, and shows the CLI command.
- Its Preview section exposes the scene's lane palette and modes, exact
  versus blended colors, shuffle seed and shuffle action, monochrome and
  its color, stroke color, silhouette fill (Tile Background), and Scene
  Background. Grid rotation and colors are view settings, not saved design
  data; saved designs continue to hold only cells and connections.
- Both CLIs resolve `--blobDesign` as a design code, a `.json` path, or a
  saved design's name, and pin the resolved code, so sidecars and promoted
  presets carry the design itself. Each generation's seed still rolls the
  look facets; the field never changes.

## Not yet

- Sharing a viewer's design from the public site (URL, export/import); the
  `tb1.` code is already URL-safe.
- The workbenches' design pickers show "None" when the base comes from a
  generation (its value is then a code, not a saved name), though the code
  is still submitted.
