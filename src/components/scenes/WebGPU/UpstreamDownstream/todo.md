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
- [ ] A mode where discharge walks over a long cycle the way Shoreline's tide
      does, so the bars go under and come back out while the scene runs.
- [ ] Interactive mode: drop a rock in and watch the wake form.

## // Presets

- Riffle Run -- the default. One pool-riffle couplet in frame at moderate flow.
- Spring Melt -- the reach running full, riffles drowned into a standing train.
- Low Summer -- thin water, glassy pools, gravel reading straight through.
- Braid Lace -- the foam reaction pushed past what the water would sustain.

## // Features

## // Interactivity

- [ ] click and drag to move gravel
- [ ] click to drop a boulder into the flow
- [ ] click and drag to dam or divert the channel

## // Bugs
