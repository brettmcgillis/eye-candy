# // Party Line

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Multiplayer drawing games for the couch (phones + tablets) and for coworker
  social hour (GH Pages link + room code). Every device is the canvas.
- One scene, many games: each preset is an entirely different game, all
  played in one room joined by a short code.
- Rooms run on `@modules/partyRoom`: peer-to-peer over Trystero, one peer
  hosts, everyone keeps a replica so the host can leave mid-game.

## // TODO:

- [ ] PartyKit transport adapter (`eye-candy-party`) for networks that block WebRTC
- [ ] TURN config for corporate networks
- [ ] Optimistic local preview for Scribble Battle strokes
- [ ] Add some insane suggestions to scribble together

## // Presets

- [x] Scribble Together — shared canvas, everyone's colour, periodic prompts
- [x] Scribble Battle — cover the most paper; the pink eraser blows through
- [ ] Draw in the Dark — flashlight cookie around the pen, lights on at the end
- [ ] Draw the Path — players draw the track, then the physics creature runs it
- [ ] Draw Battle — mad-libs prompt + constraint, then vote
- [ ] Saboteur — one player secretly sabotages the shared prompt; vote them out
- [ ] Radiance — draw emitting and occluding lines (needs real radiance cascades)

## // Features

## // Interactivity

## // Bugs
