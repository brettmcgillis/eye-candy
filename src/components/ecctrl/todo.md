// Easy

- [ ] Now that we have both CharacterController scenes up and running, can we share code/hooks/etc between scenes and reduce some of the harmonization we're having to do now?

- [ ] Ecctrl needs to know character stats/details. Character has unique stats with regards to size, speed, jump, etc. Therefore scene graph might need to be something like this:
  - Experience
    - useCharacter(); (returns relavant settings & Character component)
    - <ecctrl {...useCharacterValue.CurrentEcctrlProps}>
      - <useCharacterValue.CurrentCharacterComponent>

- [ ] Add spheres to the experience that we can push around.
- [ ] Add boundaries so its not infinite space.
- [ ] Should/can we instance shotcubes?
- [ ] Should we have a shotcube reset button to clear them
- [ ] Should we have a game reset button for when physics goes nuts
- [ ] Cleanup/Organize/Order controls, all folders collapsed

// Medium

- [ ]

// Harder

- [ ] fix ghost: we need to tune ghost's colliders and/or capsule size. need colliders for hand positions and head. ideally we can configure things such that we can update shots mode to support shotcube & shotsphere, where shotsphere can get passed throught to ghost; if i shoot a sphere at ghost i should see his cloth react.

- [ ] fix seal: replace single capsule with multiple tuned colliders (main body rounded box + flipper colliders) to match Example Character pattern

- [ ] fix ghost: wind/movement animation, should work like in ghostBuster.
- [ ] fix ghost: wire up animations to key presses

- [ ] the ecctrl/example/characterModel displays a trail effect when the character moves. could we create something similar for Seal that makes it look like its leaving a water/wetness trail? Is there something we could do for ghost too (would need to be webgpu)?

// Hardest

- [ ] add an npc
- [ ] come up with good materials presets for joysticks
- [ ] make shot cube a sphere + collider w/ ghost
- [ ] every good game has double jump
- [ ] swim/fly mode

- [ ] fix ghost. should be able to chose any skin we have in GhostBuster when the character is selected. Extract ghostbuster presets to scene+ghost pairs. move ghost presets into ghost character folder.
