# // Still Pulling For You

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene features a steam tug boat sinking in the water, as steam emerges from the smoke stack.
- The scene has a white background.
- The scene includes a tugboat model positioned in the center with the nose up in the air and half of the ship submerged.
- The scene includes a smoke system emerging from the smoke stack and rising up symbolizing the ship still running.
- The scene includes water and waves surrounding the tugboat.
- The scene uses some shader to stylize the look of the water
- The scene uses some shader to modify the height of the water over time to illustrate waves moving around the boat.
- The scene uses some geometry witha a transparent material to represent a volume of water

- Ocean Scene Example - Great example of a skybox w/controls for sky appearance. Realistic water appearance with no mouse or surrounding mesh interactivty.
- Interactive Water Plane Example - Great example of a water-like plane. Unrealistic water appearance. Cartoonish water waves with mouse interaction (and potentially programmatic interacion). Good interaction with surrounding meshes (ducks)

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] Add smoke from smokestack
- [x] Add pointlight at "headlight" and in cabin.
- [x] Add a bumpy seafloor plane.
- [x] Add a mode for the boat to float with the water. Boat should be reacting to water, and not just bobbing freely.
- [x] Add orbit controls for debug
- [x] Move controls out of scene into controls hook in /hooks
- [x] Break the scene down in to memoized child components where it makes sense and store in /components
- [x] Add default settings and presets to presets.jsx
- [ ] Update scene controls
  - Smoke
    - visiblity
    - Remove group pos, rot, scale
    - Spline actions
      - edit toggle, when enabled show spline & spline points for editing.
      - add spline
      - export splines
    - Spline N
      - name
      - type dropdown
      - volume mesh
      - particle settings folder
      - volumetric settings folder
      - Config folder - leave as is
      - actions folder - leave as is

- [ ] Add some post processing bloom. Maybe selective bloom on the cabin and headlights?
- [ ] Add some animation to the light states.
  - Rough Waters - no animation
  - Still Pulling - Quick flickering, mostly on, but shorting due to taking on water
  - Sunk - Slow flickering, mostly off/very low due to being sunk
- [ ] Add a few attractors to the scene and animate their position
  - Rough waters - Quick movement, like stormy winds.
  - Still Pulling - slower, reduced movement
  - Sunk - Off. no smoke at this setting

# // Features

# // Bugs

- [x] Fix camera angle, cant see boat or most of water volume
- [x] Fix boat. Dont bob up & down, stay fixed position
- [x] Fix ocean floor. Currently its a bumpy plane, but this doesnt look right as it doesnt align with the bttom of the water column. I think I need another NURBS component like the water column, dirt column.
