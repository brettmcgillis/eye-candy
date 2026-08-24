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

[Back to main TODO](../../../../../TODO.md)

## Bugs

- [x] Fix window resize issue that stops the sim. It's a material – it shouldn't matter. We need to slap this on a model and have it remain interactive (very low priority).
- [ ] Fix sim resolution control changes from resetting the fluid simulation state if possible (very low priority).
- [x] Fix auto‑splat behavior so it works and also does not prevent or interfere with pointer interaction.
- [x] Slow down auto‑splats. rate 0 should be stopped; 100 is way too fast.
- [x] Add support for interaction while sim is paused. Should still be able to drop ink.
- [x] Fix auto-splat debug markers disappearing on pause.
- [ ] Fix orbit on pointer down on sphere. Cant drag cursor to drop ink without orbiting as well (very low priority).
- [x] Fix debugcontactfadeduration. control should represent time in seconds it takes for squares to fade. min 0 should be near instant, set a max of 5 for 5 seconds.

## Refactor / Architecture

- [x] Hoist Leva controls hook out of the material file and into the test/scene file. The material should be a dumb componet that takes props and acts on them.
- [ ] Tidy up control ranges/min‑maxes and adjust presets accordingly. Any auto splat controls that govern force, strength, etc, should parrallel the controls applied to the cursor
- [x] auto‑splat logic belongs in the scene; material should just accept contact points for user & auto.
- [x] Move shader code out of the material file.
- [x] Consider what else should live in separate modules. Any reusable hooks?
- [x] Add a clear/reset control for the simulation (both in the public API and Leva).
- [x] Fix debug markers, shape and size can be unpredicable across screen sizes. add height/width controls, remove aspect controls. default to square dimensions

# // Presets

## Features

- [x] Add rotation controls for debug cursor, debug auto, and debug stationary markers. min max at 0 - 90 degrees.
- [x] Add discrete control folders for pointer/hand controls, auto splat controls, stationary splat controls, and random burst controls. Try to keep control order in folders uniform.
- [x] Add `input mode` control: Option `Pointer/Touch` uses current mouse/touch pinter config. Option `Hands` uses existing media pipe hand‑control hooks to get points from webcam and translates these to pointer position.
- [x] Support for n auto‑splats (and presets that exercise multiple splats).
- [x] Add `test mode` control: Option `Plane` shows current config with plane and orthographic cam. Option `3d` shows material on a sphere with orbit cam controls.
- [x] Add controls for cursor debug square sizing.
- [x] Add controls for cursor debug square line weight.
- [ ] Experiment with other dither effects, provide option control
- [x] Add a subtractive blend mode.
- [x] Move blend mode out of display and into color.
- [ ] Add frequency control to induce stutter in mouse input (dotted vs solid line).
- [x] Add stationary auto‑splats.
- [x] Can we add/remove x/y controls to/from leva as we add/remove stationary splats, and control the splat position using leva? Can we wire these dynamically added controls into our presets, so I can copy stationary splat settings and paste back to ide, along with the rest of the control values?
- [ ] Figure out what to do with gesture control. Consider gestures for add/remove auto splats, gesture for generate random bursts, gesture for "pointer down".
- [x] Support for multiple hands coming back from media pipe -> map to multiple pointers.
- [x] Add controls for the appearance of the debug markers shown around the random splats. Add controls for random splat strength,
- [x] Add toggle, fill debug marker, to all the contact point folders, to allow for filling debug markers discretely per contact type
- [ ] Add a background color or gradient to show behind the sphere in 3d mode. Add controls for color(s). Update presets to include props with matching colors.
- [x] Add controls for auto splat start position, following the pattern established for stationary splats. Update presets.
- [x] Bump auto/stationary splat max from 8 to 10.
- [x] Move autosplat to start position when it changes.
- [x] Can we implement direction on stationary splats?
- [x] Implement stationary debug markers
- [x] Align Random burst controls with auto, stationary, pointer. Are we missing force, dye? What else?

## Polish / Presets / UX

- [x] Add some sensible presets: fast fluid, viscous flow, debug‑always‑on, varied palettes.
- [x] Add support and preset for black‑ink‑on‑white.
- [x] Update Leva controls to include labels so displayed text can be shorter.
- [ ] Prepare a README so i dont forget how to use the various props for controlling the material behaviours.
- [ ] Update preset for black and red squares. Move config upto 1/3 mark, apply more downward force.

- [ ] Improve perf. really slow on low end devices. Can we get an improvement if we pull the marker squares out of the shader and handle them in the scene?

- [ ] Hoist Cardinals (mobile) out of Fluid Test and into dedicated scene at the App level. Do not bring test mode, scene is always plane + orthographic cam
- [ ] Hoist Watercolor Squares (mobile) out of Fluid Test and into dedicated scene at the App level. Include Blue variant as preset. Do not bring test mode, scene is always plane + orthographic cam. Consider: Does watercolor squares override controls to provide consistent appearance across viewport sizes?
