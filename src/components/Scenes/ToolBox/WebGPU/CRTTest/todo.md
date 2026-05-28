# // CRTTest (webGPU)

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- A WebGPU layout twin of the WebGL CRT toolbox scene.
- Holds the exact same panel composition so CRT shader migration work is isolated to screen materials instead of scene structure.
- Starts with placeholder channel surfaces and becomes the parity target for TSL ports.

# // Presets

- [ ] Mirror the WebGL toolbox presets once the shared control schema settles.

# // Features

- [ ] Replace each placeholder panel with its TSL/WebGPU CRT equivalent.
- [ ] Keep the panel spacing, camera framing, and board treatment locked to the WebGL toolbox scene.
- [ ] Add a parity checklist for each migrated channel.

# // Verification

- [ ] Confirm the scene mounts cleanly under WebGPU with no GLSL-only material usage.
- [ ] Confirm the shared control names stay aligned with the WebGL toolbox scene.

# // Bugs
