# // Rorschach

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] Is there a way that we can script the generation of n Tests, and grab a screenshots of each when its complete? Im thinking all 4 perspectives, plus 1 orbit. Might be an interesting experiment to create a new instagram page and post one every day. Pretty sure theres an IG CLI we could use as well.

- [ ] 3d lines (tubes) mode to extend lines mode
- [ ] might want to explore dramatic lighting when we get to particles and lines mode assuming they are spheres/tubes
- [ ] Regen button should roll the dice on like, all the controls, not just seed. Do close to last to better decide what to include/exclude and how this should work. After some consideration, we would want to min/max some of the fields, example: no one wants a Test thats just 1 bundle. no one wants a white test on white background.

- [ ] could we use lospec pallettes, or something alike, to make sure that background + pallette are cohesive when randomly chosen?

- [ ] Im envisioning a cinematic mode. scene starts, camera at x-, orbit enabled. Test starts generating as camera sweeps around. as the camera nears x+, the Test is flattened. as the camera hits x+ a new seed is selected so that as the camera continues around the back a new system emerges. each half-rotation shows a new system grow. I suspect this is nearly possible today with the controls we have, but would need to align rotation speed & growth speed, as well as implement the continuous mode mentioned above, as well as the background <-> pallette matching to ensure that lines are visible and not masked by background.

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
