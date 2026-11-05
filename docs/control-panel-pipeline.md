# ControlPanel pipeline

ControlPanel follows HyperCubes' arrangement (`docs/hyper-cubes-pipeline.md`):
one kernel, two renderers, and a dev tool that is a UI over one of them.
Change the kernel first, land every consumer in the same commit, and run
`npm run control-panel:check`.

## The shape

```
@modules/controlPanel        layout (subdivide / block grid / circle packing), the control
                             catalogue, signals and procedural audio, pose, framing, plot SVG,
                             roll and option schema
@modules/controlPanelRender  instanced primitive layers, softbox studio, createPanelRig,
                             createPanelStage, camera/lighting/post declarations
        │                              │
  WebGPU/ControlPanel scene     scripts/lib/controlPanelRender.mjs
  (R3F, Leva generated,           ├─ control-panel-generate.mjs   stills + plot SVG
   optional mic input)            └─ control-panel-video.mjs      operate / montage / build /
                                                                  drift / turntable
                                        │
           src/dev/server/controlPanel → src/dev/tools/controlPanel (ControlPanelCLI)
```

| Piece                         | Rule                                                                                                                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/controlPanel`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@modules/plotKit`, `@modules/ropePhysics` and `@utils/paletteStops`. Controls and plugs are primitive **parts**; cables expose rope centrelines and radii, shared by the tube renderer and plot.                         |
| `@modules/controlPanelRender` | The only home of the look. `createPanelRig()` draws parts: `setStatics` (rebuilt with the panel) and `setMoving` (every frame). `createPanelStage` is what the CLIs and the Live tab capture through.                                                                                     |
| `renderOptions.mjs`           | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `layout`, `look`, `patch`. `PANEL_KEYS` rebuild the panel; `PATCH_KEYS` re-make only the cables (`session.repatch`), so saving a patch never clears a hand's settings; `MOTION_KEYS` only move it. |
| Rig keys                      | `lightKey*` / `postBloom*` are declared with `rig: true`; their defaults must equal `lighting.js` / `post.js`.                                                                                                                                                                            |

## The references

`WebGPU/ControlPanel/references/` holds both shaders. They are **inspiration,
not ports** (decided at kickoff): nothing is ray-marched, and no shader code
is copied.

- **0b5vr, cs2GWD** — the `grid` layout is its 2 × 2 → 2 × 1 → 1 × 1 grid
  generalised (`gridBlock`, `gridKeep` = its 0.4); the big knob, EQ fader
  bank, 808 button row, LED meter, kaoss-style plasma screen, speaker grille
  are its modules rebuilt as geometry. The maker's nameplate
  (`buildBadge`, a blank-module roll) carries the house argyle mark from
  `@utils/argylePattern`, cut to "1 & 4": the centre square filled black
  (`CENTER`, a hair oversize) under the four half-offset squares in black
  outline, turned 45° into diamonds, beside a greeked wordmark.
- **yasuo, cdSfDV** — the tile recursion becomes nested sub-panels
  (`nestChance`, laid out again at half scale), its 7-segment counter rates
  drive the counter displays, and the plot is its line-art twin.

## Layout and catalogue

- `layout.js`: `subdivide` (guillotine splits of the long side until a region
  is ≤ `maxModule` and `stopChance` stops it), `blockGrid`, and
  `packCircles` (greedy, biggest first) for the Dial From Hell and for
  dial clusters inside large modules.
- `controls/`: **units** fill a 1 × 1 module, tile a bank (`arrayChance`) or,
  when `round`, a packed circle scaled to it; **areas** fill a module whose
  shape they `fit`. Each control's `build(kit, size)` returns `statics`, the
  `signals` it wants and `pose(values, state)`; a pose that reads the clock
  or audio rather than only its values is `live`.
- A domain leans the catalogue weights by `domainBias`; Mixed uses each
  control's mean weight. The roll picks a colour mood per domain
  (`rollConfig.js`), and Mixed borrows any domain's mood.
- The panel's shape rolls on its own `shape` stream, so it never moves the
  rest of the layout. `orientation` (a CLI and workbench option in Layout › Panel, never a
  preset key or Leva control) picks
  it: `any` draws landscape 45%, portrait 35% and square 20%; `landscape` and
  `portrait` take a 12–22 long side at 0.35–0.8 of it across (at least 6);
  `square` stays within one cell of 10–16 on each side. The roll writes only
  `panelCols` / `panelRows`, and pinning either still wins.
- Weathering. Module plates set their own tight bevel (`PLATE_BEVEL`,
  carried per part as `b` in the emission attribute's fourth channel;
  `rboxRadius(s, b)`), and a non-zero bevel also marks a painted plate
  whose bevels chip to bare aluminium in occasional runs. Grime darkens
  the foot of every part and drifts in patches across plates. Screws
  vary by a hash of where they sit (slotted or Phillips, some proud, some
  dulled), and printed legends (`greek` → `worn`) lose gaps and ends the
  same way, so the SVG plots match. The fanfold prints dot-matrix
  character cells with head jitter and ribbon ink drifting per line.
- See-through primitives (`SEE_THROUGH`: `lens`, `glow`) have their own
  blending and cast no shadow; the plotter and margin checks skip them.
  Gauges carry a `lens` (Fresnel opacity: clear head-on, reflective at
  grazing, smudged like other glass); lit LEDs (`kit.led`, the LED matrix)
  lay an additive `glow` (`kit.spill`) on the surface round them. Cables
  are rubber: a sheen along their length, faint mottle, a slight tint
  difference per cable.
