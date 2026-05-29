# // Aisle 9

# // Intent / Use Cases

- The scene ports the WebGPU black hole study from the external example repo into Eye Candy's scene scaffold.
- The scene should keep the original gravitational lensing, procedural star field, nebula layers, and bloom pass intact.
- The scene should expose the imported black hole parameters through Leva so the look can be tuned and copied back into presets.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] create a camera spline starts at the entrance of the store, walks down an aisle, turns and sees the black hole, orbits around it, then heads down another aisle before looping back to the front of the store to restart the loop.
- [ ] set up a mode where periodically geometry gets spawned into scene and sucked into the blackhole before being culled from scene.

# // Presets

- [x] Convenience Store default
- [x] Source Starfield background from the imported demo

# // Features

- [x] WebGPU black hole raymarch shader

# // Bugs

- [ ] Audit the legacy control values that are currently exposed but not consumed by the ported shader/runtime
