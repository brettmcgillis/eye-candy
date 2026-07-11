# // Fireflies

# // Intent / Use Cases

- A standalone scene that leverages multi-brower tab cross-talk and also works as a fullscreen piece. built around the concepts of fireflies, boids, and volumetric lighting
- the scene contains a flock of firefly boids from the floids example, with the option for muliple hunters.
- the scene contains the same visual appearance as the webgpu volume lighting example but instead of just 1 light there are many fireflies.
- the hunters are glossy black spheres that are used to cast shadows in the fog like the teaput in the volume lighting example. and reflect glints light from the fireflies
- the firefly are matte grey spheres that light up when firing.
- the firefly spheres also expand slightly when lighting up.
- in multi-browser mode orbit controls are disabled.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // References

- `~/dev/examples/floids`
- `~/dev/examples/three.js/examples/webgpu_volume_lighting.html`
  - ui settings: 1,12,1,enabled,3,0,2,3
- `~/dev/examples/three.js/examples/webgpu_compute_birds.html`
- `~/dev/examples/three.js/examples/webgpu_lights_clustered.html`

# // Presets

# // Features

- [ ] Floids-inspired two-pass flock simulation with synchronized flash phases
      and a hunter that pursues the nearby flock.
- [ ] Each visible firefly drives its own real point light; WebGPU clustered
      lighting keeps the large reflective hunter responsive to the same state.
- [ ] True ray-marched `VolumeNodeMaterial` atmosphere composited at reduced
      resolution with depth occlusion, dithering, and denoising.
- [ ] A glossy hunter sphere that reflects the firefly lights and casts into
      the volume layer.
- [ ] Restore multi-tab synchronization by publishing window-local hunter and
      pointer inputs.

# // Interactivity

- [x] boids flock to cursor mode
- [x] boids flee from cursor mode
- [ ] multi-browsertab mode. Each window gets a hunter. Hunters and fireflies
      are confined to window bounds and may traverse overlaps.

# // Bugs

- scene is fucked. might need to pull out volumetric lighting etc. we really want to focus on the stylized floids and hunters & the multitab experience.
