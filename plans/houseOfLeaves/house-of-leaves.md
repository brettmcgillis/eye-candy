# House of Leaves — the loop

One scene, `WebGPU/HouseOfLeaves`. A directed first-person loop in tribute to
the book: living room → the hallway that should not be there → the great room
→ the grand staircase → the shaft floor → a hallway back → the same living
room → the hallway again. Photoreal register, VR-like framing, the camera is a
performance over a procedurally streamed world.

Research notes that still apply: `five-minute-hallway.md`, `grand-staircase.md`.

## Decisions (2026-09-18)

- **Directed, not played.** A director script drives the walker's autopilot:
  speed, look targets, pauses. WASD and drag-look stay as a debug mode only
  (`walkEnabled` with `directed` off). Undecided whether playable stays long
  term; nothing in the movement code depends on the answer.
- **Rectilinear.** Flat walls, square openings, no arches. Truer to the
  source's plain ash-grey surfaces and it is what makes watertight geometry
  cheap. Arches can return later as a different air profile (see below); they
  are not a different technique.
- **Air volumes, not sheets.** Every artifact so far — paper walls, corners
  that miss, holes to the void — came from building architecture as separate
  zero-thickness lofts nudged into each other. Architecture is now the
  *boundary of the union of the air volumes*: a corridor unit is a tapered
  prism unioned (three-bvh-csg) with its branch box, room box or dead end;
  the result is flipped to face inward, its open ends dropped. Corners meet by
  construction, openings are the same volume as what is behind them, and
  nothing is double-sided. Where two air volumes meet on a plane with
  different sections (a stepped joint, a doorway into a bigger space) the wall
  between them is an analytic rectangle-minus-rectangle frame, no boolean.
  Measured: unit union ≈5 ms, landing mouth patch ≈5 ms, floor ≈40 ms once. A
  boolean over the whole streamed shaft wall is 640 ms, so the shaft keeps its
  lofted wall and only the cells around a landing's mouths are cut.
- **Absolute coordinates, one system.** Heights are absolute (`riseTo(u)`
  counts every landing plateau from the top, ~20 landings, trivially cheap),
  so the frame-relative shaft and its rise reference are gone. Zones are
  *placed* (origin + heading) and chained lap by lap: the living room at the
  end of the return hallway is a new placement of the same zone, and the next
  hallway leaves it exactly as the first did. Spaces mount by proximity to the
  walker, not by which zone it is standing in, so looking back at the room
  from the top landing shows the room.
- **Two scenes cut.** `LabyrinthKit` (wrap/fold tour, stage previews) and
  `GrandStaircase` (treadmill descent) are deleted. The analytic light column
  from `GrandStaircase` is a concept to re-implement inside this scene later,
  not a file to harvest.
- **PBR back on.** Triplanar photo sets with normal and roughness over the
  procedural ash; nothing here is ever lit past the flashlight cone, so the
  tiling worry at room scale does not apply.
- **Readability is exposure + light tiers**, not "less darkness": AgX tone
  mapping with an exposure control, film grain to kill near-black banding,
  vignette, bloom on the TV and the light at the end of the return hallway,
  a very low cool fill in the shaft so the far wall is *barely* there and the
  200 ft → 500 ft growth reads, warm practicals in the living room.

## The loop, as beats

1. Living room, evening, TV on. Settle. A slow 360° look; the north wall is
   plain. The doorway is swapped in only while the wall is out of frame.
   Coming back round: a doorway, dark, with no end.
2. Walk in. Domestic width at first, then the section drifts and grows. Side
   doorways to rooms, junctions, dead ends. The light is the carried torch.
   Walking becomes running.
3. The threshold to the great room: stop, look up and around into nothing.
   Cross to the rim of the circular opening, look over — no bottom.
4. Onto the top landing, down. Flights and landings whose count never
   settles, the shaft opening as it goes, turns that stop being concentric.
   Glances over the edge and up. Running.
5. The floor. Several thresholds of different sizes. Turn, weigh each, choose.
6. A hallway like the first, shrinking back toward domestic width. A warm
   light far ahead. Run. It is the living room. Cross the threshold, turn:
   everything as it was, and after the turn the doorway is gone.
7. Loop from 1.

## Layout

Zones and their frames, per lap `n`:

| Zone           | Origin                                        | Heading        |
| -------------- | --------------------------------------------- | -------------- |
| livingRoom     | lap 0: world origin; else return corridor end | as arrived + π |
| corridor       | living room door, outside the wall            | living room    |
| greatRoom      | corridor end + half the room                  | corridor       |
| shaft          | great room centre (hole = axis at u=0)        | great room     |
| shaftFloor     | shaft axis at u = descent                     | shaft          |
| returnCorridor | chosen spoke, outside the skirt               | shaft + spoke  |

## Build order

1. Cut the two scenes, collapse the plans. — done
2. Air-volume geometry in `@modules/houseOfLeaves/geometry`: `air` (CSG
   helpers), `frame`, `corridorUnit`, `greatRoom`, `shaftFloor`, `mouthPatch`,
   `livingRoom`. Old lofts removed.
3. Zones with placement, absolute heights, lap chaining, proximity mounting.
4. Director and the living-room reveal latch.
5. Living room dressing: retro TV via the CRT channel materials, rug, and
   placeholder furniture until the Poly Haven models are brought in.
6. Light tiers, PBR surfaces, post stack, exposure pass.
7. Presets: `Loop`, a long `Five and a Half Minutes`, per-zone rigs, seam
   check.

## Follow-ups

- Corridor turns (a unit kind that rotates the axis) — the walk is straight
  for now.
- Arched profile as an alternative air section.
- A droppable flare at the rim.
- The analytic shaft column light for scale.
- Audio: the growl, the TV, footsteps. Howler is in the repo.
