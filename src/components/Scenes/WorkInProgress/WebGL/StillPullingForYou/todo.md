# // Still Pulling For You

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene features a steam tug boat sinking in the water, as steam emerges from the smoke stack.
- The scene has a white background.
- The scene includes a tugboat model positioned in the center with the nose up in the air and half of the ship submerged.
- The scene includes a smoke system emerging from the smoke stack and rising up symbolizing the ship still running.
- The scene includes water and waves surrounding the tugboat.
- The scene uses some shader to stylize the look of the water
- The scene uses some shader to modify the height of the water over time to illustrate waves moving around the boat.
- The scene uses some geometry witha a transparent material to represent a volume of water

- Ocean Scene Example - Great example of a skybox w/controls for sky appearance. Realistic water appearance with no mouse or surrounding mesh interactivty.
- Interactive Water Plane Example - Great example of a water-like plane. Unrealistic water appearance. Cartoonish water waves with mouse interaction (and potentially programmatic interacion). Good interaction with surrounding meshes (ducks)

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] Add smoke from smokestack
- [ ] Design and add scene controls

# // Features

# // Bugs

- [ ] Fix camera angle

// Same as StayingAfloat

- [ ] Fix triangle shadow artifacts
- [ ] Fix water. The wavy top and the solid volume should be one contiguous unit of geometry. Should we use a NURBS volume for the water? Looks like it suports building a rectangular prism with irregular face geometry on the top face, as well as irregular side face configuration.
