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

[Back to main TODO](../../../../../TODO.md)

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
- [x] Drop frog audio at `public/audio/frogs-croaking.mp3` (convert the WAV; later: croak-sprite slicing via the sprite script)
- [ ] Utility pole line (meshes unlabeled — needs manual mesh mapping + baked wire anchors before it can join the settings)
- [ ] Per-setting scale/lift tuning pass (element pack pivots vary; tune in `utils/settings.js`)
- [ ] AbandonedHouse is 644 draw calls — decimate/merge before it can appear outside the spawn chunk
- [ ] Post pass (deliberately absent until layout + perf settle)
- [x] Add a camp fire (FireAndSmoke + warm point light; standalone `campfire` setting + embers in the `gathering` ring)
- [x] `ez-tree`s scattered per chunk (5 cached templates cloned — 2 draw calls/tree; trunk cylinder colliders; bushes collider-free). Leaf wind is a WebGL-only shader injection so leaves hold still on WebGPU.

- [ ] add a glowing ghost inside the abandonned house.
- [ ] campfire looks weak
- [ ] concrete debris needs dealing with, still seeing floating chunks. either break the model into usable pieces, or remove entirely.

# // Interactivity

- [x] Character Control and world-space exploration (WASD/arrows + shift sprint + space jump; touch joystick on mobile)

# // Bugs

- [~] Ecctrl WebGPU capsule jitter: disabled `autoBalance` (its spring overshoots on WebGPU's spikier frame deltas and shakes the capsule/cloth). If wobble persists, next suspects: fixed `timeStep` vs interpolation, and clamping delta inside the ecctrl fork. Needs an eyeball.
- [x] Moon flat circle: it was being flattened by the fog haze (fully saturated at 765u) — `WebGPUMoon` now takes `fog={false}` + `emissiveUsesTexture` so craters glow through
- [x] Wheres the water: two causes — waterLevel -1.4 was ~2σ below mean terrain (≈2% coverage; now -0.4), and water only existed on the 3-chunk sim patch (a static ring of quads now fills the rest of the loaded world at table height)
- [x] Scales: house/container/slide/cars ×2, playground ×2.2 + slide spaced out + swing animation playing (`animated` prop on the element)
- [x] Arches ×0.18 and ghost-permeable (`collider: false` per piece in settings.js)
- [x] Debris: pack split into per-piece exports (`DebrisPiece` — pillars/walls/corners, pivot at origin); `debris` setting scatters 5 pieces resting on the terrain, ×2
- [x] Fence: pack split into 5 per-segment exports (`FenceSegment`, incl. the torn end with wire scraps); `fence` setting staggers them with gaps/lean, ×2
- [x] Other abandoned car back in: abandoned_car.glb is ONE wrecked car with parts flung around the site — placed whole as the `crashSite` setting (lift -5 to ground it, needs eyeball); CrashedAbandonedCar back to ×1
- [x] Chunk-crossing pop/stutter: chunks now reveal one per frame center-out (the row of synchronous geometry+scatter builds was the hitch), and grass fades to zero blade height before the ring edge so streaming happens behind the fade
- [x] Fog invisible: pool fog's distance ramp kept it off everything within 25m (exactly where you'd wade into it) — ramp now 1..8m, denser defaults (poolDensity 0.8, top 1.2, bottom -0.8)
- [x] Element scaling: settings pieces now scale/rotate at the scene wrapper only; element internals untouched (pack pieces re-exported pivot-at-origin instead)
- [x] Sweeping wind: blade material now uses QuickGrass's scheme — wind _direction_ is a slow spatial noise swirl, lean amount is a traveling noise field (remapped so every blade always leans, eased so gust fronts sweep), plus gust-glow on the tips. windScale/Speed/Strength defaults retuned
- [ ] Blind-tuned values that need an eyeball: per-piece scales/lifts in `utils/settings.js`, car variant ground offsets, campfire scale, tree density/scale, fog density
