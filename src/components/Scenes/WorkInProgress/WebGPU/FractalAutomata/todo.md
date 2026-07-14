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

- Phase 2: Cloud + Flow Field preset — cloud-silhouette seeding (constrain
  the compute's base-plane seed to a cloud SDF instead of a flat plane), wire
  the AngularFlowField element (`src/components/elements/AngularFlowField/`)
  in behind it for real, plus light/godrays behind that.
- Phase 2: Fixed Megalith preset (structure fully resolved, no growth
  animation).
- Phase 2: Fixed With Growth Pockets preset (mostly fixed, isolated regions
  still actively growing).
- Revisit logarithmic depth buffer / infinite-zoom framing if camera-distance
  z-fighting actually shows up once structures get large.

# // Presets

# // Features

# // Bugs

- preset colors not getting used on scene load or regen.
- fix last: need to prevent a voxel occupying the same position as the pointlight when doing godrays.
