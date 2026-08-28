# The Grand Staircase — build plan

Scene: `src/components/scenes/WebGPU/GrandStaircase/`, area WorkInProgress.
Reference material: `grand-staircase.md` (Brett's compiled descriptions).
Constellation context: `house-of-leaves.md`.

**Status:** planned, nothing built.

---

## The shot

The viewer is being lowered down the centre of the abyss on a rope. Camera sits
at the world origin facing the stair horizontally; orbit is free around the
axis, clamped on how far up it can look. It never descends — **the world moves
up past it.**

Lit only by a faint shaft from the opening far above, occluded by the structure
into the volumetric fog, plus red flares left on landings and in side rooms off
the branching hallways. No figures. Only their leavings.

## Decisions locked

| Question    | Answer                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| Camera      | Stationary at origin, orbit + clamped pitch; geometry treadmills upward   |
| Fall speed  | Leva-controlled, `0` = fixed shot; optional drift toward near-stops       |
| Wrongness   | All four mechanisms, fully parameterised, presets to demo each            |
| Light       | Shaft from the opening + flares on landings and in side rooms             |
| Volumetrics | Full raymarched volume                                                    |
| Branches    | Mouth + short tunnel + occasional side room with a flare                  |
| Ink         | Barely-there mottle; deferred to the end                                  |
| Figures     | None — flares, dropped packs, coils of rope                               |
| Audio       | None for now                                                              |
| Output      | MediaRecorder + shot presets (Brett screen-records)                       |
| Name        | `GrandStaircase` (deliberately literal; the constellation reads as a set) |

---

## 1. The treadmill

Camera fixed at origin. A ring buffer of stair segments translates upward at
`fallSpeed`; a segment passing above the frustum is recycled to the bottom of
the stack with fresh parameters. Several segments stay alive at once — enough
depth for a turn to overlap another turn (§2.3).

Two things this forces:

- **All geometry functions key off a virtual depth counter, not world Y.** The
  counter accumulates forever; world Y stays bounded. Without this, float
  precision degrades and the radius function resets when segments recycle.
- **The volumetric noise must advect with the world.** Fog sampled in world
  space will swim against geometry that is moving through it. Offset the noise
  lookup by the same accumulated depth.

`fallSpeed = 0` freezes the treadmill for locked-off shots — the fog and flare
flicker keep running so a static frame is still alive.

## 2. The wrongness — four independent, parameterised mechanisms

Baseline must read as a plausible spiral or none of these land. Every mechanism
gets amplitude + frequency on Leva, all defaulting low.

1. **Radius drift.** Diameter as a function of depth, `200ft → 500ft+`, driven
   by low-frequency noise. The best-supported detail in the source. The shaft
   is a lofted surface of revolution sampling the same function, so wall and
   stair can never disagree.
2. **Non-concentric turns.** Per-turn lateral offset of the spiral axis, ramping
   with depth. The building approximating a spiral rather than constructing one.
3. **Self-overlap.** Occasional stretches where a turn's radius/offset puts it
   over another live turn, so down / across / more-staircase stop being
   distinguishable. Needs the deepest segment window; cheapest to author as a
   depth-keyed event rather than continuous noise.
4. **Landing period drift.** Interval between landings (and therefore hallway
   mouths) never resolves into a countable pattern. The one countable cue the
   viewer has, quietly lying.

Presets: `Plausible`, `Breathing` (1 only), `Off Axis` (2), `Escher` (3), and
`Everything`.

## 3. Geometry

- **Shaft wall** — lofted cylinder, radius from the depth function. Smooth,
  ash-grey, no trim, no ornament, nothing that reads as scale. Brutalist, not
  Gothic.
- **Steps** — instanced, sampling the same radius/offset functions. Exposed
  outer edge, no enclosure: the central void must be open, since the vertigo in
  the source comes from looking _over_ an edge.
- **Landings** — wider platforms on the drifting period, carrying the hallway
  mouths and most of the leavings.
- **Branches** — a mouth, a few metres of tunnel, and on a random subset a side
  room holding a lit flare. The flare is never directly visible from the stair;
  only its red spill reaching the landing.
- **Leavings** — flares, a dropped pack, a coil of rope. Scattered on a seeded
  basis so a given descent is reproducible.

Scale target: the far side of the stair should be far enough away to be barely
resolvable through the fog. That contrast is what sells 500 feet with no figure
in frame.

## 4. Light and volume

- Raymarched volumetric in TSL. `GetWrecked/components/FogRig.jsx` is the
  nearest existing reference for the fogNode/uniform plumbing, but that scene is
  an analytic ramp — this needs a real march so the shaft genuinely stripes
  against the stair rather than faking it.
- **The shaft** — single soft source at the opening, far above, falling off into
  true black. Occluded by every turn it passes, which is the signature image.
- **Flares** — small red emitters that must scatter into the volume, flicker,
  and be occluded by the stair as the treadmill carries them past.
- Deep black falloff. Darkness as material. No visible bottom — not a black
  disc, not a fog wall, absence of information.

Cost is the real risk here: a full march plus many small lights is the
expensive path. Mitigation is a low march step count with blue-noise jitter and
temporal reprojection, and treating flares as a limited pool of active lights
(only those within a depth window contribute).

## 5. Walls — deferred

Barely-there mottle so the grey never reads as flat shading, with the option of
a Rorschach-derived ink field that drifts imperceptibly: you look closer at the
wall and realise it isn't stationary. Do this **last**, once fog and falloff are
right — it's an easy way to accidentally make the featureless walls featured.

## 6. Repo shape

Copy `Template/SceneTemplate/`. Required per §13: presets folder, `CameraRig` +
`useSceneCameraControls`, `useMediaRecorder`. Presets carry the shot list
(centred / near-stair / looking up / static hold) alongside the wrongness
presets, so a social clip is one click.

Registration is a colocated `scene.config.jsx` — never hand-edit
`sceneRegistry.jsx`.

## 7. Build order

1. Treadmill + plain concentric spiral + orbit camera. Prove the loop is
   invisible before anything else.
2. Shaft wall, landings, hallway mouths. Establish scale.
3. Raymarched fog + the overhead shaft. This is the moment the scene either
   works or doesn't.
4. Flares, side rooms, leavings.
5. Wrongness mechanisms 1–4, parameterised, plus presets.
6. Shot presets.
7. Wall mottle / ink.