- Build-in order: modules rise staggered and are all up by
  `MODULES_DONE` (0.7) of `buildSeconds`; then `cableReveal(id, count, t,
seconds)` draws each cable in turn (`CABLE_STAGGER`) out of its first
  socket along its own path. `session.reveals()` hands the renderer one
  value per cable, and a cable's plugs only appear once it reaches them.
- Cables are drawn as Catmull-Rom curves through the rope particles
  (`SUBDIVIDE` rings per segment), so they bend smoothly; past a cable's
  reveal point its tube collapses to nothing.
- Surface detail is in each part's own coordinates (`vPartSurface`, the
  scaled, unrotated vertex), offset per part by a hash of its colour and
  size, so it turns and slides with moving parts. Paint and plastic mottle
  and orange-peel; metal is brushed along the part, or spun concentric on
  lathe primitives (`ROUND` in rig.js); hairline scratches are the
  zero-crossings of a stretched noise, kept to patches; low-roughness
  dielectrics (glass) carry swirled fingerprint smears in roughness. Parts
  with a wear amount (`w` on a look, carried in the colour attribute's
  fourth channel: `style.cap`, `style.grip`, piano keys) get a glossier,
  paler spot centred on their tops.
- Module plates are rounded boxes, so the renderer's fixed `RBOX_RADIUS`
  rounds their corners and bevels their front edges, which catch the
  light; `checkMargins` measures clearance against that rounded outline.
  Screens are tubes: the glass carries nested domes (`TUBE`, inset
  inside the glass) bulging by `BULGE` of the face and glowing faintly
  more toward the centre, and every trace is lifted onto the bulge
  (`onTube`). LED-matrix pixels are domed lenses; `style.led` keeps unlit
  LEDs dark-tinted and lit ones below white (`LED_GLOW`).
