# // Windswept

# // Intent / Use Cases

- the scene is centered around particles & attractors through the lens of windswept leaves.
- the scene contains two modes, strage attractors and physical attractors
- when in the strange attractors mode the scene starts with a strage attractor function like in particleLab, then draws field lines for that attractor, next a particle system of catoon leaves & cartoon sakura (gltf models in repo) is made to follow the same equation. start with Thomas Labrynth (b 0.1, dt 0.1). make it easy to add more.
- when in physical attractors mode there are attractors in the scene effecting the particle system. if possible field lines as well.
- when in physical attractors mode we allow for showing and hiding the attractors. when attractors are shown we allow rotating and translating them.
- when in physical attractors mode the user can enable a leva control to animate the attractors.
  - I was playing with three.js example `webgpu_tsl_compute_attractors_particles.html` and simply slowly rotating the attractor on a single axis induced beautiful changes into the system. this example is essentially the Gravity Attractors preset of ParticleLab but written in TSL. We should take this approach for the sake of perf for sure.
- the scene contains a light and godrays in the center which the particles flow araound, their geometry casting shadows like three.js example `webgpu_postprocessing_godrays.html`
- the scene will eventually contain an interactive tree in the center. Id like to do some kind of procedurally generated cherry tree. craggly and curved. see `~dev/examples/ez-tree` for great tree generation. I was able to push the demo hard and get a bonsai looking tree. Id use this directly but blowing leaves/branches arent supported in webgpu, nor are custom leaves. see `~dev/examples/VegetationGeneratorThreeJS` for interactive tree
- the scene will contain a patch of mossy cracked soil, see `~dev/examples/GrassSystemThreeJS`
- the scene will contain flowing vines all over the ground. Vines will spawn, travel, bloom, then fade. see `~dev/examples/VegetationGeneratorThreeJS` for vines.
  - When building this feature in we will build in an leva control that allows the user to be able to toggle between cursor-branch interaction and a draw mode where they can draw vines on the ground and the trunk and branches of the tree.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Presets

# // Features

# // Interactivity

# // Bugs
