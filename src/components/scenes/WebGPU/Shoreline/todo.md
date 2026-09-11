# // Shoreline

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Swell rolling onto a rocky shelf and breaking, in real 3D rather than a top-down field: a baked bathymetry drives a shallow-water solve, and the foam it throws is its own advected field.
- Reference: aerial footage of surf over dark rock, where the foam networks read almost like a reaction-diffusion pattern.

## // TODO:

- [ ] Spray and airborne droplets at breaking cells — the solver already computes the breaking term the spawner would read.
- [ ] Wet-sheen memory on the rock: the waterline is a static height ramp right now, so a wave that ran up does not leave the rock dark behind it.
- [ ] The virtual-pipe solve resolves the swell but nothing shorter than a cell (~0.5m). Fine detail is analytic ripples in the water material, not simulation.
- [ ] Shore controls rebake the bed and reflood the solver, which drops the current wave state. Consider rebaking without a reflood.
- [ ] Wave-maker directionality, so the swell can arrive at an angle to the shore.
- [ ] Enable a mode where attributes of the swell, surf, foam, etc all fluctuate over time. Im imagining the way a real beach would change over the course of 24 hours as tides rise and fall, wind changes direction, ships pass by, etc. Combine this with the mode below for maximum compelling scene to just watch. Combine these two modes with the interactive mode(s) for head exploding sickness
- [ ] Enable a mode where the Tide is reshaping the shore and the sea stacks like a realistic beach front.
- [ ] with controls pushed hard tides can come in with a bit of a vertical wall, are we able to get that to curl over like a real wave?
- [ ] Set up presets to show the extremes to make testing faster. many stacks vs none, straight wave vs coming in at angle, big waves with lots of range vs small waves with little, natural waves/foam vs art directed R/D waves/foam etc
- [ ] Petri bloom preset looks very Reaction Diffusion. might want to add the controls for that so we can have the full look, and find ways for the waves to drive it. I played with the existing controls and was able to get a field of thick blobby R/D lines, but it might be nice to be able to go thinner. Im also thinking theres probably a really good subtle variation where the shorline is silhouetted with the R/D lines and they peter out into dots etc as we get further from shore. I fucked with min/max on lace scale but couldnt quite get it and didnt have time to spend
- [ ] when the scene starts the water is still and flat. we should consider either pre-waving up the particles, OR, have the scene start with just shore and the waves come in from teh back bounds to populate the field.

## // Presets

## // Features

## // Interactivity

- [ ] click and drag to move sand
- [ ] click and drag to move water
- [ ] click and drag to reshape sea stacks
- [ ] click to deposit sand/sea stacks

## // Bugs

- [ ] sea stacks are too tall and lack variation in shape and size
- [ ] sometimes water level pulls back far enough that we can see wet sand underneath the water but its darkness makes it look like theres nothing there. need more contrast between them and the scene background color. Manually tune the colors using the available controls.
