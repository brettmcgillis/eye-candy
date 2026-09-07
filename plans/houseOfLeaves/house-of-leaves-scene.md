# House of Leaves — the walkable scene

One scene. A short VR-like descent: living room → five-and-a-half-minute
hallway → great room → grand staircase → shaft floor → back to the living room.
Navigable by WASD, arrows, on-screen buttons, mouse and touch, with an autopilot
mode so the endless stretches can be recorded as infinite-scroll clips.

Scene folder: `src/components/scenes/WebGPU/HouseOfLeaves/`, area `wip`.

---

## This supersedes the constellation plan's central constraint

`house-of-leaves.md` locked one rule: _"Do not build a walkable house. The
camera should be trapped, not driven."_ That is now reversed deliberately. The
piece is an experience the viewer moves through, not a shot they are held in.
Everything else in that document — the art direction, the ash-grey featureless
surfaces, darkness as material, no figures, only their leavings — still holds
and is the spine of this build.

The other constellation pieces (Apart(maze)ment, Bigger on the Inside, Ash Tree
Lane, The Growl, The Quarter-Inch) are untouched by this and remain future work.

---

## Inventory: what is kept, moved, and dropped

### Kept as-is

| Thing                               | Why                                                                                                                                                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/houseOfLeaves/geometry/*` | The architectural vocabulary, already parametric and already correct. `shaftFloorDoorways({ count, variance })` is the wagon-wheel spoke set with per-door proportion variance. `createHallway` already does arched sections, reveal depth and side doors. |
| `LabyrinthKit` scene                | Stays a toolbox (`area: 'toolbox'`). It is how pieces get authored and inspected. Per §0 rule 4 the new scene must never import from it — shared work moves to `@modules/houseOfLeaves`.                                                                   |
| `GrandStaircase` scene              | Stays as the on-rails cinematic sibling. It already delivers a camera-pinned, never-repeating descent for video capture, which the walkable scene cannot reproduce.                                                                                        |

### Moved into `@modules/houseOfLeaves` (harvest, then both scenes import it)

| From                                                               | What                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GrandStaircase/utils/surfaceNodes.js`                             | The procedural ash surface — mottle grain plus slow drifting ink, pinned to geometry by undoing the frame's rotation. Becomes the material for the whole kit.                                     |
| `GrandStaircase/utils/fogNodes.js`, `components/VolumetricFog.jsx` | Raymarched volumetric. Needs one addition: an analytic spotlight cone term for the flashlight.                                                                                                    |
| `GrandStaircase/utils/shaftProfile.js`                             | The drift functions — radius, axis, landing period, angle warp, and the plateau-aware rise walk. This is the wrongness, and it is the reason the descent never resolves into a countable pattern. |
| `GrandStaircase/components/Flares.jsx` pooling                     | The 6-light pool and flicker. Merges with the existing `Flare.jsx` component, which has the better body/shadow treatment.                                                                         |
| `LabyrinthKit/utils/corridor.js`, `endlessStair.js`                | Segment variation and flight patterning, seeded by absolute index.                                                                                                                                |

### Dropped

| Thing                                                                                              | Why                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PBR texture sets + `useKitMaterials`                                                               | Triplanar photo sets tile visibly across a 70m room and a 30m shaft, and no amount of detiling fixes it at that scale. The book explicitly describes smooth surfaces with no construction seams — not a decayed bunker. `public/textures/houseOfLeaves/` stops being a dependency of the scene; leave the files, the toolbox can still preview them. |
| `route.js`'s scripted rail — `foldLeg`, `finish`, the hold positions, `dropRate` velocity matching | All of it exists to hand velocity between a moving camera and a moving world at a scheduled moment. Under user-driven movement there is no schedule, so there is nothing to hand over. This is the code that made camera guidance painful; it is not needed.                                                                                         |
| `ContinuousTour`'s `setSurfaceFrame` plumbing                                                      | Only existed because world-space textures slid through folding geometry. Procedural surfaces keyed off the odometer have no such problem.                                                                                                                                                                                                            |

The layout arithmetic inside `route.js` — where the threshold, corridor,
room, shaft and floor sit relative to one another, and the fog-margin sizing —
is kept. It moves into a plain layout module with no path sampling in it.

---

## From the source — the numbers, and what they cost

`grand-staircase.md` is the compiled description doc and it is more specific
than anything else in the folder. Measured against what is currently built:

| Feature                 | Source                    | Built now                          | Ratio |
| ----------------------- | ------------------------- | ---------------------------------- | ----- |
| Shaft diameter, initial | >200 ft (61 m)            | 48 m (`voidRadius: 24`)            | 0.79  |
| Shaft diameter, later   | >500 ft (152 m)           | ~84 m at `radiusDriftAmount: 0.75` | 0.55  |
| Great Hall height       | ≥500 ft (152 m)           | 18 m (`mouthRoomHeight`)           | 0.12  |
| Great Hall span         | possibly ~1 mile (1600 m) | 70 m (`mouthRoomSize`)             | 0.04  |
| Fog reach               | far side "barely visible" | 90 m (`fogFar`)                    | —     |

LabyrinthKit already carries a `Book Scale` preset (`voidRadius: 30.5`) that
hits the initial 200 ft exactly, so the shaft is a preset away from correct.
**The Great Hall is not.** At 70 m across and 18 m high it is a large room; the
source describes a space whose ceiling and far walls are simply not there. That
gap is the single biggest scale correction to make, and it is nearly free —
the room is fog-bounded in every direction, so making it enormous costs
geometry that is never drawn.

### The wrongness, ranked by how well the source supports it

1. **Growth.** 200 ft → 500+ ft over one descent is described as _the_ best-
   supported dimensional change in the book. It is a **slow monotonic ramp over
   the whole descent**, not noise. `radiusDriftAmount` is symmetric noise and
   cannot produce it — the profile needs a ramp term added alongside the drift.
2. **Self-overlap.** "You notice the staircase you're standing on is actually
   above another section of the same staircase. Then another. Eventually you
   can't determine whether you're looking down, across, up, or at another part
   of the staircase." This is the strongest single image in the reference and
   it is already coded — `overlapAmount` / `overlapWavelength`, with a measured
   slope cap so it can never fold the helix.
3. **Non-concentric turns.** The lower stair does not stay concentric with the
   upper; the building is _approximating_ a spiral rather than constructing
   one. Coded as `axisDriftAmount`.
4. **Landing period drift.** The one countable cue, quietly lying. Coded.

All four exist in `shaftProfile.js` and all four default to `0`. Only the ramp
in (1) is missing.

### Details the earlier plan dropped

- **Flares dropped over the edge, never heard to hit bottom.** In the source
  this is how the explorers try to measure the depth, and it fails. In a
  walkable scene it is an _interaction_, not dressing: drop a flare over the
  rim, watch it fall lighting the shaft wall as it goes, and lose it. It is
  simultaneously the best demonstration of "no visible bottom" and the best
  scale cue in the piece.
- **The edge is exposed.** No handrail, no enclosure. An explorer gets vertigo
  looking over it and has to sit down. The walker clamps at the stair edge, but
  nothing should _look_ like it is stopping you.
- **Brutalist, not Gothic** — already carried, restating because it is the
  easiest way to get this wrong.
- **The return journey cheats.** Markers are gone or destroyed; equipment
  starts disappearing; the corridors have changed. Relevant to the way back.
- **Exploration #5** puts a staircase lying on its side in an abyss, vertical
  when Navidson wakes. That licenses far wilder geometry than a spiral without
  violating the book. Out of scope for the first build, but it is permission
  worth having on record.

---

## The spine: one odometer, a world window, a free walker

Everything keys off a single monotonic **odometer** — metres of progress since
the living room — exactly as `GrandStaircase` keys off virtual depth rather than
world Y. Geometry, dressing, flares, fog and drift all sample the odometer, so
none of them can disagree, and none of them care where the world origin
currently sits.

**The walker** (`hooks/useWalker.js`) owns a real position, yaw and pitch. No
Rapier, no collision meshes. Each frame:

1. Input sources collapse to one move vector and one look delta. Keyboard,
   on-screen arrows, pointer drag / pointer lock, and a touch stick all feed the
   same two values, so adding a source is never a change to movement.
2. `zone.constrain(position, desired)` clamps the step to the current zone's
   analytic walkable surface and returns the ground height.
3. The odometer advances by the forward component of what actually moved.

Zones are closed-form, not meshes:

- **Corridor** — a box: half-width and half-height about the centreline.
- **Great room** — a disc of radius R with the stair void punched out, floor
  flat. The only way onward is the top landing, so the void rim is a hard clamp.
- **Helix** — given `(x, z)`, take the angle, clamp radius between the void edge
  and the wall, and read height from the same rise function the geometry is
  swept from. The angle must be carried forward unwrapped from the previous
  frame, or a multi-turn helix is ambiguous about which turn you are on.
- **Shaft floor** — a disc, with the spoke doorways as the only way out.

Because the walker is analytic, it can also be driven by an **autopilot**: feed
it a constant forward vector instead of input. That is the recording mode, and
it costs nothing extra.

### Making the endless stretches endless

This is the one decision to prove before anything else is built, because
everything downstream assumes it works.

Two mechanisms are on the table, and the repo already has one of each:

- **Wrap** (LabyrinthKit). Shift the walker by a period the geometry is
  congruent under. Exact, cheap, geometry is static. But it is _strictly_
  periodic — the same flare in the same alcove every period — and the whole
  point of the piece is a space that never resolves into a pattern.
- **Stream** (GrandStaircase). Recycle geometry through a window around the
  walker, seeded by absolute index off the odometer. Never repeats, and the
  drift functions harvested from `shaftProfile.js` plug straight in.

**Take streaming.** The corridor streams trivially — recycle segment units
keyed by absolute segment index, and never wrap the walker at all. The helix
needs a rebase, since `y` descends without bound: when the walker leaves the
central window, translate walker and world content together by a whole window
step. That is invisible precisely because everything is regenerated relative to
the odometer rather than to world Y, which is the property `GrandStaircase`
already relies on.

Build order step 1 is a bare corridor and a bare helix with this working and
nothing else in the scene. If the seam is visible there, it is visible
everywhere, and nothing else is worth building until it isn't.

---

## The zones

### 0. The living room

Blockout first: a dark room lit by one warm lamp, furniture read from silhouette
and proportion rather than modelled detail — couch, lamp, side table, a window
with night behind it. Warm and low-key, so crossing the threshold is a change of
_colour and material_ rather than a change of exposure. A brightly lit room of
primitives reads as a mockup and undercuts the beat.

Structured so a bungalow GLTF can replace the blockout without touching anything
else: the room is one component behind a fixed contract (floor plane, wall
planes, the north wall panel, and the spawn point). Per §7 a `.glb` gets a
wrapper in `@elements` when one turns up.

**The reveal.** The north wall starts solid. The opening is swapped in only
while the panel is not being looked at — a frustum test on the panel, plus a
"has not been seen since the swap" latch so it can never pop on screen. That is
the book's mechanic (the house rearranges itself unobserved) and it is also the
only honest way to do it; a timer would eventually fire in view.

### 1–3. The five-and-a-half-minute hallway

Narrow relative to its length, ash-grey, featureless, fog thick enough that the
end is never resolvable. A short fixed run either side of the endless stretch so
the threshold and the great room wall are real places at fixed distances.

Through the endless stretch: side hallways, rooms and dead ends passing in the
dark, seeded by absolute segment index. Occasional flares — never directly
visible from the corridor where it can be helped, only their red spill reaching
across the floor.

### 4. The great room

Enormous — the correction above. Ceiling and far walls well beyond the fog, so
the room is defined entirely by what light fails to reach. The stair void is a
cavernous hole in the middle. The walker crosses the floor freely; the void rim
clamps, and the top landing is the only way down.

### 5–7. The grand staircase

The four drift mechanisms in `shaftProfile.js` do the work, plus the growth ramp
that has to be added: the shaft starts at the source's 200 ft and opens toward
500+ ft as the descent goes on. Radius drifts on top of that ramp, the axis
wanders off-centre so lower turns are not concentric with upper ones, rise and
run change, and the number of steps between landings never settles.

The overlap mechanism is the one to spend time on. Getting to the point where a
turn passes over another live turn — where down, across and more-staircase stop
being distinguishable — is the strongest image the reference describes, and it
needs the deepest geometry window to read.

The edge is open. The walker clamps at the stair's outer edge of the void, but
there is no rail and nothing that reads as a barrier; the vertigo is the point.
A flare can be dropped over it, and falls lighting the wall until it is gone.

Landings carry hallway mouths — all the same arched profile, all different
proportions, from human-sized doors up to cavernous thresholds, which is
`openingAngularWidth` plus the existing arch profile with a variance parameter.

The endless stretch here is the same streaming mechanism, plus the rebase.

### 8–9. The shaft floor and the way back

Spokes off the shaft floor, all dark, none hinting at anything. Whichever is
chosen, it becomes the return corridor — one long featureless run to a threshold
back into the living room. The room is as it was, and the opening in the north
wall is gone.

---

## Light

**There is a conflict here that has to be resolved before step 3, and it is the
most serious thing in this plan.**

The brief says the interior is dark except for the flashlight and the occasional
flare. The source says the far side of the staircase is _barely visible_ — and
that visibility is the only reason the 200 ft → 500 ft growth can be perceived
at all. A forward-facing flashlight that reaches nothing makes a 61 m shaft and
a 6 m shaft look identical, which would delete the best-supported piece of
wrongness in the book along with every other scale cue in the piece. In
first-person, with no figure in frame, there is nothing else carrying scale.

So the darkness needs three tiers, not one:

- **The flashlight** — a spotlight parented to the camera with a scratchy cookie
  on `SpotLight.map`, lagging slightly behind the look direction so it feels
  carried. Owns the near field and the corridors. Its cone must appear in the
  volumetric or it reads as a decal on the walls rather than a beam in the air,
  so the fog march gains an analytic cone term.
- **The shaft column** — the faint fall of light from the opening far above,
  occluded by every turn it passes. This is what makes the far side of the stair
  barely resolvable, and it is the tier that carries scale. `GrandStaircase`
  already computes it analytically as the running intersection of the annular
  apertures above, which is both free occlusion and exactly the right image.
- **Flares** — the existing `Flare.jsx` body and shadowed point light, pooled the
  way `GrandStaircase/Flares.jsx` pools them, with only those inside a window
  around the odometer contributing. Plus the droppable one.

The corridor keeps the brief's flashlight-only darkness, because a corridor has
no scale to lose. The shaft does not.

No ambient, no fill anywhere. Deep black falloff, darkness as material.

## Scene shape

```
HouseOfLeaves/
  HouseOfLeaves.jsx          orchestrator only
  scene.config.jsx           id: houseOfLeaves, channel webgpu, area wip
  components/                LivingRoom, Corridor, GreatRoom, Shaft, ShaftFloor,
                             Flashlight, Flares, VolumetricFog, TouchControls
  hooks/useSceneControls.js
  hooks/useWalker.js
  presets/presets.js
  utils/                     layout, zones, streaming, dressing
  todo.md
```

Per §13: presets folder, `CameraRig`, `useMediaRecorder`, overlay-button
pattern. Registration is the colocated `scene.config.jsx` — never a hand edit to
`sceneRegistry.jsx`. Preset keys stay flat and match the Leva schema 1:1.

Presets carry both the look and the shot: a hallway infinite-scroll hold, a
staircase infinite-scroll hold, and the full walk from the living room.

---

## Build order

1. **Endless corridor and endless helix, streaming, nothing else.** Walker,
   odometer, zone clamps, recycling, rebase. Grey untextured geometry, no fog,
   no flashlight. The seam either shows or it doesn't, and this is the cheapest
   place to find out. — **done**, `WebGPU/HouseOfLeaves`. Joints verified exact
   (height, angle and radius all zero mismatch) with the drift both off and
   fully on. Three things had to change to get there:
   - Flights and landings needed to **taper**. A shaft that opens as it
     descends cannot be built from constant-radius pieces — each flight met the
     landing below it at a different radius, leaving a 1 m ledge at every
     joint, the whole way down. `createStairSegment` and `createLanding` now
     take end radii; both ends snap the same quantity so the taper stays
     continuous across a joint despite the quantisation.
   - Height is measured **relative to the walker**, not from an absolute
     origin. The landing set slides forward as the walk goes on, and a plateau
     dropping off the back of it stopped being counted — every landing passed
     jolted the world upward by its own depth.
   - The wall's carry-forward offset has to be a **difference of rises taken
     against one landing set**. Differences are independent of which landings
     the set holds; absolutes are not, and storing one put the wall 8 m out.
2. **Input.** Keyboard, arrows, pointer, touch, autopilot — all through the one
   move/look pair. — keyboard, drag-look and autopilot done; on-screen arrows
   and a touch stick still to come, and they write to the same two values.
3. **Darkness.** Flashlight, volumetric with the cone term, black falloff. This
   is where the piece starts working or doesn't. — **built, untuned.** The lamp
   is carried rather than worn: offset from the eye, aim lagging the look, and
   a procedurally drawn lens cookie (scratches, dust, blotches) that the
   volumetric samples too, so the cone breaks into streaks in the air instead
   of reading as a clean torch beam. Nothing else lights the scene; the fill
   slot exists only for blockout and every preset leaves it at zero.
   - A SpotLight's `matrixWorld` carries **no aim** — three points the shadow
     camera at the target and leaves the light object unrotated — so the beam
     frame is composed explicitly and shared by both consumers. Deriving it
     from the light would have marched a cone pointing down world -Z while the
     walls were lit somewhere else.
   - The lens cookie is now `public/textures/circle_c_noise.png`. Its mask
     lives in the **alpha** channel and its RGB is a hard white disc — and
     three multiplies a spot light's map by RGB, ignoring alpha
     (`SpotLightNode`: `lightColor.mul(projected)`). Passed through untouched it
     would project that hard disc and throw away the softness it was drawn for,
     so alpha is baked down to luminance at load, normalised against its own
     peak (the source only reaches about two thirds).
   - Density and intensity are guesses and want eyeballing. `Shaft: Lamp Only`
     exists to make the scale trade visible: at 200ft across, the far side is
     beyond the beam entirely, which is exactly the case for the shaft column
     tier that is still to come.
4. **The procedural ash surface**, harvested from GrandStaircase. — **done.**
   Mottle grain plus a slow warped ink field, driving albedo and roughness
   together so a patch that reads darker also reads duller. No maps anywhere.
   - The noise is pinned by a **stable-position offset** uniform. World space
     is the wrong frame to sample in here: the walker rebases the world when it
     wanders from the origin, and the shaft's heights are measured against a
     reference that moves every frame, so world-keyed noise would swim across
     the stone as the architecture slid through it. The offset
     (`anchor.x, anchor.y - riseRef, anchor.z`) turns a world position back into
     the absolute one the geometry was generated at.
5. **Dressing.** Side hallways, rooms, dead ends, flares, the drift functions.
6. **The great room and the shaft floor**, with the spokes and the return. —
   **built.** Both spaces are walkable, and the zones now hand over to one
   another: hallway → great room → descent → shaft floor → the spoke you chose.
   The room is at the source's scale — 620m across, 155m high — which costs
   nothing, because the fog reaches nowhere near either wall.
   - **One coordinate system, not one per zone.** The corridor's far end *is*
     the room's doorway, and the room's hole *is* the head of the shaft. Zones
     with their own origins are each correct alone and teleport at every
     threshold; `utils/layout.js` is what stops that. The shaft's geometry is
     offset into it by a single parent group rather than by every placement.
   - Handoffs must carry the **bearing**, not just the cross-track offset.
     Dropping it cost 11m at the stair head and 136m at the shaft floor, where
     the walker was re-seeded at zero degrees on a sixty-metre circle.
   - The top landing sweeps *forward* from u=0; it does not straddle it.
     Treating it as centred let the walker step off the half of the arc with no
     stair under it.
   - The shaft's axis wanders as it descends, so the floor sits under where the
     stair actually ends, not under the room's hole.
   - The way back is the corridor zone again, laid down the spoke that was
     taken — which is why that zone is placeable at all, and why its placement
     is resolved on entry rather than baked.

   Measured across the whole walk, threshold by threshold: 0.025m, 0.005m,
   0.000m, 0.476m. The last is the spoke doorway being wider than the corridor
   it leads to, so entering off-centre is pushed to the corridor's width —
   which is what a narrower corridor should do.
7. **The living room**, both bookends, and the unobserved reveal. The return
   corridor currently ends where the living room will be: chaining it back to
   the hallway would be a cut of the whole length of the piece, so the walk
   stops there until there is somewhere to arrive.
8. **Presets and shot list.**

Steps 1 and 3 are the two that can sink it. Everything after step 5 is
composition of pieces that already exist.

---

## Follow-ups carried

- **Two copies of the shared vocabulary.** `GrandStaircase/utils/shaftProfile.js`
  and `LabyrinthKit/utils/corridor.js` both duplicate what now lives in
  `@modules/houseOfLeaves/profile/`. Promoting before the new scene existed
  would have meant designing the shared API blind; migrating both now is one
  refactor with two known consumers. Neither scene has been touched.
- **Flare visibility is unverified.** The registry, the flicker and the packing
  are confirmed live (entries register, intensities flicker, the texture packs),
  but whether a flare's spill and its scatter actually read in frame was never
  measured — see the note in the build log below.

## Open, but not blocking

- **"No bottom" vs arriving at a bottom.** The reference is emphatic: the bottom
  should not be visible — "not a black circle, not fog, not a pit with a bottom,
  just absence of information." The brief requires the descent to end at the
  shaft floor. These are reconcilable — the floor only exists once the endless
  stretch releases, and until then there genuinely is nothing below — but the
  transition has to be handled so the floor is never glimpsed from above during
  the endless section. Worth deciding deliberately rather than discovering.
- **Walking speed.** `travelSpeed: 8` was tuned for a rail flythrough; that is a
  sprint. A walk is 1.4–2.5 m/s, so every fixed run takes three to five times
  longer to cross and the segment-variety budget and fog margins all change
  with it. Retune when the walker exists, not before.
- The return corridor is currently planned as a single long run regardless of
  which spoke is chosen. If that reads as a cheat, the spokes can differ for
  their first stretch and converge in the fog. The source offers a better
  option: on the way back the markers are gone and the corridors have changed,
  so the return being _not the same place_ is canon.
- Audio. The growl is a real part of the book and Howler is already in the repo
  (see the Surrender storm work). Out of scope for the first build.
