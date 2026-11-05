# Cables references

- `hair.turtle` — zoso95, "Hair", https://turtletoy.net/turtle/36d793188c
  (2019-03-22, forked from "Oriented"). Licensed CC BY-NC-SA 4.0. 720
  strands leave the origin, each walking a 10-octave noise field with heading
  `ang + noise * 1368°`, `ang` stepping 0.5° per strand.

`@modules/cables` ports the noise and walk line for line (`noise.js`,
`walk.js`); `npm run cables:check` runs this file under a stub Turtle with
`Math.random` swapped for the kernel's seeded stream and fails if any of the
720 strands differs. The 3D tangle, the hole, the cable lay and the plugs
are this repo's additions.