- Top-level module plates carry a screw in each corner (`plateScrews`,
  `SCREW_INSET` inside the plate margin and clear of its rounded corner, from their own `:screws` random
  stream so no control's roll moves). The part material adds surface
  detail from world-space MaterialX noise: painted and plastic surfaces
  mottle and orange-peel, metal (by metalness) carries horizontal brushing,
  each a few percent of albedo and roughness. The brushing frequency is
  kept low (45 per unit across the grain) because the fragment noise has
  no mip: finer brushing aliases into static at panel distance. Plots read
  albedo from the parts, so SVGs are unchanged.
- Every module's contents are drawn at `padOf(leaf)`, leaving
  `MODULE_PAD` cells of bare plate inside its seams. A rounded box rounds
  by a fixed `RBOX_RADIUS` (capped at `RBOX_SHARE` of a small part's
  shorter side), re-rounded per instance in the vertex shader, so a large
  base stays a rectangle rather than an oval. The shader pins the
  re-rounded position (`toVar`) before it reassigns `normalLocal`: TSL
  reads nodes lazily, so otherwise the position picks up the bent normal
  and thin rounded parts (a patch bay's bed, bezels) draw about a third
  oversize. `control-panel:check`
  (`checkMargins`) fails when a part crosses within 0.04 of its plate's
  seam, or a part sitting on one of its control's rounded bases (a
  printer's knobs, a bay's legends) crosses within 0.02 of that base's
  outline.
- Packing keeps circles `PACK_INSET` inside their plate, a unit's `round`
  is the radius it really reaches (bezels, LEDs included), and legends are
  clipped to their circle; `control-panel:check` fails on a packed part
  that crosses a seam.
- Plates are solid and anything below the face is inside the chassis, so
  recesses are built up, not cut: the speaker cone is a `dish` (an open
  lathe cone, drawn double-sided) inside a walled housing.
- `inventory` is a fourth layout, never rolled: `controls/inventory.js`
  lists one of every control and every variant its builder can roll
  (builders take a forced `variant`), first-fit packed at the width that
  wastes fewest cells. The Inventory preset uses it, and
  `control-panel:check` fails if a catalogue entry is missing from it.
- Legends are greeked on purpose: word bars, never text, so no panel says
  whose it is. Silkscreen that would spill past its module is dropped.

## Motion

- `signalValue(signal, t, audio, motion)` is pure: an idle control is
  touched once a `gesturePeriod`, eased over the first quarter, then left;
  a busy one glides or sweeps. Signals store dice only, so the motion knobs
  re-read them without a rebuild.
- `proceduralAudio(t, bpm)` stands in for music (kick, snare, hats,
  bassline over `BANDS` bands); meters, VU gauges, spectra and keys read it,
  and the sequencer row steps on its 16ths. The scene can swap in the
  microphone (`audioSource: mic`, `hooks/useMicBands.js`); CLIs never do.
- `posePanel` memoises each non-live control's parts while its values hold.
- Build-in: each module rises out of the chassis over 35% of `buildSeconds`,
  staggered along a rolled sweep. Stills are taken at `STILL_TIME`.

## Sequences

`sequence` (Motion › Sequence, live-only: the CLIs still render one fixed
panel) changes the panel itself over time, on top of its controls' motion.
Both shows (`shows.js` → `swap.js`, `scroll.js`) are pure in `t` and the
config: `control-panel:check` plays each and compares it with a fresh show
started at the same moment (in world space, to a thousandth of a cell).

- **Content** (`content.js`). A show builds one leaf at a time with
  `buildContent(config, cell, seed)`: the leaf dressed by the ordinary
  `buildModules` path about its own centre, from its own seed (and an
  `exclude` list of catalogue ids). `mountContent` places it anywhere,
  moving its statics and control transforms and dropping pose memos, so
  the same content can slide to a new seat. A show's controls live in a
  register whose keys are never reused (retired slots are emptied), so a
  hand's overrides never land on a newcomer. The session, patcher and
  pointer see the show's **shell** (`show.js`): `controls`, and the
  `modules`, `hits` and static parts of what is settled now.
- `poseModule(module, frame, out, { move, statics })` poses one module under
  a rigid `move` (`moveAll`: turn about a pivot, then offset); `posePanel`
  is it over every module, build-in sink included.
- **Fill View** (`fitView`) sizes the panel (None or Swap) to cover the
  camera's view on the panel plane: the scene unprojects the frame's
  corners each frame and `fitPanel` takes the cells that cover them, so the
  panel overhangs the frame by under a cell. A new fit waits until the view
  has held still for 0.4 s (orbiting doesn't rebuild at every step).
- **Swap.** Events every `swapEvery` (never closer than a wave takes), each
  one kind drawn from the enabled `swapFlip` / `swapRise` / `swapSlide`
  (never the same twice running). Flip and rise take `swapShare` of the
  leaves, delayed across `swapStagger` by a ripple from a point, a sweep at
  an angle or a scatter; each swaps over `swapSeconds`.
  - Flip: the plate lifts straight out of its seat (`SEAT` of the time),
    turns about its centre line (the event's axis, anticipating and
    overshooting) riding high enough that its lowest corner stays
    `FLIP_CLEARANCE` above the chassis top at every angle (plates sit
    sunk into the chassis at rest, so any turn in place would cut through
    it), and sets back down. Past 90° the new content turns up from the
    other side.
  - Rise: the old module twitches up, then sinks below the chassis top; the
    new one pops up past its seat and settles with a damped wobble.
  - Slide: bands between clean cuts across the panel (no leaf straddles
    them) run along like conveyors, each its own way: the leaves past a
    clean cut about `TRAVEL` of the way along leave off one edge, the rest
    shift, and a fresh subdivision of the gap arrives at the other edge.
    Bands under a printer's paper or a cable plugged in elsewhere don't
    slide.
  - Each event is planned from the panel before it and replayed in order,
    so `t` alone fixes the panel (the cables aside, below).
  - The full Inventory. Every leaf, the opening panel's included, is dealt
    the next Inventory entry that fits it (`fitsLeaf`) from a `DECK`
    shuffled afresh each round, and built with that entry's control and
    variant at the leaf's size (a unit entry tiles a bigger leaf as a bank).
    A leaf of four cells or more looks for an area control before a bank;
    when nothing left in the round fits, it borrows from the next round
    without dealing it. The socket entries are in the deck `SOCKET_COPIES`
    times so the panel has leads to show, and a socket module hands over
    to another socket module `KEEP_SOCKETS` of the time. Blanks and
    nameplates go on modules of three cells or fewer; a radar screen only
    on a square one, a cone speaker only on one at least 2 × 2. Every entry
    is on screen within the first minute of Shuffle.
  - Printers swap like anything else but never flip: they come and go by
    rising or sliding.
  - Cables. Nothing is pinned for its sockets. A cable lying over a module
    it is not plugged into blocks that module (it rests on the module's
    tops, so anything moving beneath it would cut through). Each moving
    item's plugs pop out of their jacks `POP_LEAD` before it moves,
    flicked by `POP_KICK`, and hang from their other ends. Once the event
    is over a scripted hand (`patch.begin` / `move` / `release`,
    `REPLUG_SECONDS` per lead, lifted `REPLUG_ARC` on the way) plugs each
    loose end into a free socket: within the lead's reach of its other end
    and not right beside it, else one of the nearest few (the hand
    lengthens a lead it pulls too far, or picks a fallen one off the
    floor). A loose end with nowhere to go tries again after `RETRY`; the
    hand gives way to a person's. A module that held sockets is replaced by
    another socket module `KEEP_SOCKETS` of the time, so dropped leads
    have somewhere to go. After every phase change the patch gets the
    settled sockets (the leaving modules' kept until their plugs pop;
    `setSockets` returns any plug it drops, which is queued too) and the
    settled panel's colliders (`setColliders`, rebuilt by the rope world's
    `setBoxes`). This part reads the live patch, so it is not pure in `t`;
    the panel's own motion still is.
  - Arrivals for the next event are built ahead, one per frame, while the
    panel rests; the static layers rebuild twice per event (start, end).
- **Paper on a moving panel.** Swap and Scroll bind printers with `drop`
  (`bindLoose`, after every mount): there is no floor, so paper is torn off
  and dropped out of frame (`controls/paperDrop.js`). The receipt printer's
  cut receipts never land; they fall until they are culled. The fanfold
  hangs straight down from its droop and tears at the slit as every
  `TEAR_PAGES`-th perforation clears it (`TEAR_CLEAR`), like the receipt
  printer, the time of each tear solved exactly from the eased feed so the
  fall picks up where the sheet hung. (Tearing at the perforation once it
  passed the bend ripped the sheet halfway down and left a stub hanging.)
  The torn sheet's droop eases straight, about its foot, over `STRAIGHTEN`
  cells of fall, so its top doesn't fall as a hook. Paper below its
  own module's foot must clear the tallest controls on the modules beneath
  (about 1.3 cells proud), and always as one page: a hanging strip follows
  one path (`createDropPath`, by arc length, every row at the path's
  tangent) that bends out from the panel over `RUN` cells below the foot
  and hangs on straight, and a torn sheet falls rigidly, drifting `OUT`
  cells away as it drops (a dropped receipt neither spins nor twists).
  Past `CULL` cells down it is gone. (Leaning each row about its own centre
  instead broke a page into parallel ribbons.) Printers
  never flip in Swap (the leaning paper would swing through the
  neighbours).
- **Scroll.** A fixed view over an endless field moving along
  `scrollHeading` at `scrollSpeed` cells a second. `scrollTurns` none runs
  one way; square turns the same way every `scrollLeg` (the route repeats
  every four legs once past the first); wander meanders, each leg swinging
  `SWING` degrees to alternate sides of a course that drifts up to `DRIFT`
  a leg, legs `LEG_RANGE` of `scrollLeg` long. Coin-flip right angles
  (the first wander) turned back on themselves one leg in four and read as
  circling. Turns ease over `scrollTurnSeconds`. The route is closed form
  (`route.js`, `createRoute`); its ease integral must clamp at the ease
  length, or the old velocity carries on after the turn.
  - Untiled, the field is `CHUNK` (12 × 8) chunks with chunk rows offset
    like brickwork; each chunk packs a shuffled draw of the whole Inventory
    to `FILL`, biggest first, each where it touches
    the most walls (ties by the dice), and the cells left get single units.
    It never repeats, and the check finds every entry in a 120 × 80 stretch.
    Tiled, one chunk is the whole field Inventory (first fit, gaps filled)
    repeating both ways, so a straight run's position loops after one tile
    (the controls' own motion does not loop).
  - The mounted box is the view grown by `MARGIN` and snapped out to `GRID`
    cells; the static layers rebuild only when it changes. Content is built
    `PREFETCH` cells ahead, one leaf per frame, and retired beyond. Mounted
    positions are relative to an origin re-based only after `REBASE` cells;
    the renderer moves `rig.group` by `show.offset` and the pointer takes it
    off. Only leaves in the view are posed.
  - Cables. Each chunk patches its own sockets (seeded by the chunk, so a
    tile's copies patch alike), with `DROP` cells of slack below it before
    any floor. Its ropes are made with `createPatches(…, { settle: false })`
    and settled for up to `BAKE_BUDGET` ms a frame while the chunk waits
    ahead of the view, then kept in field coordinates with the chunk's colliders. At
    every remount one patch is composed over the mounted chunks through a
    saved `patchState` (no settling): cables already on show are carried
    over as they are now from the session's patch (a hand's edits
    included), new ones come from their chunk's bake. A lead spawned by
    hand has no chunk and is dropped at the next remount.
  - Palettes (`scrollPalettes`, Grand Tour). The field is cut into
    districts about `scrollDistrict` cells across (`palettes.js`): one
    jittered site per grid cell, site (i, j) wearing palette `i + 3j` of a
    seeded order, so with ten palettes no two districts within two steps
    match. Each leaf builds with the style of the site nearest a point
    jittered `SEAM_JITTER` of a district off its centre, so borders are a
    ragged band of mixed modules; a chunk's cables take its centre's
    palette. `PALETTES` copies the scene presets' colour schemes by name
    (the check keeps them equal); the chassis, zone colour and background
    stay the preset's own. Tiled, every copy shares the tile's cables.

## Interaction

Every control in the scene answers the pointer; speakers, nameplates and blank
plates are not controls and stay inert.

- A builder returns `hits` (`hits.js`): regions in its own coordinates, each
  bound to signals — `dial` (drag up or right turns it), `detent` (click
  steps and wraps, drag turns), `press` (click toggles), `latch` (a key: a
  click sets it down, another lets it up), `slide` (grabs along a slot),
  `stick` (2D drag) and `pad` (a touch surface). A `detent` or `choose`
  may carry a `roll` ({ time, from, at }): its press also stamps the
  session clock into `time` and where the control was drawn into `from`. Every gesture's value
  persists after release; nothing hands itself back to automation. Sockets are explicit metadata,
  separate from signal hits. A hit may `requires` another signal of
  its control above a level — a guarded switch is only reachable with its
  lid (its own signal) up — and `pickHit` takes `read` to test it. `buildPanel` places them in panel space as `panel.hits`.
- `interaction.js` is the three-free gesture maths: `pickHit` (smallest
  region under the point, so black keys beat white), `pressHit` / `dragHit`
  / `releaseHit` return signal key (`"control:signal"`) → value.
  `control-panel:check` fails on any hit whose release drops what the hand
  set.
- A hand's value is an **override** that `posePanel({ overrides })` reads
  ahead of `signalValue`; the scene's driver holds them until the panel
  rebuilds or Motion → release controls. CLIs never pass overrides, so
  renders stay pure in the config.
- Screens (`controls/screen.js`) are touch pads (`pad`: x, y, touched):
  the scope's timebase and gain, spectrum bars pushed up, a kaoss-style
  plasma, an aimed radar beam, a terminal the pad scrubs, a bent lissajous, and
  (`screenModes.js`) a waterfall with a frequency cursor, an ECG whose rate
  the pad sets, a vector wireframe dragged round, a starfield and a tunnel
  steered by the touch, an artificial horizon flown by the pad, and pong
  (`createPong`: stepped at 60 Hz from the first serve, paddles really
  return the ball, the AI misjudges by a per-rally hash, the score shows in
  bitmap digits and resets at 10; the pad holds the left paddle). The
  radar's contacts drift on straight tracks across the scope, painted
  where the sweep last passed them; a touch drops a new marked contact
  there (radar draws no cursor).
  The glass sits up its bezel (`LIFT`) over a strip holding the mode
  button; traces keep `INSET` inside the glass, and lines are clipped to
  it.
- Terminals (`controls/terminal.js`) keep the screen's one rng draw (LOG
  below 0.5, CODE above) and take everything else from a hash of it, so
  other screen rolls don't shift; each screen starts at its own point in
  its cycle and runs at its own pace (all terminals scrolled in lockstep
  before). CODE types a C-like or Z80 listing a character at a time with a
  block cursor, pausing longer after braces. LOG runs a cycle: boot, quiet
  bursts of `OK` readings, rising `WRN`, `ERR` retries, a fault line in
  inverse video blinking in the panel's reddest LED colour, a core dump,
  then a `BOOT [===>  ]` bar, each line stamped with uptime. Readings are
  taken from the audio at the moment the line was written (`audioAt` in
  the pose state, pure in t). The 3×5 font (`glyphs.js`) carries the
  punctuation code needs: `( ) { } ; , * < ! # & | % " ' @ $`.
- Solo jacks (one 1/4-inch or 1/8-inch socket per unit cell) and the
  Eurorack-style multi-socket bay declare `sockets`. `buildPanel` collects
  their IDs, connector families, panel positions, scales and module owners.
  The bay uses 1/8-inch connectors. Solo↔solo, solo↔bay and bay↔bay all use
  one panel-wide connection graph. Any size can connect to any other size;
  each attached plug fits its destination socket. Occupancy stays exclusive.
- `patchGeneration.js` overlays cables on the existing socket layout: a
  seeded shuffle, cable chance per still-available socket, then a connection
  chance to another available socket, regardless of connector size. Targets need not win another
  cable roll. Unconnected ends hang; no sockets means no cables. The `patch`
  facet holds seed/chances/slack independently of layout and look.
- `createPanelSession` owns control overrides and `createPatches` owns cable
  topology and `@modules/ropePhysics` state. Physical patching does not route
  signals/audio. The shared core is documented in `docs/rope-physics.md`.
- `controlPanelRender/pointer.js` handles both the scene and Live canvas.
  Drag an empty socket to add a lead, a plugged end beyond the movement
  threshold to unplug, or a cable body to pull it without unplugging its ends.
  Empty sockets within a screen-space snap radius highlight; releasing there
  connects immediately, without waiting for the physical rope or checking its
  original length. Picking covers the full exposed plug, not only the rope.
- A plug (`plugs.js`) shows its top 0.32 above the nut: a tapered, ribbed
  strain-relief boot in the cable's colour, a knurled metal barrel (¼") or
  moulded body in a deeper shade (⅛"), and a collar; the shaft and tip sit
  inside the socket.
  The hand pin follows pointer events immediately, preserving the picked offset
  and plug orientation. Automatic lift clears conservative control envelopes
  while projecting the hand point back along the cursor ray. Pulling beyond
  the cable's reach adds and retains length, including in saved arrangements.
  Plugs have knurled barrels, metal shafts, insulating rings and pointed noses. Pointer capture,
  cancellation, rebuild and disposal restore the previous orbit state.
- Fully loose cables remain pickable on a collision-only floor below the
  panel. There is no floor mesh or horizon in renders or SVGs. Frame includes
  cable bounds (Live F reframes after editing). Build-in visually carries the
  settled rope anchors with their modules rather than simulating sunk plates.
- `patchState` is a versioned serialized topology/rope snapshot. Live Capture
  writes it into the sidecar; Keep pins it for later CLI renders. The scene's
  Save patch arrangement button includes it in the next saved preset; Reset
  regenerates cables. Different socket layouts reset incompatible snapshots.
  Output/lighting-only Live reloads preserve the current rope state.
- State that is not motion (808 steps, patch plugs, a screen's mode, a
  keypad or piano key under the hand) is a `fixed` signal: it never moves on
  its own, only by hand.
- `PanelTouch.jsx` attaches the shared depth-aware cable/plug picker and
  cap-plane control gestures; physics never writes React state.
- The catalogue includes individually switched four/six-position DIP banks,
  ten-detent numbered thumbwheel drums, inertial trackballs, paired/triple
  pivoting throttles (and an `airliner` variant: one crossbar on two legs
  swinging out of slots in a rounded quadrant housing), single/dual strip-chart recorders and LED matrices.
  Inventory includes their variants; domain weights use the ordinary layout
  rules. Trackball drags rotate both axes without a value clamp; release
  coasts with delta-based damping and grabbing stops the coast.
- Recorder dials set paper speed and trace gain. The paper grid, roller and
  moving pens share the deterministic scene clock, and the grid and every
  trace scroll at one paper speed (`WINDOW` clock units across the paper).
  Dual pens sit `PEN_STAGGER` apart along the paper, as on a real
  recorder; clicking a pen's strip steps its ink through `INKS`. Matrix bezel clicks cycle
  `MATRIX_MODES`: ticker, pattern, sequencer, Life (a precomputed run on
  the matrix torus, reseeded when it dies or freezes), rain, audio bars,
  fire, ripple, a bouncing ball and an MM:SS clock; each pixel toggles an
  edit over that mode's generated state, except in `SIMULATED` modes where
  edits feed the sim: in Life a click flips that cell on a live board that
  steps on from the precomputed frame, and in bounce lit pixels are walls
  the ball rebounds off (flashing on a hit; one lit under the ball knocks
  it back). Both are closure state stepped at a fixed rate and replayed
  when time rewinds, so renders stay pure in `t` without edits. Terminal screen mode draws
  readable green bitmap text from seeded code/diagnostic transcripts;
  touching the glass browses the transcript.
- A screen pad's `grab` radius is its cursor: pressing within it while
  touched hands all three pad signals back to automation (`null`), which
  is how a screen returns to automatic.
- `mimic` (`controls/mimic.js`, landscape areas ≥ 3 × 2) is a railway
  mimic panel: a pale plate in a rubber housing with track grown by
  HexTrees' fork rule (a die must beat `FORK_PER_GEN * generation +
FORK_PER_ITER * iteration`) on 60° headings only. One or two through
  lines run edge to edge; each branch leaves its parent at 60° (one lane,
  sometimes two), runs level in a free lane interval, and ends at an
  arrow on the plate's edge, a buffer stop, or angled back onto its
  parent. Neighbouring parallel runs get crossovers, sometimes scissors.
  Green lamps sit along the runs; a train per run lights them in turn, a
  few are steady, and clicking one flips it. Track, arrows (flattened
  bullets) and greeked labels are ink on the plate, so it plots too.
- `telltales` (`controls/telltales.js`, landscape areas up to 2 tall) is
  a car-style warning cluster: a grid of generative glyphs (a frame —
  circle, parens, triangle, box, drop or none — a core symbol and
  sometimes a modifier, all thin ink strokes) ghosted behind smoked glass
  until lit in red, amber, green or blue. Each lamp has a habit: a few burn
  steady, the rest come on for a hashed spell each period, and red ones
  blink while lit. Clicks flip a lamp. Nothing spells a real warning.
- `hal` (`controls/hal.js`, portrait areas) is the shipboard computer eye:
  gloss faceplate, a two-tone nameplate of greeked legends (no text), a
  chrome-ringed dome of nested emissive spheres (dark glass, red rings, hot
  core) over a grille. Dragging the lens sets its glow; pressing the
  nameplate makes it glow with the audio bands, as if speaking.
  These displays use the same instanced primitive parts in raster and SVG.
- `splitFlap` (`controls/flaps.js`, areas ≥ 2 wide and ≤ 2 tall; one or two
  rows of units) is a bank of real split-flap drums in a walled housing. Each
  unit is a spindle with hinged flaps; only the five flaps near the drum
  position `p` are drawn (the falling one at `floor(p)`, two standing behind
  it, two landed in front), each a thin slab rotated about the spindle by
  `flapAngle(p - j)`: standing flaps lean further back with depth, the
  falling one accelerates from rest and rebounds once on landing, and the
  newest landed flap sits in front. A flap's front carries the top half of
  character `j` and its back the bottom half of `j + 1` (the 3 × 5 `glyphs`
  font split through the middle row; the back flipped in y so it reads
  upright once hung), so the drum really does flip through every character
  between two targets. `board` units pick new targets by hash each period
  and cascade left to right by `stagger`; `counter` units are an odometer
  whose carry flips the next drum. Both are pure in `t`. Digits, A–Z and
  alphanumeric drums are rolled. Each unit is a `detent` hit over
  `alphabet + 1` positions: 0 is automatic, `k` holds character `k - 1`. A
  click carries a `roll` ({ time, from, at }): `releaseHit` also stamps the
  moment of the click into the unit's second signal and where the drum was
  drawn then (`at`, which resolves the unit's own three signals at `now`)
  into its third, and the pose rolls forward from there to the new
  position (or to the moving automatic one, when the click wraps back to 0) at the flip rate. A click mid-roll starts from the drum's drawn
  position, so it never jumps. Turning a unit with a drag still snaps.
- `printer` (`controls/printer.js`, portrait areas ≥ 2 tall) is a receipt
  printer: a housing with a slit near its top and a narrow paper strip that
  leaves it heading straight out, droops under its own weight and hangs in
  front of the panel (clear of the tallest parts). It is **loose**: its paper
  leaves the module on purpose, so `control-panel:check` skips its posed
  parts for the seam and base-edge margins, `patchColliders` leaves them
  out (cables pass through paper), and `buildPanel` collects the box its
  paper can reach into `panel.looseBounds`, which `patchBounds` unions in so
  the camera frames the pile.
  - A control may declare `bind({ bounds, controls, transform })`, called
    once the panel is laid out (the printer learns the cable floor,
    `bounds.min[1] - 1.8`, its module's scale and the other controls), and
    returns its local reach box. `posePanel` gives every pose
    `state.sample(control, signal, t)`: any control's signal at any time,
    pure in `t` (a hand's overrides hold only now).
  - Its content is a **journal** of the panel's own state. Each row samples
    one control's signal at the row's own print time and prints a pictogram
    of that control (ring, arc, square, bar, slot, hole, dot), a value bar
    and two digits, between a greeked header and a barcode. Every receipt is
    `ROWS` rows (`BODY` printed + `TRAIL` blank) at `ROW_DT` per row, then
    the cutter fires: all of it is a function of `t`, so stills and video
    agree and the CLIs print the same journal. Ink is cached by pictogram
    and value.
  - The cut piece falls rigidly under gravity (`GRAVITY` in world units, so
    a nested module still falls at the right speed), then blends into a
    curled slip on the pile at a hashed spot in front of the panel. The
    last `KEEP` pieces stay, newest on top; the oldest is dropped, which
    removes a thin sheet under the others. Only the newest piece keeps its
    ink; older ones are three-row slabs. The job starts `PRE` before `t = 0`
    so a still already shows a full pile. The pile rests on the same
    invisible floor as the cables, with no shadow catcher.
  - **Interaction** (`stamp` and `pull` hits in `hits.js` /
    `interaction.js`). Dragging the strip down pulls blank paper out of the
    slit (the printed rows move down and a blank gap opens behind them);
    pulling it all the way out and letting go tears it off. The CUT button
    tears it now; FEED steps the pull a row at a time and wraps. Pulled
    paper stays pulled, like every hand-set control.
  - **Stamps.** A pose cannot know when a hand did something, so a `stamp`
    hit writes the session clock (`pressHit` / `releaseHit` take `now`,
    `session.time`) into a slot: 12 `[time, carry]` signal pairs, `carry`
    being the pull the piece left with, and the pull resets to 0.
    `schedule()` replays the stamps in order: a tear ends the receipt it
    landed in at that moment (a partial piece of `rows` fed so far) and
    starts the next one there, shifting every later receipt by `d`, so any
    number of tears give one schedule that is still pure in `t` and the
    stamps. A stamp's pose differs from the auto-cutter's only in `rows`,
    `carry` and the cut time, so the piece takes over the strip's rows with
    no jump. The 13th tear overwrites the oldest slot, which re-times
    receipts older than the pile; Release Controls clears the slots. CLIs
    never pass overrides.
  - Approximations: a piece the auto-cutter drops while paper is pulled out
    carries the current pull (it is not remembered per cut), and a pulled
    gap is not part of a piece once it has landed.
- The printer's `fanfold` variant (`controls/fanfold.js`, rolled 40% of
  printers, or forced by `variant`) is the dot-matrix take agreed when the
  printer was planned: continuous green-bar paper with tractor holes that
  never cuts. A head sweeps the slit line by line (bidirectional); the
  strip droops out of the slit for `BEND`, hangs straight to its foot on
  the cable floor (`bind`, as the receipt printer), and lays down page by
  page, each `PAGE` flat on the pile and folding back the other way, so
  pages alternate face up and face down. The pile holds `KEEP` pages, the
  oldest culled from the bottom; only the top and landing pages are drawn
  as inked bands, older pages are single boxes. Everything is a function
  of the lines fed (`RATE`), started `PRE_PAGES` (a full pile) in, so stills show one
  and the pose is pure in `t`. The platen knob (`detent`) picks listing
  (greeked lines), plot (a dot per line sampling one of the panel's
  controls at its print time) or banner (block glyphs from the font); the
  button swaps green-bar for plain paper. Both re-read the whole printout,
  past paper included.
- `reels` (`controls/reels.js`, landscape areas ≥ 3 × 2) is a reel-to-reel
  deck: two reels with satin three-spoke flanges over tape packs, the tape
  threaded down round two guides, over the head block (erase, record,
  play) and past the capstan and pinch roller. The packs follow the tape:
  with fraction `p` taken up, supply r = √(full² − k·l) and take-up
  r = √(hub² + k·l), and each reel has turned ∫ dl / r = (2/k)·Δr, so
  they speed up and slow down as real reels do, in closed form. Tape lines
  are the outer common tangents between pack and guide. Left alone the
  deck plays and rewinds itself (AUTO lamp lit, PLAY down); the transport
  keys (`choose` with a `roll`, the split-flaps' stamp: each press writes
  when it happened and where the tape was) take over: REW, STOP, PLAY, FF,
  running on from that moment and stopping at either end. A three-digit
  counter shows the tape position.
- `tuner` (`controls/tuner.js`, areas ≥ 3 wide and at most 2 tall, wide) is a
  car radio's tuning window: AM and FM scales (numerals from the glyph
  font) printed on backlit amber glass, a red needle across both, a tuning
  knob and a volume knob (the shared `knobBody`) either side, and in the
  two-tall form a row of preset keys. The needle follows the `tune` signal
  whoever moves it: turning the knob (`dial`), dragging the needle
  (`slide` along the window) or pressing a preset (`choose`, a hit that
  always sets its signal to `value`; the key sits down while the needle is
  within 0.003 of its station). Stations are rolled; the needle and a
  stereo LED brighten within 0.025 of one, and the audio band lifts the
  needle's glow when locked. Its pose reads only its values, so it is
  memoised and not `live`.
- `control-panel:check` presses and drags every hit on a dozen rolled panels
  and fails on one that moves nothing; `checkDisplays` presses every
  Inventory screen's cursor twice, lights every matrix mode, clicks Life
  cells, walls the bouncing ball in, regrows the mimic panel from its seed
  and watches its trains, watches the telltales come and go, places radar contacts, plays pong for
  four minutes, and dials the HAL eye.

## Outputs

- **Stills**: views `front`, `hero`, `raking`, `detail` (the largest module),
  perspective through `framePoints`.
- **Video**: `operate` (controls move), `montage` (frozen cuts), `build`
  (rise in, then operate), `drift` (a close-in camera slides over the face)
  and `turntable`.
- **Plot SVG**: every part's outline through the still's camera (boxes'
  edges, frustum rims and silhouettes, sphere and torus circles; flat
  silkscreen as its top face), hidden lines dropped against the depth pass,
  one layer per colour. Cables plot continuous silhouette edges without
  tessellation rings, with tighter depth probes at crossings. Whole-panel
  shading and optional base fill use shared `plotKit` vector pen strokes,
  the frozen lit render, albedo coverage and one palette for lines and shade.
  `svgShading: none` keeps outlines only unless `svgFill` is enabled. Shading
  spacing respects `svgPenMm` and `plotWidthMm`. The paper is preview styling,
  never a plotted shape; pale inks are darkened for paper contrast.
- The stage settles generated ropes in fixed ticks on load, advances physics
  on a fixed 120 Hz clock and resets/replays on backwards seeks. Raster,
  depth, albedo and SVG of a moment do not advance physics between passes.
  Tube geometry is one batched mesh with reusable buffers; plugs reuse the
  primitive layers. Settled ropes sleep and wake on interaction.

## Definition of done

- `npm run control-panel:check`
- `npm run lint:fix`
- `npm run control-panel:generate -- --count 1 --svg`
- `npm run control-panel:video -- --count 2 --pixelRatio 1 --hold 1`
- `npm run live:check -- controlPanel`
- The scene still renders in the browser (human eyeball).

## Hand-authored panels

`/dev/control-panel-designer` places module plates on a quarter-cell grid,
then edits individual controls inside a selected plate. The catalogue is the
real Inventory (excluding the procedural cluster), plus explicit round-lit
buttons and seeded-variation choices. Catalogue dimensions are starting sizes,
not limits: a 4 × 2 patch bay can be placed or resized as 4 × 4, for example.
Controls have explicit footprints, variants and detail seeds. Moving a control
or adding a neighbour does not reroll its details. Modules and controls must
stay inside their parent and cannot overlap. Unit controls resize as squares;
area controls retain the catalogue's shape constraints.

The three-free `design.js` owns the version 1 model and `cp1.` codec:
`{ version, cols, rows, modules, look }`. Each module stores
`{ id, x, y, w, h, seed, zone, controls }`; each control stores
`{ id, type, variant, x, y, w, h, seed, rotation? }`, with coordinates relative to its
module's top-left. Optional `rotation` is clockwise degrees (0, 90, 180,
270); omitted means zero and existing codes retain their meaning. `w` / `h`
are the rotated footprint; catalogue builders still receive their original
local dimensions. Limits are 160 plates and 512 controls. Optional `look`
values pin authored colours/materials and enclosure from the option schema.
`designBuild.js` calls the ordinary catalogue builders; `buildPanel` uses the
same plates, screws, chassis, hit regions, sockets, pose and plot path.

The schema's `panelDesign` holds a code in scene presets and sidecars, or a
saved name / JSON path for CLI input. Empty preserves the existing generator.
Authored panels take their own dimensions and suppress Swap, Scroll and Fill
View. Roll layout in the scene clears the design; rolling the look or cables
does not discard the authored placement. Explicit design appearance wins over
rolled look values. Existing presets carry an explicit empty design value.

The Designer saves JSON under `src/modules/controlPanel/designs/` through
`/dev-api/control-panel-designer/designs`. Its local draft recovers after a
reload; undo/redo holds 100 edits, each drag is one edit, and code/JSON can be
copied, downloaded and imported. Layout and appearance save together. Cable
and control gestures in the live preview belong to that preview session;
Capture retains them in the CLI generation, rather than changing the design.

The workbench's saved-design picker, Designer link, and `?design=` / `?code=`
entry points all use the same model. The Designer's scene link embeds the code
as `panelDesign` in the URL. The preview uses `createPanelStage` through
`LiveStage`, including orbit, operating controls, socket patching and capture.

```sh
npm run control-panel:generate -- --panelDesign my-panel --svg
npm run control-panel:video -- --panelDesign my-panel --mode operate
```

### Rotation and placement size

The placement controls choose width, height and orientation before placing a
control, so a wide control can be placed directly in a tall module. Selected
controls and whole modules have **Rotate 90°**. `R` rotates the placement
brush while placing controls, otherwise the selection; `Shift-R` reverses.
Rotation is one undo step and retains the top-left anchor. It is refused when
the new footprint would overlap a neighbour or leave its parent. Rotating a
module turns all its controls and their footprints together.

`designTransforms.js` owns footprint/local-size conversion and quarter turns.
`designBuild.js` passes a Z quaternion through the shared primitive/pose path.
Hit regions and socket positions follow it. Gestures are converted back into
the control's unrotated frame, so sliders, touch pads, joysticks, trackballs
and pull controls retain their logical axes. Rotated cable colliders and loose
paper bounds use conservative world-space boxes. Renders, live interactions
and SVG export share the same rotated parts.

Size-dependent control variations use the ordinary builders: larger patch
bays gain sockets, fader banks gain faders and keypads gain keys. Named
variants are selectable; **Reroll details** changes a persistent detail seed
for other procedural differences. The Inventory itself is unchanged, so its
existing preset retains the same arrangement.
