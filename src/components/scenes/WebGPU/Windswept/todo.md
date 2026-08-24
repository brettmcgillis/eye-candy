# // Windswept

# // Intent / Use Cases

- the scene is centered around particles & attractors through the lens of windswept leaves.
- the scene contains two modes, strage attractors and physical attractors
- when in the strange attractors mode the scene starts with a strage attractor function like in particleLab, then draws field lines for that attractor, next a particle system of catoon leaves & cartoon sakura (gltf models in repo) is made to follow the same equation. start with Thomas Labrynth (b 0.1, dt 0.1). make it easy to add more.
- when in physical attractors mode there are attractors in the scene effecting the particle system. if possible field lines as well.
- when in physical attractors mode we allow for showing and hiding the attractors. when attractors are shown we allow rotating and translating them.
- when in physical attractors mode the user can enable a leva control to animate the attractors.
- the scene will contain flowing vines all over the ground. Vines will spawn, travel, bloom, then fade. see `~dev/examples/VegetationGeneratorThreeJS` for vines.
  - When building this feature in we will build in an leva control that allows the user to be able to toggle between cursor-branch interaction and a draw mode where they can draw vines on the ground and the trunk and branches of the tree.

# // TODO:

[Back to main TODO](../../../../../TODO.md)

- create a preset with three attractor systems/leafswams at various points on the tree. leva controls to govern position, swarm size per attractor, field lines per attractor, attractor type, attractor simulation props, attractor group rotation. can each attractor have a god ray light too, or are we
  limited to 1? perf impact on n?

- tidy up leva controls. make sure to only show controls for selected attractor(s), limit label length.

- test out multiple godray lights
- see if we can incorporate techniques from webgpu_volume_lighting_traa & webgpu_volume_perlin to create multicolored godrays

# // Presets

# // Features

# // Interactivity

# // Bugs
