// Easy

- Now that we have both CharacterController scenes up and running, can we share code/hooks/etc between scenes and reduce some of the harmonization we're having to do now?

- Ecctrl needs to know character stats/details. Character has unique stats with regards to size, speed, jump, etc. Therefore scene graph might need to be something like this:
  - Experience
    - useCharacter(); (returns relavant settings & Character component)
    - <ecctrl {...useCharacterValue.CurrentEcctrlProps}>
      - <useCharacterValue.CurrentCharacterComponent>

- [ ] fix ghost: capsule is much taller than character, character should be taller too.

- [ ] fix seal: replace single capsule with multiple tuned colliders (main body rounded box + flipper colliders) to match Example Character pattern

// Medium

// Harder

- [ ] fix ghost: scale. make a bit bigger (1.2x?)
- [ ] fix ghost: wind/movement animation, should work like in ghostBuster.
- [ ] fix ghost: wire up animations to key presses

- [ ] fix seal:activate animation while moving

- [ ] the ecctrl/example/characterModel displays a trail effect when the character moves. could we create something similar for Seal that makes it look like its leaving a water trail?

// Hardest

- [ ] add an npc
- [ ] come up with good materials presets for joysticks
- [ ] make shot cube a sphere + collider w/ ghost
- [ ] every good game has double jump
- [ ] swim/fly mode
- [ ] fix ghost. should be able to chose any skin we have in GhostBuster when the character is selected. Extract ghostbuster presets to scene+ghost pairs. move ghost presets into ghost character folder.
