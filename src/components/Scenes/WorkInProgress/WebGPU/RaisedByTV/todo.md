# // RaisedByTV

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- The hero WebGPU CRT scene: three televisions, the floor, and the ring light.
- This is the composition target for the CRT shader family once the WebGPU materials reach parity.
- Scene layout should stay thin and consume the shared CRT control and channel layer instead of owning its own shader settings.

# // Presets

- [ ] Add hero framing presets for orbit, low-angle promo shot, and straight-on poster shot.

# // Features

- [ ] Replace placeholder TV screens with the WebGPU CRT shader set.
- [ ] Add a WebGPU-safe floor treatment that restores more of the original reflective hero look.
- [ ] Tune the TV default channels and power states for the final hero composition.

# // Verification

- [ ] Confirm all three TVs mount under WebGPU without falling back to WebGL-only screen materials.
- [ ] Confirm the shared CRT control schema still drives the hero scene channel appearances.

# // Bugs
