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

- Phase 2: Fixed Megalith preset (structure fully resolved, no growth
  animation).
- Phase 2: Fixed With Growth Pockets preset (mostly fixed, isolated regions
  still actively growing).

- explore and experiment with different materails and textures and on the voxels. rough concrete, slick and oily.
- would occlusion culling help speed up the scene?
- right now it appears the bounds are a cube, coulld we do a sphere?
- do a preset that auto regens after each generation completes animating
- add controls for the godray pointlight position
- do presets where the godray pointlight's position is animated to orbit around the structure, move up and down, left to right.

- add a preset with a structure on the photo studio table to get photographed.

- Do last: Revisit logarithmic depth buffer / infinite-zoom framing if camera-distance
  z-fighting actually shows up once structures get large.

# // Presets

# // Features

# // Bugs

- fix last: need to prevent a voxel occupying the same position as the pointlight when doing godrays, add a toggle to enable/disable this
- add a floor # of voxels, if less than floor regen to prevent empty / near empty scenes
