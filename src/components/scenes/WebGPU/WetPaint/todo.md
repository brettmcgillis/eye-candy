# // Wet Paint

# // Intent / Use Cases

VR-style graffiti experience: paint a brick wall,
photograph the result. Realism first.

# // TODO:

- [x] the scene contains a brick wall generated from our cinderblock models and a spray paint can model
- [x] the scene contains some generated sidewalk and asphalt from the threejs generator addons
- [x] the scene contains some trash assets scattered
- [x] the scene contains a bunch of 'empty' spray cans on the curb.
- [x] the scene contains the streetlight model, like in urban wildlife
- [x] the scene contains two presets, day and night.
- [x] in day mode, bright day time atmosphere, no trash scattered, empty spraycans neatly organized.
- [x] in night mode, dark night atmosphere, streetlight illumination, trash scattering, cans scattered like litter.
- [x] the scene allows for two modes, paint, and color select.
- [x] when in color select mode the camera focuses on the spray can model, rotated to face the camera. on the front of the can are 3 sliders he user can use to manipulate the rgb color values, there is also a color wheel that allows the user to select by clicking. a part of the can model is updated to reflect the selected color.
- [x] when in paint mode the user can spray paint on the brick wall creating whatever design they want. paint can be applied to the curb and asphalt as well.
- [x] we should allow the user to set the diameter of the spray 'brush' as well.
- [x] we might want to be able to set texture too. ie, clean circle spray vs splattery spray.
- [x] we will want to figure out how to make paint drip too for good effect
- [x] the scene leverages the overlay buttons to offer the user the ability to switch modes, screenshot,
- [x] take a look at dev/examples/monkeypaint for how a basic example of to texture paint. (consulted; Canvas2D UV painting chosen instead — see project memory)
- [x] everything should be leva controllable/togglable so we can control it via presets, and for easy tuning in-scene

- [x] we will include a screenshot button on the scenes button overlay
- [x] this will be a semi-vr experience. as the user moves their mouse a spray can will move around the screen at the same position. To get an understanding of the scene intent we can imagine what a VR graffiti app might be like. where the can is visible, reflects the currently selected color.
- [x] we should provide an indicator of where the can is aiming, cast a ray, and a point the can along the ray so it's orientation matches how it should point at it's target.
- [x] we should provide an indicator of where the pointer is pointing when setting color so the user can more easily understand what theyre selecting.
- [x] paint sprayed on the asphalt or curb does not drip
- [x] we will override materials on the spray can such that:
  - the blue panel displays a blue gradient that, the red displays red, etc.
  - the color-ring on the can displays the currently selected color.
  - the can label has a color wheel on it that the user can click to select color.
  - when the user is setting color we should update the slider's positon accordingly. if they clcik the color wheel we set sliders, and update ring. if they move sliders we update ring.
- [x] the discarded spray can should have their color set so that it is reflected in the sliders and color ring.
- [x] we will scale the bricks down so that we can fit more in scene and make it more realistic. the brick wall should also resemble a staple from above '[' , meaning there are wall segments that extend in the z direction so we are not left with the staggered brick pattern silhouette from the front.
- [x] we will scale the can down to a realistic size
- [x] we will ensure the curb spans the lenght of the brick wall
- [x] we want the experience to feel like were actually painting the meshes in the scene. for example, we wouldnt want to see paint spanning across a gap in the bricks.

- [x] we may want to make the color wheel on the interactive can a decal so that it looks like an attribute of the can label. currently i cant use the sliders to set the color and with how the color is laid out on the can I can only select a few greens and blues.
- [x] cant seem to use sliders to set spray color. (the modeled knobs are now REAL drag controls — grab and slide along the groove, pointer-captured so the drag survives leaving the small mesh)
- [x] currently can only see a circle? not the spray can when painting. Am i seeing the bottom? I should see it oriented vertically, with the nozzle facing towards the wall on an angle, allowing me to see the can, as well as the full area where the reticle is hitting the wall. we dont want the can to obscure the user's vision of where theyre adding detail.
- [x] curbs are overlapping
- [x] cans should be organized like a 6-pack duing the day scene
- [x] cant paint on curbs for some reason.
- [x] cant paint on left and right walls for some reason. should be able to paint on everything in the scene, including streetlight.
- [x] need to extend left and right walls far enough that the user cant see edges.
- [x] need to fix intersection of back wall and side walls. currently the layers have the same offsets so there are gaps every second layer where a brick is missing.
- [x] need to be able to tune drippiness of paint to allow for clean outlines.
- [x] feels like we need many 'decals' on the side of the paint can to allow setting the properties of the paint. decals should be laid out like labels with similar aesthetic. If we dont have room on the front of the can for the settings we could include two other cans in the frame when setting color, example, cans at 3 rotations that allow user to see all sides and set all settings on all labels. We can almost imagine needing the same tools one would find in MS Paint. (label decals: wheel, RGB + brush sliders, 2-row brush picker)
- [x] scroll up/down should allow me to zoom in a bit more.
- [x] night mode is very bright. should feel a bit more like UrbanWildlife scene and how it is dark but being lit by the street light. we might consider making the street light taller as well so that it's like shines across the wall directionally for more dramatic effect.
- [x] bricks appear very dark, almost black in both modes. should be more redish brick. or shades of brick reds/browns

