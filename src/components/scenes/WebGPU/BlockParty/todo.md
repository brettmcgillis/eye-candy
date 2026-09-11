# // Block Party

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

An isometric city grown as real solids from the recursive quad subdivision in
the reference sketch (`plans/iso-csg-city.md`), shaded the way the sketch
shades rather than the way a 3D scene usually does.

The sketch is a print, not a render. Sampling its own output gives paper white
at 80% of the frame, a handful of flat mid-greys at about 10%, near-black at
about 10%, and under 1% colour. There is no light anywhere in it. So the cards
here are real geometry under a real orthographic camera, but every material is
unlit and every tone is authored: a face's colour comes from which face it is
and where you are on it. The scene carries no LightingRig by design.

### // Reference mapping

- Leaf quads sort by area exactly as the sketch does: tiny to towers, small to
  plazas, one narrow band to stairs, the largest left whole as plazas.
- Cards float on blank paper. The sketch offsets each white fill up-screen and
  leaves the stroke showing below it, which reads as the card's thickness —
  under an isometric camera that band is just the card's own side faces, so
  there is no plate and the gaps between cells carry no material.
- Every third landuse cell is near-black. The sketch clips its ten-deep shadow
  stack inside the cell, so what it actually draws is a black card with the
  paper showing through a narrow band along the two edges nearest the top of
  the screen, not a hole.
- The blue accent is ten nested rings: the cell outline stroked in blue and
  offset (10, 10) each pass, fading by `0.8 - i / 10`. Under the clip those
  read as chevrons nesting toward the bottom of the screen. It only reaches
  cells large enough to stay unsplit, which is the sketch's own behaviour — at
  seed 2 both the sketch and this scene land on exactly four.
- Tower sides darken with height on the sketch's `pow((i / tot) * 0.75, 2)`
  ramp and carry the banding of its individual strokes.
- Stair treads darken on the sketch's `a += 0.15` per step, so a short
  staircase stays mostly grey and a long one goes solid black partway down.
- Ink runs at 0.25 alpha in pure black, which is the sketch's own
  `globalAlpha` and lands on the same 191 grey.
- Grain is 16/255, the sketch's closing move.
- The seed crop is on: the sketch's random 1-3x zoom is part of the
  composition, and at seed 2 it is 1.5x.

### // Deviations

- Tower footprints get a minimum width. The street inset can leave a 2px
  sliver, which the sketch strokes as a spike but a solid cannot show.
- Stair taper is one library-wide control rather than the sketch's per-cell
  pixel creep, since the taper is carved into shared variants.
- A rolling rebuild reseeds one district off its own stream. The sketch's
  single stream cannot be resumed mid-sequence.
- Card sides carry two authored greys rather than one, chosen by facing axis.
  The sketch's stacked outlines leave a card's two visible sides at different
  tones; this keeps that without introducing a light.

## // TODO:

- [ ] Grey share reads 4.5% against the reference's 10.6% in the headless
      tonal check, which measures the beauty pass only. Most of the gap should
      be the ink network the check cannot see — confirm on the live scene and
      raise ink strength or plaza rise if it is genuinely thin.
- [ ] Colour share reads 1.2% against the reference's 0.6%. Thin the rings
      further or drop ring intensity if the blue cells read too hot.
- [ ] Tower banding is bands-per-100px rather than the sketch's literal 1px
      strokes, which would moire. Check it reads as texture, not stripes.

## // Presets

- [x] Paper — tones sampled off the reference render.
- [x] Night — the same city inverted, carried by the neon and the rings.

## // Features

- [x] Orthographic camera, elevation read back out of the sketch's 0.62
      vertical squash.
- [x] Flat unlit materials, no LightingRig.
- [x] Build-in sweep outward from the middle on one unbounded clock.
- [x] Rolling rebuild, one district at a time.
- [x] Neon pad and ring pulse.
- [x] Ink, bloom and grain post chain.
- [x] Seed crop honouring the sketch's random zoom.

## // Bugs
