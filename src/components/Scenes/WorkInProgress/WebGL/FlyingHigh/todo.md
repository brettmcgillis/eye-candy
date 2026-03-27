# // Flying High (with both engines on fire)

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene features our 747 model in front of an oval panel colored sky blue and with a painterly shader applied to make the edges appear painted with a brush.
- The scene has a white background.
- The scene features a few drei clouds to futher the illusion of flying,.
- The scene contains some volumetric fire emerging from the engines and wrapping back around the wings as if being pushed by the momentum of the flight
- The scene contains a smoke system emerging from the engines and flames.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] Tune Smoke + fire
- [ ] Update cloud appearance so they stick out more as objects in the scene
- [ ] Add scene controls
  - Flying High
    - Scene
      - Background
      - lighting
    - Sky
      - controls for sky plane appearance
      - controls for sky plane shader
    - Plane
      - Scale
      - Position
      - Rotation
    - Clouds
      - Cloud N
        - Scale
        - Position
        - Rotation
        - Cloud Props

- [ ] Move controls out of scene into controls hook in /hooks
- [ ] Break the scene down in to memoized child components where it makes sense and store in /components

# // Features

# // Bugs

- [x] Fix Sky panel. Make plane an oval that fades at the edges
- [x] Fix shader on blue sky plane. Make it look better, more painterly, use watercolor shader example
