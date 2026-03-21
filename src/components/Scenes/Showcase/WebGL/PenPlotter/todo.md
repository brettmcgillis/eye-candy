# // PenPlotter

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
- [ ] Upgrade comparison to true dual synchronized viewports/canvases, currently need to press a button or space to re-render. would be nice to do it every few frames automatically, so i can reorient the scene or toggle plotter renderer controls and see live updates. three-plotter-renderer supports this type of async rendering.
- [x] Can we update the plotter renderer to do a second opposing hatching pass, to get crosshatching? If so, add a control to enable, disable second pass
- [ ] Test with more complex geometries. ex loglow, newScene
- [x] Test with particle cloud. - Cant see it cause of renderer
- [x] Test with neural network. - Cant see it cause of renderer
- [x] Refactor out test scene as POC that we can use any scene on the left side.
- [ ] Once we know we can render any scene left, lets add a scene select for other webgl scenes and test those.
- [ ] Pretty sure we can simplify the component internals once we get the live refresh up and running too. Refresh on resize and refresh on mount will be unecessary.
- [ ] Consider adding a control for "guidelines". When enabled show lines at the 1/3 points of the left panel to aid in aligning the scene for rendering on the right panel, similar to the line we display down the center of the screen.
- [x] Update control defaults. minimum silhouette area to 0. max normal buckets. max edge smoothness filter. very tight, busy cross hatching by default, with high limit. second pass enabled @ 45 degrees.min max hatch spacing should be 1 and 4.
- [x] Refactor crosshatching into its own first-class optional layer with independent controls and appearance settings, parallel to hatching. See upgrayedd-plan.md
- [x] Add optional point and line primitive plotting layers with appearance controls and density optimizations for particle clouds and networks. See upgrayedd-plan.md
- [ ] Add robust frustum and SVG-boundary clipping so off-camera geometry is excluded and visible segments are trimmed to the export bounds. See upgrayedd-plan.md
- [x] Rename PlotterTest to penPlotter
- [x] Promote out of test lab and into full scene. Were out of testing phase.~
- [x] Rename TestScene to PrimitivesTest and move into PlotScenes folder
- [x] Update PlotView. This will now be used to manage what should be plotted. This should just have leva control for what plot-scene to show, and show the selected plot scene. similar to how the labs just render a test scene.

# // Bugs

- [x] Update scene to call refresh render on mount so we dont have to manually do it
- [ ] Refreshing the render seems to be locking the browser. for example, In a sub-scene I click to drag using orbit controls, press space bar to refresh AND keep dragging mouse to further the orbit rotation in the scene. Result: the test scene seems to stutter a bit as we orbit. Suspicion: refresh render is not truely async and is blocking. When we refresh the render conceptually we want to grab a screenshot from the sub-scene camera and render as svg async, leaving the sub-scene unaffected, and rendering that refresh-point-in-time to the plot panel. Previous attempts to fix have involved queing the request until sub-scene camera motion ceases and then capturing the scene and rendering the plot but I dont want queueing like this.
- [x] Remove all the debug console logging around plot rendering
- [x] Plot render looks weird on window resize, might need to refresh render on resize.
- [ ] On export I am seeing paths that extend way beyond the bounds of the scene. Example: the edges of the plane are larger than the silhouette of the plane. The silhouette seems to be obeying what i see in the plot render, but the edges extend beyond.
