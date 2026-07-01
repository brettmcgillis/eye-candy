# // Wet Paint

# // Intent / Use Cases

# // TODO:

- the scene contains a brick wall generated from our cinderblock models and a spray paint can model
- the scene contains some generated sidewalk and asphalt from the threejs generator addons
- the scene contains some trash assets scattered
- the scene contains a bunch of 'empty' spray cans on the curb.
- the scene contains the streetlight model, like in urban wildlife
- the scene contains two presets, day and night.
- in day mode, bright day time atmosphere, no trash scattered, empty spraycans neatly organized.
- in night mode, dark night atmosphere, streetlight illumination, trash scattering, cans scattered like litter.
- the scene allows for two modes, paint, and color select.
- when in color select mode the camera focuses on the spray can model, rotated to face the camera. on the front of the can are 3 sliders he user can use to manipulate the rgb color values, there is also a color wheel that allows the user to select by clicking. a part of the can model is updated to reflect the selected color.
- when in paint mode the user can spray paint on the brick wall creating whatever design they want. paint can be applied to the curb and asphalt as well.
- we should allow the user to set the diameter of the spray 'brush' as well.
- we might want to be able to set texture too. ie, clean circle spray vs splattery spray.
- we will want to figure out how to make paint drip too for good effect
- the scene leverages the overlay buttons to offer the user the ability to switch modes, screenshot,
- take a look at dev/examples/monkeypaint for how a basic example of to texture paint.
- everything should be leva controllable/togglable so we can control it via presets, and for easy tuning in-scene

- we will include a screenshot button on the scenes button overlay
- this will be a semi-vr experience. as the user moves their mouse a spray can will move around the screen at the same position. To get an understanding of the scene intent we can imagine what a VR graffiti app might be like. where the can is visible, reflects the currently selected color.
- we should provide an indicator of where the can is aiming, cast a ray, and a point the can along the ray so it's orientation matches how it should point at it's target.
- we should provide an indicator of where the pointer is pointing when setting color so the user can more easily understand what theyre selecting.
- paint sprayed on the asphalt or curb does not drip
- we will override materials on the spray can such that:
  - the blue panel displays a blue gradient that, the red displays red, etc.
  - the color-ring on the can displays the currently selected color.
  - the can label has a color wheel on it that the user can click to select color.
  - when the user is setting color we should update the slider's positon accordingly. if they clcik the color wheel we set sliders, and update ring. if they move sliders we update ring.
- the discarded spray can should have their color set so that it is reflected in the sliders and color ring.
- we will scale the bricks down so that we can fit more in scene and make it more realistic. the brick wall should also resemble a staple from above '[' , meaning there are wall segments that extend in the z direction so we are not left with the staggered brick pattern silhouette from the front.
- we will scale the can down to a realistic size
- we will ensure the curb spans the lenght of the brick wall
- we want the experience to feel like were actually painting the meshes in the scene. for example, we wouldnt want to see paint spanning across a gap in the bricks.

- we may want to make the color wheel on the interactive can a decal so that it looks like an attribute of the can label. currently i cant use the sliders to set the color and with how the color is laid out on the can I can only select a few greens and blues.
- cant seem to use sliders to set spray color.
- currently can only see a circle? not the spray can when painting. Am i seeing the bottom? I should see it oriented vertically, with the nozzle facing towards the wall on an angle, allowing me to see the can, as well as the full area where the reticle is hitting the wall. we dont want the can to obscure the user's vision of where theyre adding detail.
- curbs are overlapping
- cans should be organized like a 6-pack duing the day scene
- cant paint on curbs for some reason.
- cant paint on left and right walls for some reason. should be able to paint on everything in the scene, including streetlight.
- need to extend left and right walls far enough that the user cant see edges.
- need to fix intersection of back wall and side walls. currently the layers have the same offsets so there are gaps every second layer where a brick is missing.
- need to be able to tune drippiness of paint to allow for clean outlines.
- feels like we need many 'decals' on the side of the paint can to allow setting the properties of the paint. decals should be laid out like labels with similar aesthetic. If we dont have room on the front of the can for the settings we could include two other cans in the frame when setting color, example, cans at 3 rotations that allow user to see all sides and set all settings on all labels. We can almost imagine needing the same tools one would find in MS Paint.
- scroll up/down should allow me to zoom in a bit more.
- night mode is very bright. should feel a bit more like UrbanWildlife scene and how it is dark but being lit by the street light. we might consider making the street light taller as well so that it's like shines across the wall directionally for more dramatic effect.
- bricks appear very dark, almost black in both modes. should be more redish brick. or shades of brick reds/browns
- curious about what it might look like if we used like, csg or something, to add white mortar between the bricks
- need to be able to scale brush down even further
- need to be able to scale hardness down even further
- reticle on can during color select needs to be smaller, should ideally curve to the shape of the can
- when the user clicks the screenshot button we should go into a new third screenshot mode that allows the user to set the camera position, and does not have the painting can in the way, like camera operator mode, before snapping the picture. we may want to modify the overlay button as we go into this mode so it serves as the take-picture button too
- wire up sprayCan.mp3 to play when user is spraying paint.
- add audio toggle button to button overlay and use it to govern scene audio, so user decides if audio is enabled. disabled by default.
- found this great sim (written in C, no example code) but we should try and adopt some of these features: https://mylescork.com/computer%20graphics/3d%20animation/graphic%20design/computer%20science/Spray-Paint-Sim/

- need to update the spray can in painting mode to shift to the right a bit when the user's cursor gets too far left on the screen, maybe right before it goes over the can; we want to make sure the usr can always see what theyre painting.

- need to fix the way paint gets applied. example: i have a large radius brush, i clck the wall near the base were it intersects with the curb. i only see paint applied to the wall until my reticle moves on to the curb

- why cant we paint the faces of the curb? currently only top receives paint.
- the interactive can is STILL NOT interactive. i see no click handling on the rgb sliders

[Back to main TODO](../../../../../../TODO.md)

# // Presets

# // Features

# // Interactivity

# // Bugs
