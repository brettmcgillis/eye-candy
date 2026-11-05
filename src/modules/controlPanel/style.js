import { hexToRgb } from '@utils/paletteStops';

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export const linearOf = (hex) => hexToRgb(hex).map(toLinear);

const scaled = (rgb, k) => rgb.map((v) => v * k);
const OFF_GLOW = 0.012;
// A module plate's edge is a tight machined bevel, not a pillowy round.
const PLATE_BEVEL = 0.022;
// How worn the parts hands touch are: knob and button caps, keys.
const WEAR = 0.8;
// Lit LEDs stay their colour rather than burning out to white.
const LED_GLOW = 0.7;

// The looks every control dresses its parts in, resolved once per panel
// from the config's colours. Colours are linear, emission already carries
// the glow.
export default function createStyle(config) {
  const plate = linearOf(config.plateColor);
  const zone = linearOf(config.zoneColor);
  const caps = [config.capColorA, config.capColorB, config.capColorC].map(
    linearOf
  );
  const leds = [config.ledColorA, config.ledColorB, config.ledColorC].map(
    linearOf
  );
  const phosphor = linearOf(config.screenColor);
  const knob = linearOf(config.knobColor);
  const legend = linearOf(config.legendColor);
  const metal = linearOf(config.metalColor);
  const plateLook = (rgb, shade) => ({
    b: PLATE_BEVEL,
    c: scaled(rgb, shade),
    m: config.plateMetalness,
    r: config.plateRoughness,
  });

  return {
    plate: (shade = 1, zoned = false) => plateLook(zoned ? zone : plate, shade),
    chassis: { c: linearOf(config.chassisColor), m: 0.2, r: 0.7 },
    legend: { c: legend, m: 0, r: 0.6 },
    hole: { c: [0.006, 0.006, 0.007], m: 0, r: 0.9 },
    knob: { c: knob, m: 0, r: 0.45 },
    grip: { c: knob, m: 0, r: 0.45, w: WEAR },
    rubber: { c: scaled(knob, 0.6), m: 0, r: 0.85 },
    cap: (i) => ({ c: caps[i % caps.length], m: 0, r: 0.35, w: WEAR }),
    capColor: (i) => caps[i % caps.length],
    metal: { c: metal, m: 1, r: 0.28 },
    brushed: { c: scaled(metal, 0.85), m: 1, r: 0.45 },
    glass: { c: [0.01, 0.012, 0.012], m: 0, r: 0.08 },
    face: (dark) =>
      dark
        ? { c: [0.012, 0.012, 0.013], m: 0, r: 0.5 }
        : { c: scaled(legend, 0.9), m: 0, r: 0.55 },
    ink: (dark) => ({ c: dark ? legend : scaled(knob, 0.5), m: 0, r: 0.6 }),
    led: (i, level = 1) => {
      const rgb = leds[i % leds.length];
      const lit = Math.max(level, 0);
      return {
        c: scaled(rgb, 0.12),
        e: scaled(
          rgb,
          LED_GLOW * config.glow * (OFF_GLOW + (1 - OFF_GLOW) * lit)
        ),
        m: 0,
        r: 0.2,
      };
    },
    ledColor: (i) => leds[i % leds.length],
    screen: (level = 1, rgb = phosphor) => ({
      c: scaled(rgb, 0.05),
      e: scaled(rgb, config.glow * level),
      m: 0,
      r: 0.3,
    }),
    lit: (rgb, level) => ({
      c: scaled(rgb, 0.3),
      e: scaled(rgb, config.glow * level),
      m: 0,
      r: 0.3,
    }),
  };
}