- [x] need to be able to scale brush down even further
- [x] need to be able to scale hardness down even further

- [x] when the user clicks the screenshot button we should go into a new third screenshot mode that allows the user to set the camera position, and does not have the painting can in the way, like camera operator mode, before snapping the picture. we may want to modify the overlay button as we go into this mode so it serves as the take-picture button too
- [x] wire up sprayCan.mp3 to play when user is spraying paint.
- [x] add audio toggle button to button overlay and use it to govern scene audio, so user decides if audio is enabled. disabled by default.
- [x] found this great sim (written in C, no example code) but we should try and adopt some of these features. Read the following and check the screenshots: https://mylescork.com/computer%20graphics/3d%20animation/graphic%20design/computer%20science/Spray-Paint-Sim/ (distance-based spread adopted in PaintRig)

- [x] need to fix the way paint gets applied. example: i have a large radius brush, i clck the wall near the base were it intersects with the curb. i only see paint applied to the wall until my reticle moves on to the curb (four offset footprint rays stamp neighboring surfaces, sized through meters so the spray is physically consistent across surfaces)

- [x] why cant we paint the faces of the curb? currently only top receives paint. (front-face decal strip added; slab ends/backs are instanced and stay unpaintable)
- [x] the interactive can is STILL NOT interactive. i see no click handling on the rgb sliders (fixed for real: pointer handlers live on the physical knob meshes themselves)
- [x] color-select is a three-can lineup: center can = draggable R/G/B knobs only; left can = color wheel + MATTE|METAL; right can = SIZE/HARD/DRIP sliders + cap-type rows. Decals sit in the label band (raw y ~1.5-4.4) instead of climbing off the can; camera widened to frame all three

- [x] check out dev/examples/chameleon.js for a great working example. we neeed to incorporate all of diff brush types offered and the fluid experience. (strokes now draw connected segments at any mouse speed; brushes ported: spray, marker, blurry marker, thick, ink drop, pencil, calligraphy + existing soft/splatter — picker on the can + Leva. skipped as non-graffiti novelty: fur, star, texture)

- [x] add a visual paint particle spray from the paint can
- [x] metallic paint finish (MATTE|METAL on the can + Leva): synced metalnessMap canvas per surface + baked sparkle flecks; paint decals switched to lit standard material so paint responds to the sun/streetlight

- [x] show audio toggle when in painting mode.

- [ ] move streelight. model has some asphalt attached which is jutting out of curb.
- [ ] make painting reticle same size as paint will be.
- [ ] make sure paint spray particles are depth appropriate, they appear to be z-closer to camera than can, should be other side.
- [ ] enhance paint spray particles with some transparent gassy particles
- [ ] fix material on blue slider panel on center can in color picker, currently not blue
- [ ] fix slider knobs on left and right cans in color picker mode, only slider panels visible.
- [ ] need to update the spray can in painting mode to shift to the right a bit when the user's cursor gets too far left on the screen, maybe right before it goes over the can; we want to make sure the usr can always see what theyre painting.
- [ ] reticle on can during color select needs to be smaller, should ideally curve to the shape of the can
- [ ] fix brick spacing, can see between them
- [x] put all three cans side by side, no space.
- [x] rotate left and right cans 180 from middle can to hide sliders like i already asked
- [x] put decals on cans, not floating above cans
- [ ] make the spray cap white. this is a model with PBR materials, you cant just clone and set color.
- [x] need to be able to select black/white using color picker mode.
- [x] need to be able to set paint opacity in color picker mode.
- [ ] bump the decals up a bit higher.
- [ ] Fix min/max on brush size.
- [ ] fix brush type picker in color picker mode - use icons + text instead of names/partial names'
- [ ] fix lighting, day mode is too dark on the wall.
- [ ] fix lighting, night mode is very dark, should add a moonlight projector
- [ ] fix how paint accepts lighting during day. i paint a part of the wall in shadow and the paint doesnt appear to be in shadow.
- [ ] Wire up sprayCanShake.mp3, find sprites in the audio and play a random when user is not painting but is moving around a bit.
- [ ] fix night mode lighting in color picker. too dramatic.
- [ ] fix camera position in color picker. cans should fill more of frame's vertical realestate
- [ ] fix value slider label in color picker. reverse drag for more intuitive black-white selection
- [ ] add reset canvas button to button overlay. add confirm modal
- [ ] Allow for a more expressive painting mode. see references/paintMotion.js for an `SSGI+SSR Painter`

[Back to main TODO](../../../../../TODO.md)

# // Presets

# // Features

# // Interactivity

# // Bugs
