# // Pour One Out

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- A viscous, self-lit pour falling through a pincushion of cylinders, wrapped in the adaptive sparse grid the solver actually uses — the Houdini Axiom/Paradigm "Data Structure" output, rebuilt in the browser.
- Reference: adaptive sparse grid visualisation, boxes sized by distance from the active surface, everything on black.

## // TODO:

- [ ] Screen-space fluid surface: depth pass, bilateral blur, thickness, reconstructed normals, refraction. Particles are the v1 stand-in; the reference reads as a continuous glossy liquid. Ports available at `~/dev/examples/fluid/src/sph/3d/webgpu_screen_space` and `~/dev/examples/WebGPU-Ocean/render`.
- [ ] Post-processing left out per scene-conventions §12 — bloom and depth of field are most of what sells the reference once the layout settles.
- [ ] The 32-cell level never draws, because the pool and the rig between them put content in all eight octants. A taller domain, or a smaller rig, is the lever.
- [ ] Particles do not cast shadows — with the emissive palette the pins get their warm bounce from the `pool` point light instead. Revisit if the surface renderer lands.
- [ ] Pin layout is a jittered lattice with a seed; the reference's pins look hand-placed. Consider authoring positions instead of scattering them.
- [ ] Solid cells are marked by point-sampling the SDF at cell centres, so a pin thinner than a cell can leak. Sub-sampling or a conservative test would close it.
- [ ] No viscosity term. Axiom/Paradigm-style pours often want one; it would be a diffusion pass on the grid velocity before the projection.
- [ ] use `~/dev/examples/dli-flow` as reference to improve the volumetric flow of particles

## // Presets

- [ ] Tune Cold Sludge — viscosity high enough to sheet off the pins rather than run off them.
- [ ] A preset framed on the pool rather than the plate.

## // Features

- [ ] Emitter shapes beyond a round jet (sheet, ring).
- [ ] Freeze the sim and orbit the frozen grid.

## // Interactivity

- [ ] Pointer force on the stream, like flow's mouse ray.

## // Bugs
