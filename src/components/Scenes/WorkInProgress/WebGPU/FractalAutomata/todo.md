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

- Phase 2: Fixed Megalith preset (structure fully resolved, no growth
  animation).
- Phase 2: Fixed With Growth Pockets preset (mostly fixed, isolated regions
  still actively growing).
- Revisit logarithmic depth buffer / infinite-zoom framing if camera-distance
  z-fighting actually shows up once structures get large.
- add control for background color
- add a cellular automata preset where the simulation just keeps going, cells living and dying following the existing patterns for generation etc.

- explore and experiment with different materails and textures and on the voxels. rough concrete, slick and oily.
- would occlusion culling help speed up the scene?
- right now it appears the bounds are a cube, coulld we do a sphere?
- do a preset that auto regens after each generation completes animating
- add controls for the godray pointlight position
- do presets where the godray pointlight's position is animated to orbit around the structure, move up and down, left to right.
- add control for pause animation

# // Presets

# // Features

# // Bugs

- preset colors not getting used on scene load or regen.

- fix last: need to prevent a voxel occupying the same position as the pointlight when doing godrays.
- add a floor # of voxels, if less than floor regen to prevent empty / near empty scenes

- 3installHook.js:1 THREE.TSL: Return statement used in an inline 'Fn()'. Define a layout struct to allow return values. Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.
  overrideMethod @ installHook.js:1
  warn @ three.core.js:2001
  generate @ three.webgpu.js:8443
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  build @ three.webgpu.js:9015
  generate @ three.webgpu.js:11003
  build @ three.webgpu.js:2369
  flowChildNode @ three.webgpu.js:53103
  flowNode @ three.webgpu.js:52873
  build @ three.webgpu.js:53585
  getForCompute @ three.webgpu.js:55595
  updateForCompute @ three.webgpu.js:56108
  compute @ three.webgpu.js:61978
  (anonymous) @ growthCompute.js:547
  build @ VoxelField.jsx:90
  (anonymous) @ VoxelField.jsx:149
  react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
  B @ events-5a94e5eb.esm.js:8093
  ca @ events-5a94e5eb.esm.js:11077
  Yp @ events-5a94e5eb.esm.js:11126
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11879
  Eh @ events-5a94e5eb.esm.js:12824
  (anonymous) @ events-5a94e5eb.esm.js:12665
  performWorkUntilDeadline @ scheduler.development.js:45
  24installHook.js:1 THREE.TSL: Return statement used in an inline 'Fn()'. Define a layout struct to allow return values. Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.
  overrideMethod @ installHook.js:1
  warn @ three.core.js:2001
  generate @ three.webgpu.js:8443
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  build @ three.webgpu.js:9015
  generate @ three.webgpu.js:11003
  build @ three.webgpu.js:2369
  flowChildNode @ three.webgpu.js:53103
  flowNode @ three.webgpu.js:52873
  build @ three.webgpu.js:53585
  getForCompute @ three.webgpu.js:55595
  updateForCompute @ three.webgpu.js:56108
  compute @ three.webgpu.js:61978
  (anonymous) @ growthCompute.js:561
  build @ VoxelField.jsx:90
  (anonymous) @ VoxelField.jsx:149
  react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
  B @ events-5a94e5eb.esm.js:8093
  ca @ events-5a94e5eb.esm.js:11077
  Yp @ events-5a94e5eb.esm.js:11126
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11879
  Eh @ events-5a94e5eb.esm.js:12824
  (anonymous) @ events-5a94e5eb.esm.js:12665
  performWorkUntilDeadline @ scheduler.development.js:45
  36installHook.js:1 THREE.TSL: Return statement used in an inline 'Fn()'. Define a layout struct to allow return values. Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.
  overrideMethod @ installHook.js:1
  warn @ three.core.js:2001
  generate @ three.webgpu.js:8443
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  generate @ three.webgpu.js:2144
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:11181
  generate @ three.webgpu.js:8654
  build @ three.webgpu.js:2369
  generate @ three.webgpu.js:8429
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  build @ three.webgpu.js:9015
  generate @ three.webgpu.js:11003
  build @ three.webgpu.js:2369
  flowChildNode @ three.webgpu.js:53103
  flowNode @ three.webgpu.js:52873
  build @ three.webgpu.js:53585
  getForCompute @ three.webgpu.js:55595
  updateForCompute @ three.webgpu.js:56108
  compute @ three.webgpu.js:61978
  (anonymous) @ growthCompute.js:562
  build @ VoxelField.jsx:90
  (anonymous) @ VoxelField.jsx:149
  react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
  B @ events-5a94e5eb.esm.js:8093
  ca @ events-5a94e5eb.esm.js:11077
  Yp @ events-5a94e5eb.esm.js:11126
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11879
  Eh @ events-5a94e5eb.esm.js:12824
  (anonymous) @ events-5a94e5eb.esm.js:12665
  performWorkUntilDeadline @ scheduler.development.js:45
  6installHook.js:1 THREE.TSL: Return statement used in an inline 'Fn()'. Define a layout struct to allow return values. Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.
  overrideMethod @ installHook.js:1
  warn @ three.core.js:2001
  generate @ three.webgpu.js:8443
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  build @ three.webgpu.js:9015
  generate @ three.webgpu.js:11003
  build @ three.webgpu.js:2369
  flowChildNode @ three.webgpu.js:53103
  flowNode @ three.webgpu.js:52873
  build @ three.webgpu.js:53585
  getForCompute @ three.webgpu.js:55595
  updateForCompute @ three.webgpu.js:56108
  compute @ three.webgpu.js:61978
  (anonymous) @ growthCompute.js:562
  build @ VoxelField.jsx:90
  (anonymous) @ VoxelField.jsx:149
  react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
  B @ events-5a94e5eb.esm.js:8093
  ca @ events-5a94e5eb.esm.js:11077
  Yp @ events-5a94e5eb.esm.js:11126
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11879
  Eh @ events-5a94e5eb.esm.js:12824
  (anonymous) @ events-5a94e5eb.esm.js:12665
  performWorkUntilDeadline @ scheduler.development.js:45
  6installHook.js:1 THREE.TSL: Return statement used in an inline 'Fn()'. Define a layout struct to allow return values. Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.
  overrideMethod @ installHook.js:1
  warn @ three.core.js:2001
  generate @ three.webgpu.js:8443
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  build @ three.webgpu.js:9015
  generate @ three.webgpu.js:11003
  build @ three.webgpu.js:2369
  flowChildNode @ three.webgpu.js:53103
  flowNode @ three.webgpu.js:52873
  build @ three.webgpu.js:53585
  getForCompute @ three.webgpu.js:55595
  updateForCompute @ three.webgpu.js:56108
  compute @ three.webgpu.js:61978
  (anonymous) @ growthCompute.js:563
  build @ VoxelField.jsx:90
  (anonymous) @ VoxelField.jsx:149
  react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
  B @ events-5a94e5eb.esm.js:8093
  ca @ events-5a94e5eb.esm.js:11077
  Yp @ events-5a94e5eb.esm.js:11126
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11879
  Eh @ events-5a94e5eb.esm.js:12824
  (anonymous) @ events-5a94e5eb.esm.js:12665
  performWorkUntilDeadline @ scheduler.development.js:45
  18installHook.js:1 THREE.TSL: Return statement used in an inline 'Fn()'. Define a layout struct to allow return values. Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.
  overrideMethod @ installHook.js:1
  warn @ three.core.js:2001
  generate @ three.webgpu.js:8443
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  generate @ three.webgpu.js:2144
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:11181
  generate @ three.webgpu.js:8654
  build @ three.webgpu.js:2369
  generate @ three.webgpu.js:8429
  build @ three.webgpu.js:2369
  build @ three.webgpu.js:35331
  build @ three.webgpu.js:4338
  build @ three.webgpu.js:9015
  generate @ three.webgpu.js:11003
  build @ three.webgpu.js:2369
  flowChildNode @ three.webgpu.js:53103
  flowNode @ three.webgpu.js:52873
  build @ three.webgpu.js:53585
  getForCompute @ three.webgpu.js:55595
  updateForCompute @ three.webgpu.js:56108
  compute @ three.webgpu.js:61978
  (anonymous) @ growthCompute.js:563
  build @ VoxelField.jsx:90
  (anonymous) @ VoxelField.jsx:149
  react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
  B @ events-5a94e5eb.esm.js:8093
  ca @ events-5a94e5eb.esm.js:11077
  Yp @ events-5a94e5eb.esm.js:11126
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11900
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11895
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11874
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11906
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11871
  wr @ events-5a94e5eb.esm.js:11857
  lh @ events-5a94e5eb.esm.js:11879
  Eh @ events-5a94e5eb.esm.js:12824
  (anonymous) @ events-5a94e5eb.esm.js:12665
  performWorkUntilDeadline @ scheduler.development.js:45
  installHook.js:1 THREE.WebGPURenderer: Uncaptured WebGPU GPUValidationError: Error while parsing WGSL: :55:31 error: cannot assign 'u32' to 'atomic<u32>'
  NodeBuffer_66480.value[ 0u ] = 0u;
  ^

