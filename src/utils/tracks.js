/* ----------------------------------------
   Strudel broadcast library
----------------------------------------- */

export const threeD = `
setcps(0.7)

stack(
  sound("bd ~ bd ~").gain(1.1),
  sound("hh*8").gain(0.4),
  sound("arpy:2").slow(2).gain(0.5)
)
`;

export const glitch = `
setcps(0.9)

stack(
  sound("bd*2").gain(1.2),
  sound("cp ~").every(3, rev),
  sound("hh*16").gain(0.25),
  sound("noise").slow(4).gain(0.1)
)
`;

export const ambient = `
setcps(0.4)

stack(
  sound("arpy:1").slow(4).gain(0.5),
  sound("pad:2").slow(8).gain(0.4),
  sound("~ hh ~ hh").gain(0.15)
)
`;

export const weirderStuff = `
setcps(0.7);

p1: n("0 2 4 6 7 6 4 2")
  .scale("<c3:major>/2")
  .s("supersaw")
  .distort(0.7)
  .superimpose((x) => x.detune("<0.5>"))
  .lpenv(perlin.slow(3).range(1, 4))
  .lpf(perlin.slow(2).range(100, 2000))
  .gain(0.3);
p2: "<a1 e2>/8".clip(0.8).struct("x*8").s("supersaw").note();
`;

export const defaultPattern = `
setcps(0.7)

stack(
  sound("bd ~ bd ~").gain(1.1),
  sound("hh*8").gain(0.4),
  sound("arpy:2").slow(2).gain(0.5)
)
`;
/* Optional: registry object if you prefer */
export const STRUDEL_TRACKS = {
  threeD,
  glitch,
  ambient,
  weirderStuff,
  defaultPattern,
};
