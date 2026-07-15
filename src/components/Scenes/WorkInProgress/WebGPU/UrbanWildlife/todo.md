# // Urban Wildlife / Night Danger

# // Intent / Use Cases

- the scene is a hero shot to be used for band merch.
- the scene is a snapshot of a moment in the night where a racoon has knocked over a trashcan next to streetlight, and has found and is playing with a revolver.
- the scene contains the streetlight. we either need to tile the base mesh, hide the base mesh, or resize and override the material with a tsl bricks type texture. we may also want to make the glass emissive and colored to emulate a streetlight at night
- the scene contains a pointlight, or directional light inside the streetlight to give light to the scene.
- the scene contains two trash cans next to the streetlight, and an additional trash can (trashcan 4) on its side, with the lid next to it.
- the scene contains two trashbags mixed in with the cans.
- the scene contains the raccoon model in pose (animation) X (TBD)
- the scene contains the gun model in a racoon's hands.
- the scene contains the bowie knife model in a racoon's hands.
- the scene contains two modes. one animated with the current set of animations. one stationary. where theres an angry raccoon, one holding a knife and one holding a gun.
  animations: angry-singleFrame, holding-singleFrame, holding2-singleFrame

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- add Vanier shank logo to cassette tape (decal)
- add cassette tape + tape reel to trash

# // Presets

- [x] **Night Danger** — animated mode; raccoons loop idle clips, R1 toys with the revolver. `animatePoses: true`.
- [x] **Hero Standoff** — stationary hero mode; angry raccoon (centre) flanked by gun + knife holders using single-frame poses.

# // Features

- [x] Per-raccoon **Weapon** dropdown (None / Gun / Knife) + Weapon Hand, replacing the old Holds-Gun boolean.
- [x] `PosedRaccoon` parents either Magnum or BowieKnife to a hand bone; separate Gun / Knife transform tuning folders in Leva.

# // Interactivity

# // Bugs
