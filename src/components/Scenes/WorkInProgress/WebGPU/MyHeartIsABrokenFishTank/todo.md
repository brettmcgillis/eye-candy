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

- [ ] Tune fish and tank scales against the authored assets once the scene is in active development
- [ ] Tank and table physics now use approximate hull/cuboid colliders rather than hand-authored collider volumes
- [ ] Spill remains a table-aware height-field surface and does not yet react to rigid-body rocks or glass fragments
