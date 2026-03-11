# // PlotterTest

# // TODO:

[Back to main TODO](../../../../TODO.md)

# // Intent/Use Cases

- Im trying to bring browser art into the real world using various methods. I want to explore generating lo-fi prints.
- This scene will be used as a test bed to develop code to support exporting R3F scenes as SVG files so they can be printed using a pen plotter.
- The existing Three SVGRenderer does not support shadows so we need to develop our own process. Futhermore, we want to be able to capture textures & patterns that may be present in materials in the scene.
- If possible this test bed should allow a/b comparison of the current scene and it's output in side by side view panels.
- Conceptually the output should almost appear like a post-processing effect in that we want to be able to see the edges and shading of the objects in the scene, but we do not want to see back-faces, or artifacts that would otherwise not be seen by the camera in the Scene.

- The end-product of this test/exploration should be a component that can be added within the Canvas.
- The component should use Leva to create a new folder of controls.
- The controls should include any available options to tune the appearance of the output.
- The controls should include a button to export the scene as svg
- The folder and controls should only be visible in dev.

- The left side of the scene should contain a test scene in 3d. This side should determine the perspective we are using for the plotter output. This side should contain orbit controls so we can modify camera position and see it reflected in the plotter output. This side will eventually be used to display ANY scene from the app.
- The right side of the scene should contain a preview of the plotter output. This side should not have any sort of camera control and is only used to preview the output. Any modifications to camera position on the left side should not modify camera position on this side, only change the contents rendered in the preview.

# // Features

- [x] Support exporting a scene as an SVG, to be printed using an xy pen plotter.
- [x] Toggle to represent scene shadows using hatching
- [x] Toggle to represent scene shadows using contour lines

- [x] Include a test scene containing a stationary Bret & reversal, using similar orientation as loGlow. Elements should be stationary/not animated. Do not include bloom, post processing, etc.

- [x] Upgrade comparison to true dual synchronized viewports/canvases (current implementation uses side-by-side source + generated plotter panel in one scene).

- [ ] Could we do a mode where the whole image gets drawn from vertical lines? if so can we add a rotation angle?
- [ ] Could we do a mode where the whole image gets drawn with 1 line? ie, a spiral from center out?

# // Bugs

# // Home made renderer bugs

- [ ] Hide lines that would not be visible to camera, ie lines making up the back of model.
- [ ] Scene should be in one of the test labs, not main scenes
- [ ] Seeing too much model wire frame on cube, sphere, plane
- [ ] Seeing plane lines through cube and sphere
- [ ] Hatching does not get more dense with shadows, is evenly applied across all faces of cube, plane
- [ ] Countour lines not behaving as expected. Find examples, clarify intent.

# // Three-plotter-renderer bugs

- [ ] App seems to hang between camera moves on the test scene. I should be able to move the camera freely and see the output reflected on the right side, without lag on the left side. Its ok if it takes time to re-render the plotter output but we need to make sure the whole browser doenst hang, and the left side doesnt hang.
- [ ] Plotter preview seems to contain more than one preview. The white plane contains 1 version of the output constrained to the bottom left corner, and a second version closer to the center.
- [ ] Add more controls to govern the behaviour of the three-plotter-renderer

# // General bugs

- [ ] Update the plotter output preview to always stay facing the camera. The preview should be like a billboard that reflects the camera position of the test scene.

# // Progress Notes

- [x] Scene moved out of main scenes and into WebGL Test Lab scene selection.
- [x] Added renderer mode toggle for A/B testing: `thirdParty`, `homebrew`, `split-ab`.
- [x] Added expanded three-plotter-renderer controls (interactive resolution, debounce, frame budgets, segment caps, spacing floor, edge toggle).
- [x] Added dev diagnostics controls (compute state, queue depth, request/superseded/error counters, last compute time, last renderer/mode, detected SVG node count).
- [x] Updated output preview panel to billboard toward the active scene camera.
- [ ] Visual-verify duplicate preview issue is fully resolved after latest SVG extraction and draw-pipeline hardening.
- [ ] Visual-verify smooth left-camera interaction in browser under continuous orbit movement; tune new controls as needed.
