# // Apparitions

# // Intent / Use Cases

- build a scene fully cenetered around particles & mediapipe fullbody/face detection, to be projected on a wall as viewers walk past, with a webcam pointed at the viewers.
- scene contains colorful particles moving through space on a black background.
- the bounding box for the space the particles occupy is illustrated with white lines/cube wireframe.
- The scene uses the webcam to find n people and push their positions/landmark positions into the particle system for interactivity.
- this is a musical/visual instrument to be played by a user, or by viewers when being viewed

# // Interaction Design — Implementation Plan

The poetic spine: particles cohere into a shimmering **apparition** of the viewer, then
dissolve when they leave. Every mechanic below serves the tension between **formation**
(particles trace you) and **dissolution** (they scatter back to fluid).

Five workstreams. WS0 is the standalone floor; WS1–4 are additive sugar on top, ordered by
leverage. They stack — build in order, each is usable alone.

**Guiding principle — interaction is additive, never required.** The piece must always look
fascinating with zero people, no webcam, or denied camera permission. Every interaction
workstream layers _on top_ of the as-is performance and degrades back to it cleanly. If
unplugging the camera ever makes the piece look broken or static, that's a bug in WS0.

## // Architecture — composable capability layers

The modalities are **not mutually exclusive modes**; they are independent layers that compose.
"As-is" is simply _all layers off_. Prefer shared code: build each capability once as a layer
with its own enable flag + gains, feeding a small set of shared sim inputs. Presets are just
named snapshots of which layers are on and at what gain.

**Shared sim contract (everything funnels through these two calls per frame):**

- `setAttractors(attractors, ...)` ← a combined list of attractor points (signed strengths).
- `updateConfig({ gravity, noise, speed, stiffness, restDensity, viscosity, ... })` ← base
  preset values plus summed modulation deltas.

**Layer kinds:**

1. **Attractor sources** — produce attractor points, concatenated into the `setAttractors`
   list (subject to the MAX_ATTRACTORS budget with a priority order):
   - `GhostSource` — autonomous phantom apparitions (WS0).
   - `ViewerSource` — MediaPipe → signed body field, parameterized by interaction **{type}**
     (e.g. `silhouette` = attract outline + repel core, `negative` = carve a void; future:
     `impulse-play`). (WS1)
2. **Config modulators** — push additive deltas onto the base preset uniforms each frame,
   combined by sum/clamp:
   - `AutonomousLFO` — slow self-driving breathing (WS0).
   - `MotionEnergy` — viewer movement → noise/speed/cohesion/gravity (WS2).
   - `AudioIn` — FFT bands → gravity/noise pulses (WS4 in).
3. **Orchestration** — `PresenceState` (WS3) is the conductor, not a separate modality: it
   ramps the _gains_ of the sources/modulators over time (enter/dissolve envelopes). It can be
   disabled entirely so as-is runs without any presence machinery.
4. **Consumers** — `AudioOut` (WS4 out) only _observes_ sim + tracking state to drive Tone.js;
   it never feeds the sim, so it composes freely with anything.