- While calling [Device].CreateShaderModule([ShaderModuleDescriptor ""compute""]).

overrideMethod @ installHook.js:1
error @ three.core.js:2039
\_onError @ three.webgpu.js:60438
(anonymous) @ three.webgpu.js:83995
fractalAutomata?preset=Default:1 Error while parsing WGSL: :55:31 error: cannot assign 'u32' to 'atomic<u32>'
NodeBuffer_66480.value[ 0u ] = 0u;
^

- While calling [Device].CreateShaderModule([ShaderModuleDescriptor ""compute""]).

installHook.js:1 THREE.WebGPURenderer: Compute pipeline creation failed (computePipeline_compute): [Invalid ShaderModule "compute"] is invalid due to a previous error.

- While validating compute stage ([Invalid ShaderModule "compute"], entryPoint: "main").
- While calling [Device].CreateComputePipeline([ComputePipelineDescriptor ""computePipeline_compute""]).

overrideMethod @ installHook.js:1
error @ three.core.js:2039
(anonymous) @ three.webgpu.js:82681
Promise.then
createComputePipeline @ three.webgpu.js:82675
createComputePipeline @ three.webgpu.js:86062
\_getComputePipeline @ three.webgpu.js:32497
getForCompute @ three.webgpu.js:32269
compute @ three.webgpu.js:61982
(anonymous) @ growthCompute.js:569
build @ VoxelField.jsx:90
(anonymous) @ VoxelField.jsx:149
react_stack_bottom_frame @ events-5a94e5eb.esm.js:13723
B @ events-5a94e5eb.esm.js:8093
ca @ events-5a94e5eb.esm.js:11077
Yp @ events-5a94e5eb.esm.js:11126
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11900
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11895
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11900
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11895
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11874
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11906
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11906
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11906
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11906
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11874
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11906
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11871
wr @ events-5a94e5eb.esm.js:11857
lh @ events-5a94e5eb.esm.js:11879
Eh @ events-5a94e5eb.esm.js:12824
(anonymous) @ events-5a94e5eb.esm.js:12665
performWorkUntilDeadline @ scheduler.development.js:45
installHook.js:1 THREE.WebGPURenderer: Uncaptured WebGPU GPUValidationError: [Invalid ComputePipeline "computePipeline_compute"] is invalid due to a previous error.

