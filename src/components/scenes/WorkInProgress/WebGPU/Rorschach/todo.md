# // Rorschach

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] 3d lines (tubes) mode to extend lines mode
- [ ] controls per bundle? color, line thickness, etc
- [ ] evolution mode needs some work. expecting the bundles to move like tentacles, expecting the curves to change over time.
- [ ] can we update controls to allow for modifying the rorschach without having to regen? include as many controls as possible.
- [ ] Regen button should roll the dice on like, all the controls, not just seed.
- [ ] have a Continuous mode where when the growth animation completes we re-roll the dice and grow a new one, OR lines just keep advecting from the tip, while the tail disappears.
- [ ] right now the Tests seem to generate in a cubic volume->2d square, could we do sphere->2d circle? other shapes? Im thinking if we were to do prints we can just do squares.
- [ ] could we use lospec pallettes, or something alike, to make sure that background + pallette are cohesive when randomly chosen?
- [ ] could some bundles be emissive? if so include in the bundle control folders

# // Intent/Use Cases

- Generative ink-blot tests combining two references: nullHashPixel's
  Rorschach Algorithm tests (seeded formula-builder assembling a system of
  parametric ODEs, bundled and mirrored for bilateral symmetry) and
  sudoAquarelle's physically-based watercolor sim (Curtis et al. 1997
  shallow-water + pigment-deposition + capillary layers, Kubelka-Munk
  compositing).
- Three render modes sharing one ODE generator core: Lines (3D strokes),
  Points (3D point cloud), Ink (watercolor-on-paper). Lines ships first.

# // Presets

# // Features

- Phase 2: Points mode — same trajectory data as an alt render mode
  (GPU point cloud, likely a TSL compute migration for density), plus the
  `mode` toggle control.
- Phase 3: Ink mode — full Curtis-97 fluid/pigment/capillary ping-pong sim
  and Kubelka-Munk pigment compositing, paper-grain material.

# // Bugs

- line depth sorting seems to be all messed up
- preset settings not respected on page load.
- some control changes cause the Test to disappear, instead of regen, or continue. (ex, pallette)
- preset reset causes all black.
- animation starts before reveal? i pick a new seed and see lines of n length which then grow longer, instead of seeing those initial lines grow.
- initial draw seems fragmented (ie bundle x grows, then bundle y), whereas evolution is even and continous. Feels like i want both, modes, ie even growth or fragmented growth & even evolution or fragmented evolution
- seeing transparency/fading when evolution is off, during initial Test draw. feels like i want to be able to toggle this on/off to get solid lines or fading lines.
- changing ink color in monochrome causes test to disappear.
