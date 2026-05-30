# // Aisle 9

# // Intent / Use Cases

- The scene ports the WebGPU black hole study from the external example repo into Eye Candy's scene scaffold.
- The scene should keep the original gravitational lensing, procedural star field, nebula layers, and bloom pass intact.
- The scene should expose the imported black hole parameters through Leva so the look can be tuned and copied back into presets.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] set up a mode where geometry periodically gets spawned into scene and sucked into the blackhole before being culled from scene.

# // Presets

- [x] Store
- [x] Guided Tour
- [x] Surveillance
- [x] Space

# // Features

- [x] WebGPU black hole raymarch shader

# // Bugs

- [ ] Audit the legacy control values that are currently exposed but not consumed by the ported shader/runtime
- [ ] Fix disc visibility on Surveillance.
- [ ] Fix disc visibility on Guided tour
- [ ] Fix bodies visibility on Space2
