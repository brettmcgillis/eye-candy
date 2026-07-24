# // WindowBreaker

# // Intent / Use Cases

- The scene uses the abandoned Factory model/component.
- The factory is sitting on a plane with tall grass/weeds on it. I've included GrassSystemThreeJS as it is an amazing example of generated terrain conditions, with vegetation. I tested this repo out and was able to create the perfect setting for this scene. The terrain i created was bumpy, mossy, damp, grassy, and had coverage masks tweaked for natural appearance. 
- The scene replaces the factory windows with procedural windows comprised of a crossbar and 4 panes of glass
- The scene uses the rocks model/component, instanced so we can have many at no additional perf cost.
- The scene allows the user to click to throw rocks 
- The scene wraps the factory and windows in a physics sim
- The scene allows for breaking the window panes like we do with the fish tank in My Heart Is A Broken Fish Tank
- The scene has a button overlay with buttons for audio, shoot, and cleanup, like dumpsterfire
- The scene plays audio of breaking glass when a window is broken by a rock. (breaking-glass-sprites.mp3, need to extract sprites)
- The scene plays audio of rocks on concrete when the factory wall is hit by a rock. (hitting-a-brick-wall-sprites.wav, need to convert, need to extract sprites)
- The scene plays audio of a soft thump when a rock hits the grass/ground plane. (drop-on-grass-1.wav through -3.wav, need to convert)
- Rocks that land in the grass will disturb the appearance of the grass, bending it out of the way.
- The scene has an orbit cam placed lower to the ground and looking up at the building on an angle, The user can orbit, but is limited to seeing one side of the building, cant go over the top, cant go into the ground.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- add some black geometry inside the factory so we cant see through.
- add a sensor plane inside the building to cull shards that fall inside and wont be seen

# // Presets

# // Features

# // Interactivity

# // Bugs

- cleanup button not restoring windows
- rocks not colliding with glass shards to break further
- grass is causing major lag. need to frustom cull, occlusion cull.
- on rock-glass collision we see the window disappear and then respawn broken.

- shooting rocks is a bit too unpredictable. I assume this came from the Broken Fishtank scene which would have inherited from DumpsterFire. I think we need to align with video games more, where your cursor is the reticle and the point of aim.
