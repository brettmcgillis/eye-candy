# // Staying Afloat

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene has a white background.
- The scene contains an isometric view of a transparent column of water. The water column is segmented by depth with a lighter blue used in the top section of the column and darker blue in the bottom.
- The scene contains a life preserver floating atop the water
- The scene contains a hammerhead shark in the water
- The scene contains a tiger shark in the water
- The sharks are animated to swim using the animations in the model
- The sharks should be fur\ther animated such that they are circling.

- Ocean Scene Example - Great example of a skybox w/controls for sky appearance. Realistic water appearance with no mouse or surrounding mesh interactivty.
- Interactive Water Plane Example - Great example of a water-like plane. Unrealistic water appearance. Cartoonish water waves with mouse interaction (and potentially programmatic interacion). Good interaction with surrounding meshes (ducks)

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] Add scene controls
  - Staying Afloat
    - Scene
      - Background
      - Lighting
      - Camera dropdown
        - Options: Fixed, Orbit
    - Water
      - Water Props Controls
    - Sharks
      - HammerHead
        - Visiblity
        - Scale
        - Speed
        - Path
          - Spline visibility
      - TigerShark 1
        - Visiblity
        - Scale
        - Speed
        - Path
          - Spline visibility
      - TigerShark 3
        - Visiblity
        - Scale
        - Speed
        - Path
          - Spline visibility

- [x] Move controls out of scene into controls hook in /hooks
- [x] Break the scene down in to memoized child components where it makes sense and store in /components

# // Presets

# // Features

# // Interactivity

- [ ] Water Surface/Cursor interaction
- [ ] Water Surface/Cursor/Hands interaction

# // Bugs

- [x] Scale tiger shark down to size of hammerhead
- [x] Scale life preserver down
- [x] Remove tiger shark attack animation
- [x] Fix shark orientations while following curve. they seem to be rotating in the opposite direction they are travelling.
- [x] Slow down how fast sharks follow the curve
- [x] Try to stagger movement so they are circling, opposing eachother.
- [x] Fix life preserver flotation. It should be riding the water, reacting to the shape of it. Right now it appears to be just bobbing up and down independent of the water.
- [ ] Can we improve the shark swim animation by bending the model along the curve the shark follows? This would help with the weird rounding-the-corner look they get now sometimes. I dont want the sharks banking the turns. I want them following the curve like a roller coaster. I want the shark bodies to behave like a set of chain links as oppossted to a rigid line right now.
- [ ] Fix water. should have 3 layers, currently only has 2. Might need to add meshes inside the column, since we only want 1 outline, but 3 column sections
