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
- [x] Update scene controls
- [x] Add some post processing bloom. Maybe selective bloom on the cabin and headlights?
- [x] Add some animation to the light states.
- [ ] Add a few attractors to the scene and animate their position
  - Rough waters - Quick movement, like stormy winds.
  - Still Pulling - slower, reduced movement
  - Sunk - Off. no smoke at this setting

# // Presets

- [x] Still Pulling - Calm seas, smoke flowing
- [x] Rough Waters - Stormy, aggressive smoke
- [x] Sunk - No smoke

# // Features

# // Interactivity

- [ ] Smoke/Cursor interaction
- [ ] Smoke/Cursor/Hands interaction

- [x] Water Surface/Cursor interaction
- [ ] Water Surface/Cursor/Hands interaction

# // Bugs
