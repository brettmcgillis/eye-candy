# All My Friends Are Ghosts

# // Intent / Use Cases

- Ghost figures made from cloth draped over sphere geometries using WebGPU cloth simulation

# // TODO:

[Back to main TODO](../../../../../TODO.md)

- [x] Ghost body shape — cloth pinned at center-top, draped over a sphere like the Ghost preset in TheLoom
- [x] Eye holes using tatter/holes in cloth or alpha masking
- [x] Multipls ghost instances
- [x] Spooky lighting and atmosphere
- [x] Ghosts movement in a figure 8 with hovering animation
- [x] Mouse interactivity w/ cloth
- [x] Emissive eyes inside the ghost
- [x] Light bloom
- [x] Include sparkles and colors from LoGlow scene
- [x] Reflective floor panel that "fades" into background color like in Burning At Both Ends

# // Presets

- [x] Default - 2 white ghosts travelling in a figure 8 sin-waving up and down as they go
- [x] Retro - 4 ghosts, light pastel pac-man colors, path is composed entirely of right angles, still sin-waving up and down though
- [x] LoGlow - 3 Hot ghosts

# // Features

- [ ] Consider adding "hands" for the ghosts. ie, smaller spheres located lower to the left and right of the main sphere. Could animate "hand movements".

# // Interactivity

- [ ] Ghost/Cursor interaction
- [ ] Ghost/Hands interaction

# // Bugs

- [x] Sparkles are WAY too big even on smallest setting
- [ ] Retro ghosts crash and cloth falls off sphere, cloth pin location should match coords of top of sphere
- [x] Need to make sure ghost paths do not cross.
- [ ] Cloth seems to be rotating around the sphere, may need more pins?
- [x] Eyes should be inside of the sphere making them inside of ghost and lessening the need for exact alignment with eye holes
- [x] Can we have path speed and path direction drive wind strength and direction?
