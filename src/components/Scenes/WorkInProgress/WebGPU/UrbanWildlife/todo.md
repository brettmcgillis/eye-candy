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

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Presets

- `Night Danger` (default) — warm sodium-vapor streetlight against a deep blue-black night.

# // Features

# // Interactivity

# // Bugs

- Live browser verification was skipped: the dev server holds port 3000 with
  `strictPort`, so the preview tool couldn't launch a second instance. Validated via
  lint + production build instead. Check it live in the already-running server at the
  `urbanWildlife` route (HMR picks it up).
