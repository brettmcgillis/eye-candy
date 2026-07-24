# // PixelHater

# // Intent/Use Cases

- I need a shader or component that will allow me to selectively pixelate sections of a secen for artisitc intent. Example: I have a scene with a smooth gradient in it, and I want to add a glass plane to the scene that will pixelate the gradient when looking through the glass, leavig me with solid colored squares where the plane obstructs the gradient.
- I want to be able to put this on any geometry. Example, I have a box that is pixelated. as other shapes enter the box they become pixelated. Shapes outside the box are not pixelated. Shapes in front of the box do not have their color reflected in the pixelation. Shapes behind the box do have their color reflected in the pixelation.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

1. Screen-space "fake voxels" (easiest, closest to what you have)
   In the fragment shader, reconstruct the world position behind the mesh (either from a depth texture via raymarching, or from the mesh's own surface position). Snap that position to a 3D grid: vec3 voxelPos = floor(worldPos / voxelSize) \* voxelSize. Then shade each fragment based on which voxel cell it falls into — you can use the voxel center as a lookup key for color, or fake lighting by computing a normal from the dominant axis of the view ray hitting the voxel face. This gives you Minecraft-ish blocky shading without actually generating geometry.
2. Raymarched voxels inside the wrapper mesh
   Similar to how your fire shader raymarches, you'd march through the bounding volume of the wrapper mesh, stepping in voxel-sized increments. At each step, sample whatever you're "censoring" (a 3D texture, the scene behind via depth, an SDF, etc.) and return the first hit snapped to grid. This gives you real voxel faces with proper silhouettes and is probably the best-looking option.
3. Actual instanced voxel geometry
   Generate a grid of instanced cubes inside the wrapper's bounds, and in the vertex/fragment shader decide visibility per-instance based on what's behind. More expensive but integrates cleanly with R3F's normal lighting/shadow pipeline.

# // Presets

# // Features

# // Bugs
