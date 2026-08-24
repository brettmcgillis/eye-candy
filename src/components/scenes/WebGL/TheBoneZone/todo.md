# // TheBoneZone

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // Intent/Use Cases

- This scene is intended to explore media pipe pose detection and using that to drive a rigged model.
- The scene includes a grid floor and cool dark background.
- The scene includes a rigged skeleton model at x,z 0
- The skeleton does not move throughout the scene space, but its pose is driven by the media pipe pose
- The scene includes a debug wireframe skeleton

# // Presets

# // Features

- Fixed-origin pose mannequin: the model stays pinned in scene space and only the rig pose changes.
- No pose-driven root translation or auto-scale.
- 3D debug wireframe is pinned with the model.
- Camera overlay debug remains available through MediaPipe controls.
- Tracking mode switcher supports both pose and holistic detection backends.
- Holistic mode keeps the same pose retarget path and adds richer overlay tracking data for hands and face.
- Holistic mode uses hand landmarks to improve wrist and finger articulation on the rig itself.

# // Bugs
