# // getWrecked()

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

A tribute to Mark Klink's 2014 "3D Glitch Notes" series
(srcxor.org/blog/3d-glitching) — his raw Wavefront .obj text corruption
techniques (cutting/pasting vertex blocks, find-and-replace digit
substitution, cursor-distance sort "hopscotch" patterns, vt-line texture
scrambling) translated into a live TSL vertex/UV shader instead of one-off
hand text-editing, applied to `destroyed_car.glb`. The mechanism is
geometry-agnostic and could be pointed at other models later.

## // TODO:

- pixel sort post processing. chunks of screen get pixel sorted. could be horizontal or verical bands, could be noise/cell noise driven.
- slit scan post processing. horizontal or verical bands of screen get slit scanned.

## // Presets

## // Features

## // Interactivity

## // Bugs

### // Glitches

~~CUT&PASTE
type: geometryPermutation + vertexShaderBlend. The CPU shuffles vertex-index blocks and the shader blends a density-based subset onto the remapped positions. The car looks like body chunks were cut and reassembled in the wrong order.

~~HOPSCOTCH
type: geometryPermutation + vertexShaderBlend. Vertices are sorted by distance from a chosen origin, circularly shifted by stride, and then remapped. It creates ridges, valleys, and jump-band artifacts that feel like the mesh is being reordered by a cursor-distance pass.

~~FIND&REPLACE
type: vertexDisplacement. A hashed per-vertex mask selects a density subset, then each selected vertex is either sign-flipped or scaled by magnitude. The effect reads as harsh numerical corruption: mirrored spikes, inversions, and sudden exploding pops.

~~TEXTURE_SCRAMBLE
type: uvPermutation. Texture UVs are block-shuffled and mixed back into the original UV field. The body keeps its silhouette, but the paint and decals jump to wrong panels like a broken texture atlas.

~~SLIT_SCAN
type: geometryStretch + interpolatedTextureSmear. Vertices beyond an axis-aligned slit are translated while the narrow slit band ramps across the full offset; its existing UVs interpolate across that stretched geometry to smear the texture. Visually it reads like an old-computer scan fault that pulls one strip long and makes the model larger than it should be.

~~SCROLL_TEAR
type: uvDistortion. UV rows past a tear point are clamped toward a frozen row over a smear range. It produces a dragged, stale-scanline effect where the texture repeats from a stuck row.

~~ROW_JITTER
type: uvBandOffset. Positions are grouped into axis bands and each band gets a randomized horizontal UV offset. The result looks like deck-board misalignment or offset scan rows sliding independently.

~~RESOLUTION_LOSS
type: uvQuantization. UVs are snapped to block centers in a random subset of cells. The surface becomes patchwork low-resolution, with textured blocks replacing fine detail.

~~TORN_OPEN
type: proceduralHoleMask + wireframeReveal. A Perlin mask strips parts of the surface while a barycentric wireframe mask preserves the panel edges, revealing a torn-edge wire skeleton. The car looks like panels have been ripped open and only the wire outline remains intact.

~~BLOCK_DECONSTRUCT
type: cellBasedVertexTransform + alphaMask. The model is divided into local cells that translate and rotate as rigid blocks while a sweep reveals them. Visually, the car breaks into drifting chunks that peel apart along a chosen axis.

~~SLICE_SUITE
type: sectioningVertexTransform + fragmentCulling. Slices are pushed apart, twisted, and optionally jittered as a set of connected slabs, with bridge triangles discarded to keep them cleanly separated. The effect feels like the car is being sectioned and peeled apart into discrete slabs.

~~VOXEL_SNAP
type: gridSnapVertexTransform + normalQuantization. Vertices snap to a 3D voxel grid and normals snap to cardinal axes for cube-like shading. The surface becomes faceted and blocky even though the mesh still has smooth topology beneath it.

~~INNER_STRETCH
type: cellMaskedVertexExtrusion. A hashed subset of cells is pushed outward or inward along a tapered radial direction, with chaos and sharpness controlling the burst. It reads like pressure is swelling or collapsing local panels through the body shell.

~~WARP_FIELD
type: noiseFieldVertexWarp. A continuous 3D noise field offsets the whole mesh with animated frequency and amplitude. The result is a fluid, heat-haze-like warping that ripples across the full vehicle.

~~MIX
type: compositeControl. This is the compound layer pass that combines the above techniques with wireframe and reseeded permutations. The overall look is a layered glitch state where geometry, UVs, and hole masks all act together.

~~CHROMATIC_ABERRATION
type: postProcessing (screen-space). RGB channels are offset after rendering to simulate lens or sensor misregistration. The result is colored fringing along edges and bright contrast boundaries.

~~PIXEL_SORT
type: postProcessing (screen-space). Bright pixels walk in a direction until a threshold break or step cap, painting a directional streak span. It looks like bright scan streaks or drips extending out of the frame.

~~PIXEL_BLEED
type: postProcessing (feedback). The pass bleeds neighboring color into a directional smear to mimic analog ghosting and channel leakage. The render feels like it is trailing or bleeding in a single direction.

~~DATAMOSH
type: postProcessing (feedback). Macroblock corruption and displacement are applied to the finished frame to mimic codec decay and lost data blocks. It produces a compressed, corrupted-frame look with macroblock artifacts and motion smear.
