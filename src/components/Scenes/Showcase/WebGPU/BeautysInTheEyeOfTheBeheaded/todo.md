# // Beauty's in the eye of the beheaded

# // Intent / Use Cases

- The scene includes a ground plane that uses the wood table diff and displacement map as a texture
- The scene includes the skull model, no mandible, no teeth.
- The scene includes 2 of the Femur model
- The skull and bones are placed in a skull and crossbones formation on the floor
- The scene uses the stained glass memento mori image on a light projector to emulate light passing through a window and being cast onto the skull and bones. This is the second time using a light projector, which should be based on dev/examples/three.js/examples/webgpu_lights_projector.html. Lets ensure the light projector is built like the example, then lets refactor into a resuable componet that can be used in both Surrender's MoonlightProjector, and this scene's stained glass projector.

- The scene is broken down into it's smallest memoizable components to prevent unessecary rerenders
- child components live in ./components
- hooks life in ./hooks
- utility functions can be added to one or more util files in ./utils

- Control structure
  - Beauty's In The Eye Of The Beheaded
    - Scene
      - Lighting
        - Ambient (uncertain if this is needed)
        - Spot (uncertain if this is needed)
        - Key (uncertain if this is needed)
        - Projector
    - Skull
      - Position
      - Rotation
    - Left Femur
      - Position
      - Rotation
    - Left Femur
      - Position
      - Rotation

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Presets

# // Features

# // Interactivity

# // Bugs
