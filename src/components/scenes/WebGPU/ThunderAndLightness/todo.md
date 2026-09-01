# // Thunder And Lightness

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

## // TODO:

- [x] scene setting doesnt look like black rain. need to fix. should have the black/white gradient room, and the spot light in the center.
- [x] reapproach the appearance of the particles. the goal for this scene is that the particles look like hyper-realistic sand, but keep the blue-grey color pallette. right now particles look like blurry dots. we want grains of sand. can also use `~/dev/examples/Sketches/experiments/swirling` as example
- [x] impact flyoff and impact ring look like separate particle systems and styles than lightning, should all be one look. can also use `~/dev/examples/Sketches/experiments/swirling` as example of a great "ring with fly off"
- [x] impact ring, and ejected particle timing looks wrong. it should be when the bolt touches the ground.
- [x] impact ring and ejected particles look like they move at different speeds than the lighting system. reminder: this should all be one system of particles that look and behave the same
- [x] particles still dont look like sand, but keep becoming more and more spherical. lets make them skiny cubes
- [x] I asked you to keep the blue grey color pallete and you marked it complete, but the particles are all brown and yellow. why didnt you fix?
- [x] scale is all off. if this is lightning it is supposed to be quite tall, that would make these cubes ENORMOUS and not at all like sand, flyoff appears to explode the full height of the lightning, the ring expands like crazy huge too. we need to do more, finer particles for that sand look like `swirling`
- [ ] impact ring and flyoff does not look like the provided `swirling` example above.
- [x] the flash of light now only travels back up the lightning, used to go up then back down.
- [x] the lightning seems to slowly reach out and touch the ground, wait a second then explode quickly and light flash quickly. all the speeds should be about the same, for a smooth animation, like we are seeing a real lightning strike, in slowmotion, presented to us through some futuristic sand powered 3d hologram viewer
- [x] given the point above we may want a layer of 'sand' on the floor as well. something that could also get disturbed by the force of the impact
- [x] dont see a lightning bolt any more.
- [x] dont see impact ring anymore.
- [x] sand from the impact is still being thrown as high as the full lightning bolt, its supposed to be shorter and more sublte, like a smokey emission, similar to the `swirling` example i keep imploring you to use as a basis for this
- [x] make sure particles cast/receive shadow
- [x] make sure floor particles are above the floor plane enough to cast shadow on it, dense enough to appear as a layer of sand
- [x] add godrays, like windswept
- [x] we need to make sure we're rotating the cubes on all axis to prevent repetitive layout.
- [x] the bloom/brightness of the flash that travels the lightnigng needs work. currently its so bright that its going black in the middle, i can see black squares in the middle of the shine.
- [x] seed, branches, etc should change with every reveal. ambient particles should be static configuration between strikes

- [ ] the lightning bolt reveal speed is currently looking really good but we need to speed up and improve the post-contact flash.  how can we make the flashing behaviour more realistic? faster? multiple up-down passes? a phase with a strong hold before fading?

- [ ] is there a noise pattern used to distribute the grains within that circle on the floor? if so could i get a control for it?

- [ ] im also wondering if theres a way we can subtly shift that noise with each impact to further sell the idea that the impact is distributing grains and the falling bolt grains are accumulating?

- [ ] should we leave the ejected particles where they lie instead of having them move back to origin, to further sell the illusions?

## // Presets

## // Features

## // Interactivity

## // Bugs

- [x] the lighting bolts shadow is visible before it is revealed, god rays also reaveal it early too.
- [x] right now it looks like a wipe reveal of an existing structure, instead it should reveal itself one voxel at a time, until it branches, at which point the branch should also start revealing one voxel at a time. feels like in real life the branches would be searching and moving at the same rate as the main bolt.
- [x] lightning particles are transparent? shouldnt be.
- [x] impact ring is shooting down? it still also looks nothing like `~/dev/examples/Sketches/experiments/swirling`. why not?
- [x] layer of sand above floor is way too sparse. it looks like scattered particles when i asked for a layer of sand. thinking a dense layer like in `https://www.instagram.com/reel/DZcsDRJslMY/?utm_source=ig_web_copy_link&igsi=MzRlODBiNWFlZA==`
- [x] the overall motion design is fucking garbage.
- [x] shadows pop in and out of visiblity, and not in accordance with lightning visibility.
- [x] ejected particles are visible as a clump at the bottom, theyre supposed to get through up from the layer of sand.
- [x] lightning pops into existence instead of a particle by particle, reveal.

- [ ] Sand floor appears to be about halfway through the floor of the studio. should be above the studio floor by about the same depth as the sand is, in order to cast shadows, godrays
