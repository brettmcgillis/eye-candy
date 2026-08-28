# House of Leaves — a constellation

Not one scene. A set of related pieces sharing one art direction, built and
posted separately, each standing on its own.

**Status:** planning only, nothing built.

---

## The governing idea

The book's power is **scale betrayal witnessed, not navigated**. The horror is
that a space refuses to agree with itself, and that you are looking at it.

This produces one hard constraint, which every scene below inherits:

> **Do not build a walkable house.** "Bigger on the inside" as an explorable is
> a game, and navigating a space converts dread into puzzle-solving. The camera
> should be trapped, not driven.

Cameras are static holds or slow dollies. The viewer cannot get out. That also
makes every scene generative-still and video capable, which is the Rorschach
pipeline shape rather than a fight against it.

## Shared art direction

- Ash-grey, featureless walls. No trim, no fixtures, no scale cues. Surfaces
  that **absorb light** rather than return it — a lamp should reveal almost
  nothing.
- Volumetric fog and shafts. The mist is what makes the depth legible and the
  distance unresolvable at the same time.
- Deep black falloff. Darkness as a material, not an absence.
- Restraint on color. When color appears (the red interior lighting in
  Apart(maze)ment) it should be the only color in frame.
- No people. No furniture. The absence is the subject.

## The scenes

Ordered by how ready they are to build, not by importance.

### 1. The Grand Staircase — the starter

Camera slowly descending an endless spiral staircase. Hallways branch off into
darkness at intervals. Volumetric fog and lighting for the misty, surreal
register.

The single most important detail: **the staircase must be quietly wrong about
its own length.** In the book the descent takes wildly different times on
different expeditions. If the geometry loops on a fixed period the viewer will
pin the trick and the dread evaporates. The period needs to drift — landings
arriving at intervals that never resolve into a countable pattern.

Open questions:

- Procedural helix with instanced steps, or a repeating segment swapped out
  below the camera? The second is cheaper but risks a detectable loop.
- Does the camera fall at constant speed, or does the speed itself drift?
- Do the branching hallways ever get lit, or only ever imply depth?

### 2. Five and a Half Minute Hallway

A normal domestic doorway in a normal interior wall, opening onto a corridor
that recedes far past where the house ends. The entire thesis in one frame:
domestic trim on the near side, ash-grey nothing on the far side.

This is the most static of the set — possibly a single locked-off shot. The
contrast between the two materials at the threshold is the whole image, so the
domestic side has to be convincingly ordinary.

### 3. Apart(maze)ment

MarkovJunior-generated. White and grey voxels, black outlines, red dramatic
lighting inside the structures. Maze-like halls, staircases, windows.

**This is deliberately NOT the same scene as the house interiors** — the earlier
call to merge them was wrong. Apart(maze)ment is a _building full of rooms_;
the house's labyrinth is a negative space with no rooms at all, where the horror
is that there is nothing in it. Those are opposite feelings and they should not
share a renderer or a palette. It belongs in the constellation because it shares
the labyrinth theme, not because it shares the look.

References: MarkovJunior / MarkovJuniorWeb. Generator may need adjustment to
land the apartemazement look specifically.

### 4. Bigger on the Inside

Exterior view of the house, with windows looking into impossible interiors.
Parallax Occlusion Mapping on the window planes to reveal spaces that cannot
fit: a forest, space, corridors receding past the far wall.

This is the original "House of Leaves 1" idea from the main TODO. Possible
starting point is the three.js skyscraper generator, adapted toward a
one/two/three-story house generator.

Open question: does the exterior stay perfectly ordinary (stronger contrast,
truer to the book) or does it get subtly wrong too?

### 5. Ash Tree Lane

The calm exterior. A completely ordinary Virginia house shot as a still, giving
away nothing.

Works as the constellation's opening frame and as the deliberate contrast that
makes every interior land harder. Cheapest piece in the set, and probably the
one that does the most work per unit of effort. Overlaps with Bigger on the
Inside — they may be one build with two treatments.

### 6. The Growl

The labyrinth reconfiguring while unobserved. Camera holds on a corridor;
geometry changes only when it is not being looked at.

Nearly pure trickery — visibility tests and geometry swaps — and genuinely
upsetting when it works. Risk: if the change is too obvious it reads as a
glitch; too subtle and nobody notices. Needs the most iteration of any piece
here.

### 7. Holloway's Descent

The expedition footage. Handheld camera, a headlamp cone that reaches nothing,
walls arriving and leaving the frame.

Found-footage register rather than architectural. Different enough in feel that
it might not belong — flagging it as a maybe.

### 8. The Quarter-Inch

The book's inciting image: measure the house outside, measure it inside, the
interior is fractionally larger. A scene that is just two measurements refusing
to agree.

Small, cold, and the most literal statement of the premise. Could be nearly
diagrammatic. Least "eye candy" of the set — include only if it earns a frame.

---

## Sourcing the text

The original TODO idea was to scrape the book for visual descriptions of the
house and its liminal spaces.

**Brett supplies the passages.** Agent recall of this text is reliable on
structure and imagery — Ash Tree Lane, the quarter-inch discrepancy, the hallway
in the living room wall, the Five and a Half Minute Hallway, the Great Staircase
whose descent changes length, the growl, Holloway's expedition, Zampanò and
Johnny Truant's footnotes — but **not** at page level, and extended description
should not be reproduced from memory regardless. Working from passages Brett
pulls himself is both more accurate and the correct way to handle the source.

## Build order

1. **The Grand Staircase** — best-specified, strongest single image, teaches the
   fog/darkness look the rest of the constellation inherits.
2. **Ash Tree Lane** or **Five and a Half Minute Hallway** — whichever the
   staircase's lighting work makes cheaper.
3. Everything else, informed by what the first two teach.

Apart(maze)ment can proceed independently at any point since it shares no
renderer with the others.

## Open questions for Brett

- One scene folder with presets per space, or separate scenes? Leaning separate
  — they share art direction but not geometry, and the presets would have almost
  nothing in common.
- Is there an audio dimension? The growl is a sound in the book. Howler is
  already in the repo (see the Surrender storm work).
- Does any piece want the stills/video CLI treatment, or are these all
  real-time-only scenes?
