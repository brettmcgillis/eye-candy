# // SplineEditor

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- I need a tool that I can use to build curves to export for use in scenes
- I want to be able to build/visualize camera paths.
- I want to be able to build visualize particle paths.
- I want to be able to create splines that start/end at the same point creating a loop.
- I have multiple scenes I would like to build that involve smoke(particles) flowing along a curve and want to be able to build those curves easily

- Lets start with the example from Three and work from there.
- scene currently includes grid floor. lets make sure to add grid walls and ceiling too. make material only on the inside, so as not to obstruct camera view, but provide spatial reference.
- I may want leva controls for the xyz position of each point for fine tuning.
- I may want a way to select a point and use keyboard arrows to move, factoring in the camera's view position.
- I will want our typical presets/reset preset/copy preset controls so I can "save" difficult splines and work on them over time.
- I will want a way to pin the camera position to a given axis, such that I can create 2d splines.

# // Presets

# // Features

- [ ] Grid snapping control.
- [ ] Add a mode for testing spline with a camera. Not sure how to handle this.
  - have control to loop camera motion. on closed loop just keep going. on unclosed spline i want option to go start-finish-back to start OR start-finish-camera snaps back to start.
  - when camera motion is not looped mode just go start-finish.
  - might want to enable a camera mode where it traverses the spline and 'look at' 0,0,0.
  - might want a first person mode where i can look around but cam follows path.
  - might want a controlled mode. ie on scroll or move traverse the spline fforwardwd/backwarsd
  - In 'camera' mode include a geometry w/ transform control to set the location to look at.
- [x] Refactor to allow editing multiple splines. They can use the same Spline settings, but i want to be able to add remove points from each spline so i can edit multiple in parrallel. When I export i want to get all splines in an array.
- Actions Folder
  - Add Spline button
  - Remove Spline button
  - Export spline(s) button

When a spline is added, create a new leva folder "Spline x". Inside spline X folder, add point, remove point.

# // Bugs
