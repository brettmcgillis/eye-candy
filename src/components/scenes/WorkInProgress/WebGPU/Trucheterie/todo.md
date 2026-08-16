# // Trucheterie

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- Generative Truchet-tile patterns rendered as multi-stroke "engraved contour"
  line art (many parallel offset strokes per arc, not flat fill), in the
  style of a set of reference images the user collected from artists they
  follow. Square and triangular tile grids, ambient retiling animation
  (tiles flip/scale to reveal a new arrangement), and composition controls
  (border, clip shape, fill mode, color) all reachable from one scene.

# // TODO:

- [ ] do a subdivide retile mode. ie sometimes a large tile will flip into a subdivision, other times a set of small tiles will flip as one into a big tile.
- [ ] true edge-matching (Wang-tile style) across the square/triangular grid
      motif palette, so adjacent tiles' strokes connect regardless of which
      motif each side got. Blob field mode already solves this for its own
      cell shapes via a real connectivity graph — the original
      arc/straight/cross/lanes motifs are still chosen independently per
      tile, so this bug/limitation is specific to square and triangular
      mode.
- [ ] blob field: continuous-noise style (contour a noise field directly,
      no discrete cells)
- [ ] blob field: ambient animation, something reaction-diffusion-like
- [ ] blob field: interactive/authoring mode — click to seed points, pattern
      grows outward from wherever the user clicks

# // Presets

# // Features

- Multiscale tiling: recursive subdivision on both square and triangular
  grid modes (quadtree / quadrisection), a "lanes" motif (nested
  multi-corner rings, one corner denser than the rest), and an optional
  resubdivide-over-time hard-cut regeneration.
- Blob Field grid mode: variable-size square cells packed onto a grid, wired
  into a real adjacency graph, then partially severed/pruned — cell shape
  (circle / capped stub / rounded corner) is derived from which sides are
  still connected, not chosen randomly, so adjacent cells' strokes always
  meet exactly at shared edges.

# // Bugs

- zrotation in triangle mode doesnt work well.
- straight tiles in triangular mode done line up.
