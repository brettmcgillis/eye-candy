# // Weightless

# // Intent / Use Cases

Particle hummingbird. The animated hummingbird rig drives a WebGPU compute
sim: bind-pose surface samples (+ BVH interior fill) carry skin weights, and
every particle's home point is re-skinned on GPU against the live bone
matrices each frame. Bound particles swirl on/within the bird's volume with
curl noise (gpu-party style); fast-moving home points (wing tips / feathers)
shed particles that inherit wing velocity, fly free under curl noise +
pointer attractor, fade, and rebind. Afterimage post is toggleable.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] bird hover animation has a few ms of stationary hover before moving up and down. can we skip this when looping? (not attempted — needs visual inspection of the clip's loop point to trim safely, can't verify blind)
- [ ] what about the bee!?
- [ ] butterfly might be a great candidate for surface curl
- [ ] dragon fly
- [ ] black goldfish

# // Presets

# // Features

# // Interactivity

- [ ] Pointer-curl trail interaction

# // Bugs

- [ ] field lines seem to be attached to bird. shouldnt be.
- [ ] internal lines still seem to go out of bounds of bird, may need to limit to mesh of n-volume,
- [ ] Control folder structure seems haphazard and disorganized.
- [ ] Pointer interactions still doesnt work.
