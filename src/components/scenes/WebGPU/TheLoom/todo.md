# // TheLoom

# // TODO:

[Back to main TODO](../../../../../TODO.md)

- [ ] Add presets folder with default cloth configurations
- [ ] Add texture support via Leva controls
- [ ] Answer: Should the sphere be a part of the cloth mesh component? Is there a better way to handle this?
- [ ] Answer: Should the wind be a part of the cloth mesh component? Is there a better way to handle this?
- [ ] Answer: Should all the features be one cloth mesh component? Is there a better way to accomplish this? A base component and stylized exports?

# // Intent/Use Cases

- WebGPU cloth simulation test bed using ClothMesh

# // Presets

- [ ] One preset for each cloth variation we develop

# // Features

- The sim needs to stay performant. Its great now, and we need to do our best not to degrade it.
- I need cloth with different shape than just rectangle. ex, notched ribbon for stay hunted ===<
- I need cloth with holes in it, ie eye holes for ghosts. If we can do real holes in the cloth/sim without the apparance of triangles thats great, otherwise we might need to go the route of transparency. If we do transparency we can get rid of the edge tatter/holes system, as it currently looks bad (triangles visble everywhere)
- I need cloth with pin locations other than the edge. ex pin center of cloth to top of sphere for ghosts. We may even be able to improve Surrender if we can pin the flag at the coords of the rings instead of just the full edge.
- I need a rope. What is a rope if not a very long, skinny cloth. Surrender could use a couple strands of rope connecting the flag to the pole for realism.

# // Bugs
