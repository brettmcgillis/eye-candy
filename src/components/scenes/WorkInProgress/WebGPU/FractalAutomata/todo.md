# // Fractal Automata

# // Intent / Use Cases

- 3D/voxel cellular automata scene — a hierarchical cube/face/edge subdivision
  CA (Voxel Automata Terrain lineage), animated so it grows into its shape
  over time rather than resolving instantly.
- Customizable color palette and customizable "how color gets applied"
  (by growth order/age, by height, by distance from the structure's core, or
  by cell state/tier).
- These structures might end up gigantic — may need a logarithmic z-buffer
  for infinite zoom eventually (touches the shared WebGPUCanvas.jsx renderer
  config used by every WebGPU scene, so deliberately skipped for now).
- Preset: grows around a light/godray combo like in Windswept.
- Preset: grows in the shape of a cloud, with an angular flow field behind
  it, and light/godrays behind that.
- Preset: fixed structure, not growing.
- Preset: fixed structure with areas of growth.
- The intent is to strike a visual balance between these CA being perceived
  as tiny cellular organisms and futuristic, megalithic structures.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- check out `~/dev/examples/g3dl` for a good CA example. that one is very performant compared to ours. what can we learn and use to improve ours?

- Phase 2: Fixed With Growth Pockets preset (mostly fixed, isolated regions
  still actively growing).

- explore and experiment with different materails and textures and on the voxels. rough concrete, slick and oily.
- would occlusion culling help speed up the scene?

- do a preset that auto regens after each generation completes animating
- do presets where the godray pointlight's position is animated to orbit around the structure, move up and down, left to right.
- add controls for material settings for each state/color. include emissive.
- add a preset with a structure on the photo studio table to get photographed.
- add controls for enable/disable every lighting option
- ensure we have sim modes for game of life, Cyclic CA, Langston's Ant, Turing Patterns, Lenia, Rampe
- check out automata chunks again for perf improvement hints.
- would `~/dev/examples/260716_DLACoral` be a good example for us to leverage? It sort of looks like what I expected the fixed+growth to look like.
- could we use the three.js building generator (or it's techniques) to turn the fractal into buildings?

- checkout `webgpu_compute_rasterizer`, `webgpu_compute_rasterizer_ibl` could this help improve perf?

# // Presets

# // Features

# // Bugs

- add a floor # of voxels, if less than floor regen to prevent empty / near empty scenes
