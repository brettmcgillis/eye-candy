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
- [x] Add scene controls
  - Still Pulling For You
    - Presets
      - Dropdown
        - Options:
          - Rough Waters:
            - Water is very wavy
            - boat is properly oriented
            - boat is floating on the water.
            - smoke visible
            - seafloor hidden
            - cabin, headlights on
          - Still Pulling
            - Water is very wavy
            - boat is fixed position, nose up, half sunk
            - smoke visible
            - cabin, headlights flickering on/off
            - seafloor hidden
          - Sunk
            - water is calm
            - boat is fixed position at the bottom of the column
            - smoke hidden
            - cabin, headlights flickering on/off
            - seafloor visible
      - Copy
      - Reset
    - Scene
      - Background color
      - Lighting
      - Camera dropdown
        - Options: Fixed, Orbit
    - Tugboat
      - Mode Dropdown
        - Options: Fixed, Floating
      - Position (for fixed mode)
      - Scale
      - Rotation
    - Smoke
      - visibility
      - Position
      - Scale
      - Rotation
      - Smoke controls
    - Water
      - Controls for water props
    - Seafloor
      - visibility
      - color
      - appearance

# // Features

# // Bugs

- [x] Fix camera angle, cant see boat or most of water volume
- [x] Fix boat. Dont bob up & down, stay fixed position
- [x] Fix ocean floor. Currently its a bumpy plane, but this doesnt look right as it doesnt align with the bttom of the water column. I think I need another NURBS component like the water column, dirt column.
