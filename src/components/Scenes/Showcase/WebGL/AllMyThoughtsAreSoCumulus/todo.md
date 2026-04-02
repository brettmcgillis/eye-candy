# // All My Thoughts Are So Cumulus

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] add environment for reflections. studio.

- [x] Create an Atomic Halo component in components/elements. A bohr-rutherford style atom. a nucleus clump of spheres with line rings around it representing shells and spheres orbiting the nucleus on the path created by the rings. All rings should be on the same horizontal plane. we should use the typical black, red and white spheres found in molecule models. Should be able to provide an atomic number and get an atom back. Shoulld be able to use props to set things like proton/electron radii, shell-ring line width.
- [x] Add 45lb Halo.
- [x] Add neural network ring halo

- [x] Animation (rotation + wobble, refactor out of record, into reusable code at the scene level to be applied to any halo type)

- [x] Get rid of Lighting Rig
- [x] Add a pixelHater panel in front of one quadrant of the halo!

- [x] Set the default scale of the Record, Rings, Plate, Atomic, and Netowrk to be visually aligned

- [x] Collapse all halos into a single position (matching the current Plate position: [0, 1.5, -1]) and render only one at a time based on the active halo type selection (Rings / Record / Network / Plate / Atomic)
- [x] rename it - All My Thoughts Are So Cumulus
- [x] Move controls out of scene into useSceneControls hook in /hooks folder
- [x] Break scene down into small imemoized componets in the /components folder to prevent rerenders and make componet files small.
- [x] Add a preset for each halo type Default Rings, Gradient Rings, Atomic, Network, Record, Plate, in /presets
- [x] Add Halo Scroll mode to switch between the 6 halo presets we currently have.
- [x] Fix control layout
