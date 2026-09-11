# // Water Cycle

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Monochrome WebGPU rain and water study.
- Rain simulation ported from the three.js WebGPU compute rain example.
- Ocean runtime ported from Row It Alone (WebGPU) and isolated for iteration.
- Rain volume bounds are locked to the water patch x/z bounds.
- Surface disturbance is rendered as water-bound impact ripples.

## // TODO:

- [ ] could we do a mountain or mountain range as a contrast to the ocean?
- [ ] rain that lands on the mountain, runs off it, then lands on an ocean
      below and sinks through that. Not a preset: the probe is `sample(worldXZ)`
      with no height input, so it answers with one surface per column and a drop
      cannot pass one to meet another beneath it, and in forward time a detached
      drop never re-catches. Needs `sample(worldXZ, fromY)` returning the nearest
      surface below the drop plus its layer, both surfaces mounted with their
      probes composed, the clinging layer carried in the state channel, and
      forward-time re-catch behind a uniform.

## // Presets

## // Features

## // Interactivity

## // Bugs