- While encoding [ComputePassEncoder "computeGroup_66523"].SetPipeline([Invalid ComputePipeline "computePipeline_compute"]).
- While finishing [CommandEncoder "computeGroup_66523"].

overrideMethod @ installHook.js:1
error @ three.core.js:2039
\_onError @ three.webgpu.js:60438
(anonymous) @ three.webgpu.js:83995
fractalAutomata?preset=Default:1 [Invalid ComputePipeline "computePipeline_compute"] is invalid due to a previous error.

- While encoding [ComputePassEncoder "computeGroup_66523"].SetPipeline([Invalid ComputePipeline "computePipeline_compute"]).
- While finishing [CommandEncoder "computeGroup_66523"].

installHook.js:1 THREE.WebGPURenderer: Uncaptured WebGPU GPUValidationError: [Invalid CommandBuffer from CommandEncoder "computeGroup_66523"] is invalid due to a previous error.

- While calling [Queue].Submit([[Invalid CommandBuffer from CommandEncoder "computeGroup_66523"]])

overrideMethod @ installHook.js:1
error @ three.core.js:2039
\_onError @ three.webgpu.js:60438
(anonymous) @ three.webgpu.js:83995
fractalAutomata?preset=Default:1 [Invalid CommandBuffer from CommandEncoder "computeGroup_66523"] is invalid due to a previous error.

- While calling [Queue].Submit([[Invalid CommandBuffer from CommandEncoder "computeGroup_66523"]])

installHook.js:1 THREE.WebGPURenderer [computePipeline_compute / compute error] at line 55:31: cannot assign 'u32' to 'atomic<u32>'
NodeBuffer_66480.value[ 0u ] = 0u;
^
