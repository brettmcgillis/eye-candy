# // Fireflies

# // Intent / Use Cases

- A standalone scene built around fireflies & boids. Instead of building it as a new CrossTalk preset, it lives here as its own scene
- The scene contains a flock of firefly boids with one or more hunters and realistic flash-sync behavio .
- The scene contains static obstacles the flock steers around
- The scene contains a fixed-camera multi-browser tab experience similar to the CrossTalk scene preset Waterworks (FluidSimView) where fluid is confined to an initial tab and any overlapping tabs. The fireflies and hunters are confined to the limits of the tab they are in but can roam further when there are mulitple tabs overlapping

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- add controls for background color, grid color, grid cell illumination color, enable/disable grid cell illumination on occupancy,
- make fireflies emissive instead of just color changes
- can we allow for the fireflies bounding box to be a voxelized sphere?
- might need to include some level of wall avoidance so the floids dont slam into the sides of the sim.
- is there a version of the scene where we run the sim and illuminate the cells but dont show the floids?
  - might need interesting material for cells.
  - make obstacles & hunters cubes too?
    - might need to make hunters move in a less fluid more step like motion.

- could we use the kingfisher as the hunters? animations are a bit strange, they seem to be somehow stacked, ie if i play the second the model is frozen for the lenght of the first before starting

# // References

- `~/dev/examples/boids-js` — flock grid, obstacle avoidance, boundary
  avoidance (`BoidsController`).
- `~/dev/examples/Floids` — hunter chase behavior (`Hunter.js`), realistic
  per-agent flash-sync timing (`Agents.js` `fire()`/`nudge()`).
- `src/components/scenes/WorkInProgress/WebGPU/CrossTalk/components/FluidSimView.jsx`

# // Presets

# // Features

# // Interactivity

- [ ] Multi-tab cross-talk
- [ ] Flock-to-cursor
- [ ] Flee-from-cursor.

# // Bugs
