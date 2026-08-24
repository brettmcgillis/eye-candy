# // Write Off

# // Intent/Use Cases

A tribute to Mark Klink's 2014 "3D Glitch Notes" series
(srcxor.org/blog/3d-glitching) — his raw Wavefront .obj text corruption
techniques (cutting/pasting vertex blocks, find-and-replace digit
substitution, cursor-distance sort "hopscotch" patterns, vt-line texture
scrambling) translated into a live TSL vertex/UV shader instead of one-off
hand text-editing, applied to `destroyed_car.glb`. The mechanism is
geometry-agnostic and could be pointed at other models later.

# // TODO:

[Back to main TODO](../../../../../TODO.md)

- Datamosh post fx?

# // Presets

# // Features

# // Bugs

# // Glitches

~~CUT&PASTE
type: geometryPermutation + vertexShaderBlend. CPU precomputes shuffled vertex-index blocks and the shader blends a density-selected subset to those remapped positions. Visually, body chunks look spatially spliced and reassembled out of order.

~~HOPSCOTCH
type: geometryPermutation + vertexShaderBlend. Vertices are distance-sorted from a chosen origin, circularly shifted by stride, then remapped back to index order. The model shows alternating ridges/valleys and positional jump bands radiating from the chosen area.

~~FIND&REPLACE
type: vertexDisplacement. A random per-vertex mask chooses a density subset, then each selected vertex is either sign-flipped or magnitude-scaled. It appears as harsh numeric corruption with mirrored inversions, spikes, and explosive shape pops.

~~TEXTURE_SCRAMBLE
type: uvPermutation. UVs are block-shuffled and blended against original UVs in shader space. The silhouette stays mostly intact while texture detail jumps to incorrect panels like a collage.

~~SCROLL_TEAR
type: uvDistortion. UV rows past a tear line are clamped toward a frozen row over a configurable range/strength. You get scanline-like smear where lower regions repeat from a stuck band.

~~ROW_JITTER
type: uvBandOffset. Local-space axis bands get independent hashed horizontal UV offsets. Visually this creates strip misalignment, like sliding scan rows or shifted deck boards.

~~RESOLUTION_LOSS
type: uvQuantization. UVs are quantized to block centers for a random density subset of blocks. Surface detail becomes patchy and chunky in low-resolution islands.

~~TORN_OPEN
type: fragmentDiscard + wireframePreserve. Perlin patches remove fragments while barycentric edge logic keeps structural edge lines opaque, then alpha-test punches real holes. Visually, panels look ripped out with wire skeleton traces left behind.

~~BLOCK_DECONSTRUCT
type: cellBasedVertexTransform + alphaMask. Local-space cells are moved/rotated as rigid chunks with axis-sweep reveal, chaos, and per-cell alpha reduction. The car breaks into drifting, twisting blocks that separate directionally.

~~SLICE_SUITE
type: sectioningVertexTransform + fragmentCulling. Axis slices are pushed apart, twisted, jittered, and partially faded, with straddling bridge triangles culled for clean separation. It reads as true cross-sectional slab disassembly.

~~VOXEL_SNAP
type: gridSnapVertexTransform + normalQuantization. Vertices snap to a 3D grid with optional jitter, and normals snap to cardinal axes for cubic lighting. The result is a blockified silhouette with faceted voxel-like shading.

~~INNER_STRETCH
type: cellMaskedVertexExtrusion. A hashed subset of local cells is displaced along per-cell random directions with positive or negative stretch. It appears as clustered spikes or cave-ins punching through the shell.

~~WARP_FIELD
type: noiseFieldVertexWarp. Continuous 3-axis noise displaces all vertices with frequency/speed controls. Visually this is a liquid, heat-haze-like wobble across the whole car.

~~MIX
type: compositeControl. This combines multiple glitch passes and reseeded permutations rather than introducing a separate transform algorithm. The look is layered corruption across geometry, UVs, and holes at once.

~~CHROMATIC_ABBERATION
type: postProcessing (screen-space). A WebGPU post pass offsets color channels and composites with depth masking to avoid background contamination. You see color fringing on high-contrast edges like optical/sensor misregistration.

~~PIXEL_SORT
type: postProcessing (screen-space). Bright-enough pixels step along a direction until threshold break or step cap, painting directional streak spans. Visually this creates drip-like scan smears extending from bright regions.
