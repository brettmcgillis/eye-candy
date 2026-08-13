# // Rorschach

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] 3d/2d toggle
- [ ] color pallette controls. can use gradients.json for some defaults perhaps
- [ ] background color control
- [ ] 3d lines (tubes) mode to extend lines mode
- [ ] controls per bundle? color, line thickness, etc
- [ ] evolution mode needs some work. expecting the bundles to move like tentacles, expecting the curves to change over time.
- [ ] can we update controls to allow for modifying the rorschach without having to regen? include as many controls as possible.
- [ ] Regen button should roll the dice on like, all the controls, not just seed.

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
