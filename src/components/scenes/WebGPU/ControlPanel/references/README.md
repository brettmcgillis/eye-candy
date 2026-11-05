# ControlPanel references

Inspiration, not ports (decided at kickoff): the scene builds real geometry
from a three-free layout kernel rather than ray-marching either shader.

- `infiniteWidget.glsl` — yasuo, "infinite widget", https://www.shadertoy.com/view/cdSfDV
  (2023-07-23). 2D line-art SDF widgets (dials, clock, 7-segment counter,
  sliders) in tiles split 1 / 2 / 4, inside a Droste zoom. Echoed by the
  7-segment displays, the nested sub-panels and the line-art plot.
- `inerciaIntendedOne.glsl` — 0b5vr, "20221105_inercia intended one",
  https://www.shadertoy.com/view/cs2GWD (2022-11-05). A ray-marched faceplate
  on a 2×2 → 2×1 → 1×1 grid: speaker, EQ, kaoss pad, big knob, fader, 808
  buttons, LED meter, knob, jack, button, logo. Echoed by the `grid` layout,
  the big knob, the EQ bank, the 808 button row and the meters.

Both are Shadertoy uploads under its default licence (CC BY-NC-SA 3.0); the
source is kept for reference only and no code is copied from it.
