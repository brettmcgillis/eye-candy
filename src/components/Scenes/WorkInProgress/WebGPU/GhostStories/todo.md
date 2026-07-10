# // GhostStories

# // Intent / Use Cases

- This scene is the culmination of the work done in GhostBuster and CharacterController
- This scene is a playable scene using the ecctrl module and the ghost character.
- The scene provides custom materials to the ecctrlJoystick
- The scene contains a playable Ghost character, with selectable skin
- The scene contains a skybox using the starfield texture
- The scene contains a small emissive moon in the sky
- The scene features atmospheric lighting to further the nighttime effect.
- The scene contains emissive particles that resemble fireflies
- The scene contains procedurally generated terrain.
- The scene contains water at the lowest parts of the generated terrain.
- The water's mesh reacts to the ghost's movement over top of it, like the cursor interaction built into `~/dev/examples/three.js` examples `webgpu_compute_water.html`
- The scene contains procedurally generated grass that appears blown by the wind.
- As the ghost character moves through the grass it bends and deforms in reaction to the ghost's shape.
- included in the grass are flowers that also blow in the wind and collide with the ghost, like in TouchGrass.
- The scene contains a height-based fog that also flows with the same wind as the grass. The fog should be distributed using a world-space noise function if possible, so that it is not an even layer. if this is not possible we may want to ensure that the max height of the fog is less than the max height of the terrain so that it 'pools' in the low areas.
- The simondev QuickGrass example is a good starting point for the aesthetic i want. `~/dev/examples/Quick_Grass`
- The 'world' is tiled to infinity. but still has an unreachable mountain range in the background, veiled by a height based fog.
- The scene contains abandoned buildings, playgrounds, brutalist architechture, and cars, shipping containers, chainlink fences, a Bret model, all being reclaimed by nature.
- The scene contains audio of light wind and the sound of crickets, and the sound of frogs when near water. Additionally the scene contains the Audio toggle overlay button like scene Surrender

- how can we handle perf well? can we stream assets in as theyre needed? once the scene is setup and testable we can start to consider what post will be applied, and at this point there may be more decimation of meshes and textures we can get away with.

- have many assets staged for commit for use in this scene.
  - These assets are packs derived from a single file.
    - Abandoned Playground (swings, teeter totter, ladder)
    - BrokenConcreteDebris, several concrete chunks as well as wall portions
    - DamagedChainlinkFenceSegments - 4 segments.
  - we have a utility pole. needs texture/color due to specular/glossy not getting carried over. have a series of these linked by power lines. meshes are unlableled so will require some manual testing/config, but once we understand the meshes we can doc, and bake wire positions/anchors.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Presets

- [x] Night Meadow (default) — flat keys 1:1 with the Leva schema

# // Features

- [x] Ecctrl playable ghost (Hero skin via `presets/skins.js`; cloth blown back by travel speed, jump squash from vertical velocity)
- [x] Custom ghost-themed joystick materials (TouchJoystickOverlay promoted to `src/modules/ecctrl/`, props pass through)
- [x] Endless chunked terrain (`utils/worldgen.js` samplers; CPU-displaced meshes + fixed trimesh colliders per chunk, streamed in a ring)
- [x] Wind grass (TSL blade material) that bends around the ghost; thins along paths and shorelines
- [x] Worn pathway network (iso-lines of a low-freq noise field) threading between settings
- [x] Wildflowers with wind sway + ghost-proximity lean
- [x] Starfield sky dome + emissive moon + moonlight/ambient night lighting
- [x] Height fog: world-space noise (pools unevenly), drifts with the wind, plus long-range haze veiling the mountain ring
- [x] Unreachable mountain silhouette ring following the player
- [x] Fireflies (chunk-seeded, additive points)
- [x] Ghost-reactive compute water (ported from `webgpu_compute_water`; patch anchored to the ghost's chunk, ripples from ghost speed near the surface)
- [x] Chunk-seeded abandoned settings (house at spawn; container / playground / ruin-arch gathering / car wreck / fence / debris / rare Bret)
- [x] Audio: wind + night ambience loops, frog loop swelling near water, AudioToggleOverlay
- [ ] Drop frog audio at `public/audio/frogs-croaking.mp3` (convert the WAV; later: croak-sprite slicing via the sprite script)
- [ ] Utility pole line (meshes unlabeled — needs manual mesh mapping + baked wire anchors before it can join the settings)
- [ ] Per-setting scale/lift tuning pass (element pack pivots vary; tune in `utils/settings.js`)
- [ ] AbandonedHouse is 644 draw calls — decimate/merge before it can appear outside the spawn chunk
- [ ] Post pass (deliberately absent until layout + perf settle)
- [ ] Add a camp fire
- [ ] lets add some `ez-tree`s to the landscape and distance based fog? to help hide the seems a bit.

# // Interactivity

- [x] Character Control and world-space exploration (WASD/arrows + shift sprint + space jump; touch joystick on mobile)

# // Bugs

- [ ] Ecctrl is choking on webgpu. the character capsule is doing all kinds of extra movement that it should not be. causes cloth to fall off ghost's collider spheres. I believe we see this in CharacterController when comparing gpu to gl as well. fuck
- [ ] moon looks like a flat circle, cant clearly see the moonTexture
- [ ] wheres the water?
- [ ] scale up shipping container, slide, cars
- [ ] scale up playground, space elements out, run animation.
- [ ] scale down the arches still fucking huge & their colliders dont seem to align, keep getting stuck on them.
- [ ] scale up concrete debris and make sure were not just plopping the collection down in place, theres a bunch of floating geometry in the collection that we actually want resting in the grass.
- scale up fence segments and make sure were not just plopping the collection down in place, they are 4 unconnected elements.
- [ ] add the other abandonned car back into the collection of things to show.
- [ ] seeing an issue where things/grass/terrain seem to pop into place. assuming this is when crossing chunks?
- [ ] is grass popping in and out as i cross chunks? sort of looks like it. lots of visual stuttering in the scene despite generally running smoothly
- [ ] Dont see any fog. expecting areas where the character can go into the fog due to terrain dips
