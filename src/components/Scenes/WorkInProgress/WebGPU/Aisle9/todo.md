# // Aisle 9

# // Intent / Use Cases

- This scene includes a raymarched blackhole in the center of a convenience store, with several store items orbiting it.
- The scene contains several camera positions that could be used to tell the story of a convenience store clerk who notices an anomaly in the middle of a shift.
- The scene contains several fixed security cam views of the scene, with post processing overlay to resemble cctv
- The scene contains a close up orbit view of the black hole so users can focus in on it,
- The scene contains a camera spline path that allows the user to feel like they are walking through the store.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] set up a mode where geometry periodically gets spawned into scene and sucked into the blackhole before being culled from scene.

# // Presets

- [x] Store
- [x] Guided Tour
- [x] Surveillance 1
- [x] Surveillance 2
- [x] Surveillance 3

# // Features

# // Bugs

# // Controls

- Aisle 9
  - Presets
  - Blackhole
    - enabled
    - variation dropdown
    - legacy folder
    - webgpu folder
    - singularity folder
  - Orbiting bodies
    - enabled
    - Orbit folder
    - Body {n} folder
      - scale (number)
      - instances
  - Sky
    - enabled
    - rotation vec3 control
  - Post
    - CCTV folder
      - enabled
      - label
