# // MyHeartIsABrokenFishTank

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] Scaffold placeholder scene
- [x] Wire deterministic presets and camera modes
- [x] Register scene for visual testing
- [x] Add clickable front-pane break and drain prototype
- [x] Replace placeholder tank shell with authored tank asset composition
- [x] Add pane fracture prototype using the authored glass meshes
- [x] Add spill/drain boundary opening prototype
- [x] Add fish state transitions for draining and stranding
- [x] Replace spill/drain prototype with a dynamic fluid domain simulation
- [ ] water spill on table shoud be more circular and less square to be more puddle like.
- [ ] Add overlay buttons to reset scene
- [ ] user interaction with water. see dev/examples/three.js -> examples -> webgpu_compute_particles_fluid
- [ ] add click+drag to move rocks & broken glass, like in dumpsterfire. still support ricochet, like dumpsterfire
- [ ] fix fish animation looks bad.
- [ ] update scene to create unique breaks each time scene loads or scene is reset. Make this easy to disable in code incase I want to make a video thats consistent.
- [ ] use the updated, animated GoldFish component and model.
- [ ] fix debug water bounds. cant see water when enabled.
- [ ] Can we prevent particles from spilling before glass breaks?
- [ ] wtf is going on wth the coral in the tank. looks black from most angles, until suddenly it becomes colored at some angle.

# // Intent/Use Cases

- Fish tank on a flat surface
- Deterministic preset-driven visual testing
- WebGPU-only scene scaffold for fracture + fluid + fish systems

# // Presets

- [ ] Default
- [ ] Orbit
- [ ] Operator
- [ ] Debug

# // Features

- [x] Fixed / Orbit / Operator camera modes
- [x] Preset query sync + preset reset
- [x] Debug visibility toggles in Leva
- [x] Authored FishTank asset shell using real pane meshes as break surfaces
- [x] Free-aim rock projectile pool with pane ray-hit targeting and scene-surface collisions
- [x] Three-pinata pane fracture on pane impact
- [x] Fixed hull colliders on the non-breakable tank shell and finite table slab
- [x] Rapier rigid-body glass fragments with floor collision and pile-up
- [x] Dynamic table-aware fluid spill domain with edge drain and tank-base masking
- [x] Rapier rigid-body rock aftermath with bounce, roll, and accumulation
- [x] Fish stranding and flopping transitions
- [x] Runtime reset rebuild for a full fracture + fluid simulation state

# // Bugs

- [ ] Tune fish and tank scales. tank bigger. fish much bigger
- [ ] Tank and table physics now use approximate hull/cuboid colliders rather than hand-authored collider volumes
- [ ] Spill remains a table-aware height-field surface and does not yet react to rigid-body rocks or glass fragments
