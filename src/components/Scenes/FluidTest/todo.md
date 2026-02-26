# // FluidTest

Long term vision / use cases:

- Material receives props to determine visual appearance.
- Material acknowledges input movement, including but not limited to the mouse & media pipe hand tracking.
- Material supports auto splats via input, using the same or similar pattern as mouse input.
- Material can be added to a 3d model
- Material can be added to a plane, which can then be scaled to view port size for full screen ux.
- Material allows for dynamic adjustment of shader props
- Material can be used in other compositions for interactivity

- Scene serves as a test bed for the development of the material.
- Scene includes mode allowing me to test material on a full viewport plane with orthographic camera.
- Scene includes a mode allowing me to test material on a 3d geometry, with orbit camera controls
- Scene manages material settings via leva controls.
- Scene manages user input from mouse or media pipe hook, and passes the point data to the material.
- Scene manages auto splat logic and behaviour, and passess the point data to the material.
- Scene can serve as a stand alone composition, when it is presenting the material on a plane occupying the full viewport and using orthographic camera

# // TODO:

[Back to main TODO](../../../../TODO.md)

- [ ] Fix sim resolution control changes from resetting the fluid simulation state if possible. very low priorty.
- [x] Fix auto-splat behavior so it works and also does not prevent or interfere with pointer interaction.
- [ ] Fix window resize issue that stops the sim. Its a material, it shouldnt matter? We need to be able to slap this material on a model in a scene and have it become interactive.
- [ ] Add input `mode` control: `Pointer/Touch` or `Hands` (wire with existing hand control hooks).
- [x] Add some sensible presets. Need a fast moving fluid, need a flow viscous fluid, need a preset with debug always on, need to set up some preset with different color pallettes
- [x] Add support and preset for black ink on white background.
- [x] Add support for n autoSplats
- [ ] Slow down auto splats. autosplat rate 0 should be stopped. 100 is way too fast.
- [ ] Hoist leva controls out of material file and into test file.
- [ ] Should auto splat logic get hoisted too? Perhaps the material should just accept the points of contact, like the mouse?
- [ ] Try the material on an existing model
- [ ] Add controls for debug square sizing.
- [ ] Try other dither effects.
- [ ] Move shader code out of material file.
- [ ] Consider what else should go in separate files. Are there any hooks to be created to help separate concerns?
- [ ] Try subtractive blendmode
- [ ] Add frequency control to induce stutter in mouse control; think dotted vs solid line
- [ ] Tidy up controls, lots of weird min/maxes there. Adjust presets accordingly.
- [ ] Can we do a preset that looks like an inverted photgraph?
- [ ] Add support for interaction while sim is paused. Should be able to still drop ink.
- [ ] Update leva controls to include labels so we can shorten displayed text.
- [ ] Document the effect each control has on the sim.
- [ ] After separating concerns between test file and material, try to add support for stationary auto splats. Use a leva control to add/remove stationary splats. allow drag and drop with mouse.
