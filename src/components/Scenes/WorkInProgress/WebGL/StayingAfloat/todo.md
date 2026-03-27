# // Staying Afloat

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene has a white background.
- The scene contains an isometric view of a transparent column of water. The water column is segmented by depth with a lighter blue used in the top section of the column and darker blue in the bottom.
- The scene contains a life preserver floating atop the water
- The scene contains a hammerhead shark in the water
- The scene contains a tiger shark in the water
- The sharks are animated to swim using the animations in the model
- The sharks should be fur\ther animated such that they are circling.

- Ocean Scene Example - Great example of a skybox w/controls for sky appearance. Realistic water appearance with no mouse or surrounding mesh interactivty.
- Interactive Water Plane Example - Great example of a water-like plane. Unrealistic water appearance. Cartoonish water waves with mouse interaction (and potentially programmatic interacion). Good interaction with surrounding meshes (ducks)

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] Design and add scene controls

# // Features

# // Bugs

- [ ] Scale tiger shark
- [ ] Remove tiger shark attack animation
- [ ] Fix shark orientations while following curve. they seem to be rotating in the opposite direction they are travelling.
- [ ] Slow down how fast sharks follow the curve
- [ ] Try to stagger movement so they are circling, opposing eachother.
- [ ] Seeing this error in console:
      [.WebGL-0x1140543a600] GL_INVALID_OPERATION: glDrawElements: Feedback loop formed between Framebuffer and active Texture.

// Same as StillPullingForYou

- [ ] Fix triangle shadow artifacts
- [ ] Fix water. should have 3 layers, currently only 2
- [ ] Fix water. The wavy top and the solid volume should be one contiguous unit of geometry. Should we use a NURBS volume for the water? Looks like it suports building a rectangular prism with irregular face geometry on the top face, as well as irregular side face configuration.
