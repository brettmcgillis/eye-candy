# // RorschachCLI

[Back to main TODO](../../../../TODO.md)

## // Intent / Use Cases

Generate images and video using the RorschachCLI.

## // TODO:

- [ ] tidy up control area and make sure theyre well organized. make sure each section is wrapped in closure to enable minimal clutter
- [ ] lets make sure control UI's are aligned between scene and dev page
- [ ] ensure we can support pinning any prop. I want to be able to generate 100 rolls of preset 012, including its overridden bundle
- [ ] how can we maximize performance when rendering? we should probably limit the number of concurrent jobs. what about ink animations? how do we speed those up?
- [ ] When previewing a Test allow me to regen a new test starting with / prepoulating the form with the exact same params. this would allow me to identify cool tests and then regen them in new color schemes, go from png to svg, go from iphone to square, change dimensions, etc.
- [ ] When previewing a test allow me to click abutton and be taken to the rorschach scene with all the image's json props applied. This would allow me to go from a still to it's 3d representation
- [ ] allow me to create a video from a set of stills. since we have the json we could go from one or more stills to a growth video.
- [ ] can we enable shadows on the membrane layers so things can look a bit more dramatic?
- [ ] 3d lines (tubes) mode to extend lines mode
- [ ] explore dramatic lighting
- [ ] I've seen a bunch of letter A's get generated... could we get the whole alphabet? would make for a sick stills video

## // Features

- Phase 3: Points mode — same trajectory data as an alt render mode (GPU point cloud, likely a TSL compute migration for density), plus the `mode` toggle control. we will want to do something interesting with the points here but im uncertain where to go. are the particles circle, square, noisy transparency? do they move along the line created by the system or are they stationary? if theyre stationary is there a wave of noise that travels down the line slightly pushing them out of the way as it moves past their location on the line?

- Phase 4: marching cubes & 3d geometry. could we use the existing logic to create organic 3d geometry ala persancte? this may be bleeding into the intent for Fauna CLI.

## // Bugs
