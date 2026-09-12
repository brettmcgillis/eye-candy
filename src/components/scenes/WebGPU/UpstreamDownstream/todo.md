# // Upstream/Downstream

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Companion scene to Shoreline, over the same engine: a reach of stream running
  downhill instead of a swell running onto rock. The grain bed becomes the
  stream bed and its banks, the sea stacks become water-worn boulders and
  cobbles standing in the flow, and the water arrives at the top of the frame
  and leaves at the bottom rather than arriving as waves.
- The whitewater is not art-directed. Pool-riffle structure in the baked bed
  makes the flow go supercritical over each bar, and the solver's Froude term
  finds that on its own -- the same hydraulic jump that puts a bore face on
  Shoreline's shelf.

## // TODO:

- [ ] Spray and airborne droplets where the flow breaks over a boulder.
- [ ] Grains that reach the outfall park against the edge until their cycle
      turns over. Wrapping them back to the inflow instead would keep the reach
      evenly covered at high flow, at the cost of a teleport to hide.
- [ ] A bank that a surge overtopped does not stay dark once the water drops:
      wetness memory is per-grain and short.
- [ ] Undercut banks and overhanging root mats: the bank profile is a single
      rising exponent, so it cannot go vertical or negative.
- [ ] Fallen timber across the channel -- the strainer that makes a real stream
      read as a place rather than a channel.
- [ ] Woody debris and leaf litter carried by the flow, caught against boulders.
- [ ] should we be using sprites instead of cubes, like we see in `~/dev/examples/dli-flow`, if so build this into the grains/sand module and share with Shoreline

## // Presets

Named by the axis they move. Everything after the default is a pair that moves
ONE axis and holds the rest at the default, so the two halves can be flipped
between to see what that axis does and nothing else. Drift is off in all of
them, because a preset that is wandering cannot be compared against anything.

- Riffle Run -- the default, and what every pair below is read against.
- Flow: High / Flow: Low
- Rocks: Many / Rocks: None
- Bends: Tight / Bends: Straight
- Gradient: Steep / Gradient: Flat -- both move the datum, so both reflood.
- Foam: Art Directed / Foam: Natural
- Mode: Drifting / Mode: Reshaping -- the two things the scene does on its own,
  each turned up far enough to be seen inside a minute.

## // Features

- Drift: discharge, surge, friction and the foam terms all walk on their own
  long cycles, so the bars go under and come back out while the scene runs.
- Reshape: the flow moves the bed it is running over. Transport capacity from
  the solver's own speed and bed slope, sediment advected downstream, and the
  bake's facet noise doubling as a hardness map.
- Sculpt: four brushes over the domain -- deposit, scour, push ground, push
  water. Strokes land on the baked bed, so a channel slider still overrules
  them.

## // Interactivity

## // Bugs