**Input bus (design for this from the start — it's what makes WS5 Remote Control possible):**
the raw inputs the layers consume — tracking results, audio analyser, and the control/preset
state — should flow through a thin provider interface, not be read directly from `navigator`
APIs inside layers. A `LocalProvider` is today's behavior (local webcam/mic/Leva); a
`RemoteProvider` (WS5) supplies the same shapes off the network. Layers stay agnostic to
source. Build WS1/WS2/WS4-in against the bus even before WS5 exists.

**Modality = a combination of enable flags** (each a control, snapshotted by presets):

| Preset (example)        | Ghost | LFO | Viewer{type} | Motion | AudioIn | AudioOut | Presence |
| ----------------------- | :---: | :-: | :----------: | :----: | :-----: | :------: | :------: |
| Showcase (as-is)        |  on   | on  |      –       |   –    |    –    |    –     |    –     |
| Viewer                  |  opt  | on  |  silhouette  |   on   |    –    |    –     |    on    |
| Viewer + Audio-reactive |  opt  | on  |  silhouette  |   on   |   on    |    –     |    on    |
| Viewer + Audio-gen      |  opt  | on  |  silhouette  |   on   |    –    |    on    |    on    |
| Audio-reactive only     |  on   | on  |      –       |   –    |   on    |    –     |    –     |
| Audio-gen only          |  on   | on  |      –       |   –    |    –    |    on    |    –     |

This is why ghost (WS0) and Dormant (WS3) share the `GhostSource` + gain-envelope code, but
their _enable flags are independent_: as-is shows ghosts with Presence off; Dormant just routes
the same source through the presence conductor.

## Current state (baseline to change)

- `MlsMpmSimulator` exposes uniforms: `gravity`, `noise`, `speed`, `stiffness`,
  `restDensity`, `dynamicViscosity`, plus `attractorPositions[24]`, `attractorStrengths[24]`,
  `attractorMode` (single global scalar), `attractorRadius`.
- `setAttractors(attractors, mode, radius)` flips ALL attractors to attract (+1) or repel (-1)
  via `attractorMode`. This is the main thing to break open.
- `buildAttractorsFromTracking(results, controls)` (trackingAttractors.js) maps MediaPipe
  world landmarks → attractor list. `KEY_POSE_LANDMARKS` (13), `KEY_HAND_LANDMARKS` (5/hand),
  `KEY_FACE_LANDMARKS` (6). Each attractor is `{ position, strength }`.
- Color in `g2p` already reacts: hue←density, sat/val←velocity, brightness←attractorForce.
  Anything that moves particles lights them up for free.
- Force law in `g2p`: `strength * attractorRadius / (dist² + 1)` along direction to attractor.

---

## Workstream 0 — As-is standalone performance (the floor) ★ protect this

**Concept:** the piece is already mesmerizing with nobody in front of it — colorful fluid
drifting through the wireframe bounds. Treat that as a first-class, demoable mode and make it
_self-sustaining_ so it never goes static or boring on its own. Everything else is sugar; this
is the cake. If you showed someone the piece today with no interaction, they'd be fascinated —
preserve and harden that.

**What already carries it (don't regress):**

- Sim runs autonomously: `gravityZ ≈ 0.2` drift + `noise` advection (`triNoise3Dvec` with
  `time` in `g2p`) keeps particles in constant organic motion.
- Color already evolves on its own: hue term includes `time.mul(0.03)`, so the palette slowly
  cycles without any input.
- `autoOrbit` / `autoOrbitSpeed` (OrbitControls in Apparitions.jsx) can keep the camera moving.
- Bloom + black background + bounds wireframe = the signature look.

**Make it bulletproof + alive:**

1. **Camera-optional by construction.** With `interactivityEnabled: false` the sim must run
   full-quality. Also handle the _enabled-but-unavailable_ path: no webcam / denied permission /
   MediaPipe load failure should silently fall back to as-is, never freeze or error. Verify
   `useMediaPipeBodyTracking` failure modes don't stall the `useFrame` loop.
2. **Autonomous "performance" envelope.** Add a slow self-driving LFO layer (sum of sines /
   slow noise on `time`) gently modulating `gravity` direction, `noise`, and `restDensity`
   over ~20–60s so the as-is piece breathes and shifts mood instead of looping visibly. Pure
   CPU-side, feeds existing `updateConfig` uniforms.
3. **Ghost apparitions (optional, on-theme).** Even with no viewer, drive `setAttractors` with
   a few procedurally drifting phantom points (Lissajous / noise paths through the bounds) at
   low strength, slowly fading in and out. Particles cohere into faint wandering forms — the
   "apparition" reads without anyone present. This is the bridge to WS3 Dormant, but stands
   alone as an attract-mode demo.
4. **Dedicated as-is preset.** A `Showcase` preset in presets.js tuned purely for look
   (palette, density, bloom, particle size, orbit) with `interactivityEnabled: false`. This is
   the one you open to demo the piece cold.

**New controls (new "Showcase" or "Ambient" folder):** `autonomousMotion` (on/off),
`autonomousRate`, `autonomousDepth`, `ghostApparitions` (on/off), `ghostStrength`, `ghostCount`.

**Feel target:** open the scene with no camera, walk away, come back in two minutes — it has
visibly evolved (palette, flow direction, faint forms drifting through) and never looked static
or repetitive. Plugging a camera in only _adds_; unplugging it returns cleanly to this.

---

## Workstream 1 — Signed body field (form the apparition) ★ highest leverage

**Concept:** the body does two opposite things at once — _attract along the outline/skeleton,
repel from the core_ — so particles gather to trace your silhouette while the center hollows
out. You read as a glowing outline (apparition), not a blob. Also unlocks a "negative space"
mode where you carve a person-shaped void in a dense field (the absence is the portrait).

**Core change — per-attractor polarity:**

- In `MlsMpmSimulator.g2p`, remove the global `this.uniforms.attractorMode` multiply on
  `attractorForce` (line ~501). Polarity now lives in the _sign_ of each attractor strength.
- In `setAttractors`, write signed strengths straight through; keep `attractorMode` only as an
  optional global multiplier for the gesture toggle, or retire it.
- In `buildAttractorsFromTracking`, assign polarity per landmark group:
  - Outline/skeleton landmarks (shoulders, elbows, wrists, hips, knees, ankles, nose) →
    **positive** strength (attract). These are the existing `KEY_POSE_LANDMARKS`.
  - A derived **core** attractor at center-of-mass (avg of shoulders+hips) →
    **negative** strength, larger radius → hollows the torso.
  - Optionally a second negative point at pelvis for taller hollowing.

**New controls (Interactivity folder, useSceneControls.js):**

- `outlineStrength` (attract, ~2–4), `coreRepelStrength` (repel, ~1–3), `coreRepelRadius`.
- `fieldMode`: `positive` (form you) | `negative` (carve void) | `auto` (phase between).
  Negative mode = flip outline to mild repel + raise ambient particle density so the field is
  dense and your body cuts a clean hole.

**Feel target:** stand in frame → within ~1s a colored outline of you condenses out of the
drift, torso reads as open space. Move an arm → the outline follows with fluid lag.

**Sequencing note:** 24-attractor budget is tight for multi-person + core points. Consider
raising `MAX_ATTRACTORS` (sim `maxAttractors` option) to 32–48 and confirm GPU headroom, or
prioritize landmarks per person dynamically by people count.

---

## Workstream 2 — Motion → sim, stillness as the reward

**Concept:** body velocity is the expressive input. Thrashing scatters the cloud; going still
lets the apparition crystallize. This is the "instrument you play" loop and it's almost all
existing uniforms.

**Velocity source:** in `buildAttractorsFromTracking` (or a new `trackingMotion.js`), keep a
ref of last-frame landmark positions; compute smoothed per-landmark velocity (Δpos / delta,
EMA ~0.2). Also compute an aggregate `bodyEnergy` = mean landmark speed across all people.

**Three mappings:**

1. **Impulse (per-hand):** add hand-landmark velocity as a direct velocity kick so a fast
   sweep flings a comet, a slow hand gathers. Cheapest path: add a small extra attractor
   _ahead_ of a fast-moving wrist (lead the motion), strength ∝ speed. Cleaner path: add an
   optional per-attractor `velocity` field consumed in `g2p` as an impulse near the attractor.
2. **Global agitation (in ParticleSystem useFrame → updateConfig):** map `bodyEnergy` →
   `noise` and `speed` UP, and → `restDensity`/`stiffness` DOWN, when moving; invert when
   still. Stillness ⇒ high cohesion ⇒ particles settle into your form. Use asymmetric smoothing
   (fast to agitate, slow to calm ~1–2s) so resolution feels earned.
3. **Levitation (gravity):** map mean arm height (wrist.y vs shoulder.y) or vertical motion →
   `gravityY`. Arms up = cloud rises, push down = it falls. Reuses existing gravity uniform.

**New controls:** `motionToNoise`, `motionToSpeed`, `motionToCohesion` (gain sliders),
`calmRate` vs `agitateRate`, `armsToGravity` gain, `impulseGain`.

**Feel target:** big movements feel turbulent and bright; freezing in a pose makes the cloud
quiet down and sharpen into your silhouette over ~2s.

---

## Workstream 3 — Presence dramaturgy (it's a walk-past wall)

**Concept:** a state machine driven by detection so the piece has a life cycle for passers-by,
not just a reaction. Apparition lingers and fades when you leave — on-theme.

**States** (machine in ParticleSystem or a `usePresenceState` hook, fed by `tracking` results
and a smoothed people-count):

- **Dormant** (no one, hysteresis ~2s): dim ambient drift, gravity toward a resting pool at
  bottom of bounds, low `particles` count to save GPU, low bloom.
- **Sensed** (someone enters): one-shot repel "ripple" pulse from their position + color warm
  shift; ramp particle count up.
- **Forming** (engaged > ~1s): enable Workstream 1 field + Workstream 2 mappings at full gain.
- **Dissolving** (they leave): ramp attractor strengths → 0 over 2–3s so the apparition
  lingers then disperses; then back to Dormant.

**Implementation notes:**

- Add detection **hysteresis** (separate enter/exit thresholds + dwell timers) so confidence
  flicker doesn't strobe the states.
- Drive transitions by lerping the control values you already pass into `updateConfig` /
  `setAttractors` — no new sim plumbing required, just an envelope layer in useFrame.
- Per-state target presets could live alongside `PRESETS` in presets.js.

**Multi-person:** up to 4 apparitions. Give each person a hue offset (blend person index into
the color hue term in `g2p`, or bias their attractors' contribution) so viewers "own" a color.
When two people get close, their fields naturally bridge — particles span between them.

**Feel target:** empty wall breathes slowly; a passer-by triggers a ripple that "notices"
them; if they stop, an apparition forms; when they walk on, it dissolves behind them.

---

## Workstream 4 — Audio, both directions

**In (audio → sim):** mic or playback FFT (Web Audio AnalyserNode).

- Bass band → pulse `gravity` magnitude and/or `restDensity` (cloud throbs on the beat).
- High band → `noise` sparkle.
- Onset/beat → trigger a brief radial impulse.
- Gate behind a control so it's optional for the silent walk-past use case.

**Out (sim → tone):** the original, instrument-y direction. Read aggregate sim state each frame
(cheap CPU-side proxies, or sample a few particles) and drive Tone.js.

**Musical model — tempo + composable key (so output is always musical, never atonal mush):**

- **Tempo:** a Tone.js `Transport` set by a `bpm` control. Generated notes quantize to a grid
  (`subdivision`: 1/4, 1/8, 1/16, triplets) so events land on the beat. Support both a
  continuous pad/drone layer _and_ a rhythmic layer gated to the transport.
- **Key = root + scale, where a scale is just an interval set** (semitone offsets from the
  root). This one representation composes across everything:
  - `major` → `[0,2,4,5,7,9,11]`, `minor` (natural) → `[0,2,3,5,7,8,10]`
  - `pentatonicMajor` → `[0,2,4,7,9]`, `pentatonicMinor` → `[0,3,5,7,10]`
  - `chromatic` → `[0,1,2,3,4,5,6,7,8,9,10,11]`
  - `custom` → any user-supplied offset array (also covers modes, blues, etc.)
    Store as `{ root: 'A', scale: number[], octaveRange: [lo, hi] }`. A `quantizeToScale(pitch)`
    helper snaps any continuous value to the nearest allowed pitch class — so sim signals map to
    in-key notes regardless of which scale is selected.
- **Sim → musical params (all snapped through the key/grid):**
  - Center-of-mass height → scale-degree index (low body = low degree) → quantized pitch.
  - Mean density → chord voicing / how many scale tones stack.
  - Total kinetic energy (≈ `bodyEnergy` / mean particle speed) → note density (how often the
    rhythmic layer fires) + velocity, and filter cutoff / master gain.
  - People count → number of active voices.

**Loop:** you move → particles react → sound changes → you respond. That closes the
"musical/visual instrument" intent. Tone.js is the lib; build a small `useApparitionAudio` hook.

**New controls:** `audioInEnabled`, band gains; `audioOutEnabled`, `bpm`, `subdivision`,
`root`, `scale` (preset list incl. chromatic/pentatonic + `custom`), `customScale` (offsets),
`octaveRange`, voice cap. All snapshot in presets and sync over WS5.

---

## Workstream 5 — Remote control (end goal) ★ build as a shared, cross-scene module

**Concept — guitar into an amp.** Run the scene on a powerful machine (the **amp/host**) at
max particle count, lights, bloom. Run it again on a low-power device — old phone, Raspberry Pi
(the **guitar/remote**) — which does _not_ render the heavy scene. Set device roles, join the
same room, and the remote becomes the control surface + the _fuel source_: when you enable an
interactive mode, it's the **phone's** camera/mic providing the reactivity data, streamed to the
host. The remote decides what's happening; the amp makes it big, loud, and beautiful.

**Why it's clean here:** this changes _nothing_ in the sim contract. It only swaps the input
bus's provider from `LocalProvider` to `RemoteProvider` (see Architecture). Control state and
fuel data arrive over the network instead of from local APIs; `setAttractors`/`updateConfig`
are unchanged. That's also why it generalizes to other scenes.

**Leverage existing PartyKit (`eye-candy-party/`):**

- The server (`src/server.ts`) already relays arbitrary message types: its `default` case
  broadcasts any unknown `{ type, data }` to other connections. So new types below need **no
  server changes** (one optional enhancement noted).
- `useMultiplayer.ts` (CharacterController) is the client template to copy: `PartySocket` with
  `__PARTY_HOST__ || ${hostname}:1999`, `wss` on https, room id, throttled JSON broadcast at a
  `SYNC_INTERVAL`, and a 3-sample interpolation buffer. Reuse all of this.

**Message schema (two cadences):**

- `control-state` — sent on change only (not per-frame): the controls/preset snapshot
  (toggles, gains, field {type}). This is the Leva object already centralized in
  `useSceneControls`/`usePresetsFolder`, so it serializes generically.
- `fuel-frame` — high-rate (~15–30Hz, separate from control cadence): compacted reactivity
  data. Quantize floats (int16), send only `KEY_POSE/HAND/FACE_LANDMARKS` (reuse the existing
  constants), cap people, and send ~8–16 audio bands rather than the full FFT. Define and
  budget this schema explicitly — landmarks for N people are the bandwidth risk.
- `role-claim` / presence — assign host vs remote. Roles set via URL query (`?role=remote&room=…`,
  mirror `usePresetQueryParam`), a Leva control, or a small picker; a QR from host → remote
  makes joining the room frictionless.

**Module shape (so other scenes reuse it):** `src/modules/remote/` (or `src/hooks/`):

- `useRemoteTransport({ roomId, role })` — the PartySocket wrapper + message plumbing.
- `RemoteProvider` / `LocalProvider` implementing the input-bus interface.
- `useControlSync(controls, setControls, { role })` — generic two-way sync of any Leva
  controls object; single-writer (remote authoritative) with optional host-local override.

**Design considerations to resolve:**

- **Authority/precedence:** remote is authoritative for controls + fuel; host is a render
  sink. Allow a host-local operator override and define precedence.
- **Latency:** control-state can be eventually-consistent; fuel must feel live — reuse the
  interpolation/EMA smoothing (WS2 already smooths landmark velocity) on the host side.
- **Late join / resync:** a host connecting after the remote needs current control-state.
  Either have the remote re-send on `player-joined`, or add a small server `existing-state`
  cache (the one optional server enhancement).
- **Graceful degradation (ties to WS0):** if the remote disconnects, the host falls back to
  last-known control-state or to as-is — the guitar unplugs, the amp keeps humming.

**Feel target:** open the scene on the big machine, scan a QR with an old phone, the phone
becomes a control panel; toggle silhouette mode and wave at the _phone's_ camera — the wall-
sized apparition forms from the phone's tracking, with zero render load on the phone.

## // Suggested milestones

- [x] 0. Harden as-is: camera-optional fallback + autonomous LFO envelope + Showcase preset. (WS0)
- [x] 1. Per-attractor signed polarity in sim + core-repel point → silhouette forms. (WS1)
- [x] 2. Stillness/agitation envelope on noise/speed/cohesion. (WS2 #2)
- [x] 3. Presence state machine with dissolve-on-exit + hysteresis. (WS3)
- [x] 4. Hand-velocity impulse + arms-to-gravity. (WS2 #1, #3)
- [x] 5. Per-person hue + field bridging. (WS3 multi-person)
- [x] 6. Audio in, then audio out. (WS4)
- [ ] 7. Input-bus abstraction (Local/Remote providers), then remote transport + control sync +
     fuel-frame streaming. Validate on phone → desktop. (WS5)

> **Implementation notes (leg 1 — milestones 0–6 complete; needs human visual/perf pass on dev server).**
>
> Architecture landed as composable capability layers feeding the shared sim contract:
>
> - Sim contract (`utils/MlsMpmSimulator.js`): per-attractor **signed strength**, **per-attractor
>   radius** and **per-attractor hue** uniform arrays; `attractorMode` retained only as an optional
>   GLOBAL polarity multiplier for the gesture toggle. g2p accumulates a proximity-weighted dominant
>   attractor hue and blends it into particle colour (`hueBlend` uniform) → per-person ownership +
>   natural bridging between people. `setAttractors(list, { mode, radius })` writes signed strengths.
> - Attractor sources (`layers/`): `ghostSource` (WS0 Lissajous phantoms, coloured, fade in/out),
>   `viewerSource` (WS1 signed body field: outline attract + COM core-repel, `fieldMode`
>   positive/negative/auto via `fieldBlend`, per-person hue), plus hand-impulse comets from
>   `motionEnergy`.
> - Config modulators: `autonomousLfo` (WS0 slow breathing), `motionEnergy` (WS2 agitate/calm with
>   asymmetric smoothing, arms→gravity, wrist comets; also exposes music inputs), audio-in bands.
> - Orchestration: `hooks/usePresenceState` (WS3 Dormant/Sensed/Forming/Dissolving, hysteresis +
>   dwell timers, ramps layer GAINS, sensed ripple, dissolve-on-exit). Disable → all layers full.
> - Consumer: `hooks/useApparitionAudio` (WS4) — mic AnalyserNode bands → config deltas; Tone.js
>   (lazy `import('tone')`, degrades to silence if absent) transport-quantized + scale-locked synth
>   out via `utils/musicTheory`. `tone` already in package.json.
> - Conductor: `components/ParticleSystem.jsx` composes every layer ref-based, pooled, no per-frame
>   allocation; `layers/attractorBus` does priority eviction to the 24-slot budget.
> - Debug (`components/AttractorDebug.jsx` + `hooks/controls/getDebugControls.js`): translucent
>   sphere per live attractor in particle space (green attract / red repel, or colour-by-source),
>   sized to each attractor's radius; toggles for impulses + bounds; live Readout monitors (people,
>   attractor count, presence state 0–3, body energy, agitate) fed by a `statsRef` the conductor
>   writes each frame.
> - Controls split into `hooks/controls/get*Controls.js`. Presets are named layer-on snapshots that
>   map 1:1 to the modality table: **Showcase** (as-is), **Viewer**, **Viewer + Audio-reactive**,
>   **Viewer + Audio-gen**, **Audio-reactive only**, **Audio-gen only**, **Negative Space**, plus the
>   aesthetic **Flow** / **Outside Space and Time**. Default = Showcase.
>
> **Decisions:** kept `MAX_ATTRACTORS = 24` (drop to 12 if GPU-bound) with priority eviction
> (coreRepel > outlineCore > handImpulse > outlineLimb > face > hand > ghost). Negative space =
> `fieldMode` enum + dedicated preset. Dormant = neutral drift + ghosts.
>
> **Verified:** eslint clean, prettier clean, full esbuild bundle of the scene graph resolves with no
> errors. NOT yet verified: live WebGPU run / 60fps perf / on-camera feel — needs the human dev-server
> pass (camera optional, multi-person hue, audio gesture-unlock, negative-space density).

# // Open questions

- RESOLVED: keep `MAX_ATTRACTORS = 24` (per-attractor radius added cheaply; revisit/drop to 12 if
  the live GPU pass shows the g2p attractor loop is the bottleneck). Per-attractor signed strength +
  radius + hue all land in the existing 24-slot loop.
- RESOLVED: negative-space mode = a `fieldMode` enum (positive | negative | auto) plus a dedicated
  **Negative Space** preset (dense field, outline → mild repel, core off). `auto` phases the
  `fieldBlend` between +1/−1 on its own clock.
- Projection calibration: still manual (xScale/yScale/zScale/offsets in the Interactivity →
  Calibration folder). Auto-fit pass not yet done — candidate for a future leg.
- RESOLVED: Dormant keeps **neutral drift + ghosts** (no resting pool) to preserve the black-void
  aesthetic; presence only dims particle count/bloom and mutes the viewer/motion layers.
- RESOLVED: WS0 ghosts and WS3 Dormant share one `GhostSource` + gain-envelope; independent
  enable flags let as-is run with Presence off. (See Architecture section.)
- RESOLVED: attractor budget eviction order is `coreRepel > outlineCore > handImpulse > outlineLimb
  > face > hand > ghost`(see`layers/attractorBus.js` PRIORITY). Sources concatenate, then the bus
  > sorts by priority and truncates to MAX_ATTRACTORS, so viewers/core always survive crowding.
- WS5 fuel-frame budget: target Hz, float quantization, max people/landmarks per frame to keep
  phone uplink + host latency acceptable.
- WS5: does control-sync live in the shared module generically (serialize any Leva object), or
  per-scene? Generic is the reuse win but needs a stable controls schema across scenes.

[Back to main TODO](../../../../../TODO.md)

- check out `~/dev/examples/sketches` for a good example of the effect im looking for when tracking a person. see `blocks4_hands`

# // Presets

# // Features

# // Interactivity

# // Bugs
