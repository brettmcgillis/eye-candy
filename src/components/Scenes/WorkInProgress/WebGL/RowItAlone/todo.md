# // Row It Alone

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene features an empty rowboat flowing on the ocean
- The scene contains a plane with shader effects applied to resemble water as well as modulate the height of the plane to simulate choppy waters
- The scene uses rapier physics on the water, boat and oars to allow the boat to float on the water and move up and down with the waves

- Ocean Scene Example - Great example of a skybox w/controls for sky appearance. Realistic water appearance with no mouse or surrounding mesh interactivty.
- Interactive Water Plane Example - Great example of a water-like plane. Unrealistic water appearance. Cartoonish water waves with mouse interaction (and potentially programmatic interacion). Good interaction with surrounding meshes (ducks)
- Rapier Locked Transforms Example - An example of how we might use locked transforms in the scene to ensure the oars & oarlocks of the boat can move around while still staying locked in place. The boat and oars should ride up and down on the waves and the oars should always stay with the boat.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] Design and add scene controls

# // Presets

# // Features

# // Interactivity

- [ ] Water Surface/Cursor interaction
- [ ] Water Surface/Cursor/Hands interaction

# // Bugs

- [ ] Fix water, it only appears to wave in 1 direction (ex north-south) should probably be all 4 (ex, north-south + east-west)
- [ ] Fix sky, doenst really match ocean shader example
- [ ] fix water appearance, use waterShaderExample
- [ ] Fix fog, use heightFog reference
- [ ] Fix boat, oars seem fixed in place, should use locked transforms at the oarlocks to allow them to move up and down like on a real boat.

- [ ] Fix console error:
      Cannot update a component (`Loader`) while rendering a different component (`FloatingBoat`). To locate the bad setState() call inside `FloatingBoat`, follow the stack trace as described in
