# // Wild Horses

# // TODO:

[Back to main TODO](../../../../../TODO.md)

- [ ] Fire on the tail and mane — port the 3D fluid sim from
      `~/dev/examples/three.js/examples/webgpu_volume_fire.html`. Emitter is the
      rig's bone chains rather than static mesh vertices (see Features).
- [ ] Decide the fire volume's extent. A single volume spanning the whole grass
      plane gives useless voxel resolution at the mane; a per-horse volume
      roughly 1.5–2x horse height is the tractable read of the note.
- [ ] Coat: currently tinted at runtime via `horseCoatColor` +
      `horseCoatDarkness`. If the tint reads as flat, darken the base color map
      in Blender instead.
- [ ] Post-processing pass to marry the realistic horse to the generative
      field. First candidate is GetWrecked's old-photograph pixel bleed.
- [ ] Longer field grass — blade height/width are exposed, but a second grass
      texture (taller, sparser reeds) layered over the base clump may read
      better than scaling the one clump up.
- [ ] Multiple horses currently clone a skinned mesh per member. Profile before
      raising `herdCount` past ~4.
- [ ] Grass push currently treats each horse as a single upright cylinder. If
      the parting reads too circular, weight it by the body's long axis so the
      grass opens in front of the chest and closes behind the hindquarters.

# // Intent/Use Cases

Horses running in place while an endless field scrolls underneath them, with
fire wrapped around the tail and streaming off the mane.

Two references, ported rather than approximated:

- `~/dev/examples/Sketches/experiments/wolf2` — the environment. A scrolling
  simplex-noise field drives terrain displacement, grass placement and wind in
  lockstep; grass is instanced three-quad clumps with an alpha texture; the sky
  is a gradient dome with instanced billboard clouds; the animal casts a fake
  radial shadow blob rather than a real shadow map.
- `~/dev/examples/three.js/examples/webgpu_volume_fire.html` — the fire. A 3D
  fluid sim (semi-Lagrangian advection + curl noise, buoyancy, Jacobi
  projection) raymarched out of a storage 3D texture.

- [ ] Night mode does not spin the camera 180 degrees on switch the way wolf2
      does. The CameraRig owns the camera and its controls are Leva-owned, so
      driving it from the day/night hook would fight that ownership. Decide
      whether the spin is worth a dedicated camera behaviour.
- [ ] Night preset dims the LightingRig by preset value, not by the eased
      transition — the horse's key light pops while the sky wipes. Either ease
      the rig intensities too or accept the pop.

# // Presets

- Default
- Night

# // Features

**Environment (ported).** wolf2's noise MRT target is evaluated analytically in
TSL instead of being rendered to a 64x64 offscreen buffer — same three
functions (height, derived bump normal, two-channel wind), same consumers, one
fewer pass. `utils/noiseField.js` is the shared source both Terrain and Grass
read, which is what keeps the blades planted in the ground they displace.

**Horse.** `animated_horse.glb` on the `HorseALL_RunLoop` clip. The saddle is a
separate skinned mesh under `CH_NPC_MNT_WHsaddle01_MI_KEJ` and is filtered out
by material name. Herd members share the clip with a randomized time offset so
they do not step in unison.

**Fire emitter (not yet built).** The reference seeds density and temperature
into the grid from the teapot's static vertex buffer times a model matrix. A
skinned horse has no such buffer, so the plan is to sample world positions
along two bone chains each frame and emit from those points instead — the same
mechanism, sourced from the rig:

- Tail: `BN_Tail_01_07` → `BN_Tail_05_011`
- Mane: `Bip01_Spine2_028` → `Bip01_Neck_034` → `Bip01_Neck1_053` →
  `Bip01_Head_057`

Both chains are already resolved and handed up by `Horse.jsx` via
`onBonesReady`.

# // Bugs

# // Scripts
