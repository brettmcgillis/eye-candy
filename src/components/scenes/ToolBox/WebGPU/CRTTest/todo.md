# CRT Migration Plan - WebGPU CRTTest

[Back to main TODO](../../../../../../TODO.md)

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

## CRT Migration Plan - WebGPU CRTTest

## Phase 1 - Discovery

- Confirm the WebGPU CRTTest scene mirrors the WebGL toolbox scene structure in `CrtToolboxScene`.
- Identify which CRT materials still rely on WebGL-only render-to-texture paths.
- Verify that `threeD` and `pip` remain separate channels in `channels.jsx`.
- Capture the exact warnings or errors produced by WebGPU before changing the materials.

## Phase 2 - Implementation

- Convert `crtSceneMaterial.jsx` to a native WebGPU scene-capture path that renders a real scene through `pass(scene, camera)`.
- Keep the nested JSX scene isolated from the toolbox scene so the panel layout stays unchanged.
- Keep `crtSceneInSceneMaterial.jsx` on native WebGPU render targets and ensure its feedback texture path is valid.
- Dispose scene render targets on unmount so hot reload does not leave destroyed textures behind.
- Only touch `crtShowMaterial.jsx`, `crtBlueScreenMaterial.jsx`, `crtStaticMaterial.jsx`, or `crtSmtpeStaticMaterial.jsx` if one of them turns out to be the source of the same WebGPU issue.

## Phase 3 - Validation

- [ ] `npm run build` succeeds.
- [ ] WebGPU CRTTest opens without `CopyExternalImageToTexture()` warnings.
- [ ] No destroyed-texture warnings appear during remounts or hot reload.
- [ ] `threeD` and `pip` still appear as separate channels.
- [ ] The WebGPU toolbox scene still matches the WebGL panel layout and camera framing.

## Phase 4 - Follow-Up

- Recheck any remaining CRT warnings in the browser console after the scene materials are stabilized.
- Compare the WebGPU and WebGL CRTTest scenes side by side and only then decide whether any of the remaining materials need a parity pass.
- If a warning only appears in one channel, fix that channel's texture source rather than changing the whole CRT stack.

## Notes

- The WebGPU scene material should follow the repo pattern used by other WebGPU post effects: render a real scene with `pass(scene, camera)` and sample the output node.
