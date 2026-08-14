# // Rorschach

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] 3d lines (tubes) mode to extend lines mode
- [ ] controls per bundle? color, line thickness, etc
- [ ] can we update controls to allow for modifying the rorschach without having to regen? include as many controls as possible.
- [ ] Regen button should roll the dice on like, all the controls, not just seed. Do close to last to better decide what to include/exclude and how this should work.
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

- Phase 2: Ink mode — full Curtis-97 fluid/pigment/capillary ping-pong sim
  and Kubelka-Munk pigment compositing, paper-grain material.
- Phase 3: Points mode — same trajectory data as an alt render mode
  (GPU point cloud, likely a TSL compute migration for density), plus the
  `mode` toggle control.

# // Bugs
