# // Shoreline

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Swell rolling onto a rocky shelf and breaking, in real 3D rather than a top-down field: a baked bathymetry drives a shallow-water solve, and the foam it throws is its own advected field.
- Reference: aerial footage of surf over dark rock, where the foam networks read almost like a reaction-diffusion pattern.

## // TODO:

- [ ] Spray and airborne droplets at breaking cells — the solver already computes the breaking term the spawner would read.

- [ ] The virtual-pipe solve resolves the swell but nothing shorter than a cell (~0.5m). Fine detail is analytic ripples in the water material, not simulation.
- [ ] Wave-maker directionality, so the swell can arrive at an angle to the shore.
- [ ] with controls pushed hard tides can come in with a bit of a vertical wall, are we able to get that to curl over like a real wave?
- [ ] Petri bloom preset looks very Reaction Diffusion. might want to add the controls for that so we can have the full look, and find ways for the waves to drive it. I played with the existing controls and was able to get a field of thick blobby R/D lines, but it might be nice to be able to go thinner. Im also thinking theres probably a really good subtle variation where the shorline is silhouetted with the R/D lines and they peter out into dots etc as we get further from shore. I fucked with min/max on lace scale but couldnt quite get it and didnt have time to spend
- [ ] when the scene starts the water is still and flat. we should consider either pre-waving up the particles, OR, have the scene start with just shore and the waves come in from teh back bounds to populate the field.
- [ ] should we be using sprites instead of cubes, like we see in `~/dev/examples/dli-flow`, if so build this into the grains/sand module and share with Upstream/Downstream

## // Presets

Named by the axis they move. Everything after the default is a pair that moves
ONE axis and holds the rest at the default, so the two halves can be flipped
between to see what that axis does and nothing else. Drift is off in all of
them, because a preset that is wandering cannot be compared against anything.

- Rock Break -- the default, and what every pair below is read against.
- Swell: Heavy / Swell: Light
- Stacks: Many / Stacks: None
- Angle: Oblique / Angle: Square
- Tide: Big Range / Tide: No Range -- both on the same wide flat apron.
- Foam: Art Directed / Foam: Natural
- Mode: Drifting / Mode: Reshaping -- the two things the scene does on its own,
  each turned up far enough to be seen inside a minute.

## // Features

- Drift: swell height, period, approach, tide range and the foam terms all walk
  on their own long cycles, so the scene runs a day rather than a pose.
- Reshape: the surf moves the bed it is breaking over. Transport capacity from
  the solver's own speed and bed slope, sediment advected with the flow, and
  the bake's facet noise doubling as a hardness map.
- Sculpt: four brushes over the domain -- deposit, scour, push ground, push
  water. Strokes land on the baked bed, so a terrain slider still overrules
  them.

## // Interactivity

## // Bugs

- [ ] sometimes water level pulls back far enough that we can see wet sand underneath the water but its darkness makes it look like theres nothing there. need more contrast between them and the scene background color. Manually tune the colors using the available controls.
