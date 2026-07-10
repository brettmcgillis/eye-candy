# // GhostBuster

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- A stationary character design workbench for developing Ghost from a simplistic cloth sim into a playable character.
- The ghost stays centered at the origin — no real movement. WASD/arrows/joystick simulate directional wind to preview how the ghost reacts to movement forces.
- The scene includes a small grid material floor (like NetworkTest), basic lighting, and the ghost at center.
- The scene includes all requisite controls to govern the appearance of the background, lighting, grid floor, and ghost.
- WASD/arrow keys control wind direction and strength (W = headwind from +Z, S = tailwind, A/D = side wind). Diagonal combos normalize. Gamepad left stick provides analog direction + strength.
- Spacebar triggers an in-place jump animation (squash → stretch → settle). No Y displacement — just animation preview.
- Number keys 1-5 trigger facial expression animations (mappings TBD as expressions develop).
- The ghost has two "hand" spheres (smaller spheres L/R of main sphere) that trail opposite the wind via spring-follow physics.
- Fixed front-facing camera by default, with a Leva toggle to enable OrbitControls for free-look.
- Eye animations deferred until elliptical cutout shader work is done — placeholder Leva folder ready.

# // Presets

- [ ] Doc existing ones here.

- [ ] Sad ghost. Add small Drei cloud above ghost scale 0.05, y=0.25 above ghost. Rain too. Cloud and rain should not tilt, just always stay immediately above ghost and rain on him. All props for cloud and rain get threaded back up to Leva. Update all other presets cloud & rain visible false. Can we use three-mesh-bvh here to be able to cast a ray from the cloud to the ghost for a rain drop to follow? Should we use one of the cloud gltfs instead of drei (no webgpu)? could we enable lightning (ie a small arc) from cloud to ghost occassionally?

# // Features

# // Verification

# // Bugs
