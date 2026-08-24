# // FightingFish

# // Intent / Use Cases

- A standalone scene that leverages multi-brower tab cross-talk and also works as a fullscreen piece. built around the concepts of fish, boids, volumetric lighting, and caustics.
- the scene contains an element through which light shines and casts caustics
- the scene contains a school of betta fish from the floids example, where each fish is a hunter and a boid, hunting other fish and also fleeing them too.
- the scene contains the same visual appearance as the webgpu volume caustics example.
- in multi-browser mode orbit controls are disabled.
- we have several animated fish models locally available, but to support turning animations may need to use curve modifier

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // References

- `~/dev/examples/floids`
- `~/dev/examples/three.js/examples/webgpu_volume_caustics.html`
  - ui settings: 1,rgb(188,198,251)
- `~/dev/examples/three.js/examples/webgpu_modifier_curve.html`
- `~/dev/examples/three.js/examples/webgpu_compute_birds.html`

# // Presets

# // Features

# // Interactivity

- [ ] fish flock to cursor mode
- [ ] fish flee from cursor mode
- [ ] multi-browsertab mode. each window gets a fish. fish are confined to the bounds of the windows like we see with water in the CrossTalk Waterworks preset and can roam further when there are overlapping tabs.

# // Bugs
