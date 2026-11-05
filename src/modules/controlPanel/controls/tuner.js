import { choose, dial, slide } from '../hits';
import { INK, pointerAngle } from '../kit';
import { part } from '../parts';
import { textParts } from './glyphs';
import { knobBody, spin } from './round';

const AMBER = [1, 0.38, 0.04];
const RED = [1, 0.04, 0.02];
const DARK = { c: [0.05, 0.025, 0.01], m: 0, r: 0.7 };
const GLASS = 0.075;
const PIXEL = 0.011;
const AM_BAND = [530, 1700];
const FM_BAND = [88, 108];
const STATIONS_NEAR = 0.025;
const KNOBS = ['knurl', 'skirt', 'davies'];

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

// A car radio's tuning window: AM and FM scales printed on a backlit amber
// glass, one red needle across both, a tuning knob and a volume knob either
// side, and (tall enough) a row of preset keys tuned to stations. The needle
// follows the tune signal whether a hand turns the knob, drags the needle or
// presses a preset.
export default function buildTuner(kit, { h, w }) {
  const { disc, rng, slab, style } = kit;
  const tall = h >= 2;
  const hw = w / 2 - 0.1;
  const hh = h / 2 - 0.1;
  const k = w < 4 ? 0.62 : 0.8;
  const knobX = hw - 0.1 - 0.42 * k;
  const ww = hw - 0.22 - 0.84 * k;
  const wh = tall ? 0.32 : 0.27;
  const wy = tall ? 0.38 : 0;
  const knobY = tall ? -0.05 : 0;
  const keyY = -0.55;
  const variant = KNOBS[Math.floor(rng() * KNOBS.length)];
  const capIndex = Math.floor(rng() * 3);
  const ledIndex = Math.floor(rng() * 3);
  const keys = Math.min(6, Math.max(3, Math.floor((2 * ww) / 0.24)));
  const stations = Array.from(
    { length: keys },
    (_, i) => (i + 0.5 + (rng() - 0.5) * 0.5) / keys
  );
  const tuneKnob = knobBody(kit, k, variant, capIndex);
  const volumeKnob = knobBody(kit, k, variant, capIndex);

  const left = -ww + 0.14;
  const span = 2 * ww - 0.28;
  const scaleX = (fraction) => left + fraction * span;
  const bandAt = ([low, high], f) => (f - low) / (high - low);

  const numeral = (text, x, top) =>
    textParts(
      kit,
      text,
      x - ((text.length * 4 - 1) * PIXEL) / 2,
      top,
      PIXEL,
      GLASS,
      DARK
    );

  const scale = [];
  const tick = (x, baseline, up, long) =>
    slab(
      x,
      baseline + (up ? 1 : -1) * (long ? 0.0275 : 0.016),
      0.003,
      long ? 0.0275 : 0.016,
      GLASS,
      GLASS + INK,
      DARK
    );
  const room = span / 5;
  const every = room < 0.15 ? 2 : 1;
  for (let f = 600; f <= 1600; f += 50) {
    const x = scaleX(bandAt(AM_BAND, f));
    const long = f % 200 === 0;
    scale.push(tick(x, wy + 0.02, true, long));
    if (long && (f / 200) % every === 0)
      scale.push(...numeral(String(f / 100), x, wy + 0.16));
  }
  for (let f = FM_BAND[0]; f <= FM_BAND[1]; f += 1) {
    const x = scaleX(bandAt(FM_BAND, f));
    const long = (f - FM_BAND[0]) % 4 === 0;
    scale.push(tick(x, wy - 0.02, false, long));
    if (long && ((f - FM_BAND[0]) / 4) % every === 0)
      scale.push(...numeral(String(f), x, wy - 0.105));
  }

  const keyPitch = (2 * ww) / keys;
  const keyX = (i) => -ww + (i + 0.5) * keyPitch;
  const statics = [
    slab(0, 0, hw, hh, 0, 0.04, style.hole, 0, 'rbox'),
    slab(
      0,
      wy,
      ww + 0.05,
      wh + 0.05,
      0.04,
      GLASS - 0.005,
      style.brushed,
      0,
      'rbox'
    ),
    slab(0, wy, ww, wh, GLASS - 0.005, GLASS, style.lit(AMBER, 0.5)),
    ...[-1, 1].map((side) =>
      slab(
        0,
        wy + side * (wh - 0.014),
        ww - 0.02,
        0.006,
        GLASS,
        GLASS + INK,
        DARK
      )
    ),
    ...scale,
    ...numeral('AM', -ww + 0.07, wy + 0.16),
    ...numeral('FM', -ww + 0.07, wy - 0.105),
    ...[-1, 1].flatMap((side) => [
      ...kit.ticks({
        count: 11,
        r0: 0.34 * k,
        r1: 0.39 * k,
        x: side * knobX,
        y: knobY,
      }),
      ...kit.legend(side * knobX, knobY - 0.45 * k, 0.4 * k, 0.03 * k),
    ]),
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].flatMap((sy) =>
        kit.screw(sx * (hw - 0.1), sy * (hh - 0.1), 0.03, 0.04)
      )
    ),
    ...(tall
      ? [
          ...kit.legend(-ww + 0.05, wy + wh + 0.13, 0.6, 0.03, {
            align: 'left',
          }),
          ...stations.flatMap((_, i) => [
            slab(
              keyX(i),
              keyY,
              keyPitch * 0.4,
              0.1,
              0.04,
              0.05,
              style.hole,
              0,
              'rbox'
            ),
            ...kit.legend(keyX(i), keyY - 0.17, keyPitch * 0.5, 0.025),
          ]),
        ]
      : []),
  ];

  const hits = [
    dial(0, knobX, knobY, 0.4 * k),
    dial(1, -knobX, knobY, 0.4 * k),
    slide(0, [scaleX(0), wy], [scaleX(1), wy], wh),
    ...(tall
      ? stations.map((station, i) =>
          choose(0, keyX(i), keyY, { hh: 0.1, hw: keyPitch * 0.4 }, station)
        )
      : []),
  ];

  return {
    hits,
    pose: ([tune, volume, level]) => {
      const near = Math.min(...stations.map((s) => Math.abs(tune - s)));
      const lock = clamp01(1 - near / STATIONS_NEAR);
      const x = scaleX(tune);
      const glow = 0.6 + 0.5 * lock + 0.2 * level * lock;
      const needle = style.lit(RED, glow);
      return [
        part(
          'box',
          [x, wy, (GLASS + 0.105) / 2],
          [0.007, wh - 0.02, (0.105 - GLASS) / 2],
          needle
        ),
        ...[-1, 1].map((side) =>
          slab(
            x,
            wy + side * (wh - 0.03),
            0.02,
            0.012,
            GLASS,
            0.108,
            style.metal
          )
        ),
        ...spin(tuneKnob, knobX, knobY, pointerAngle(tune)),
        ...spin(volumeKnob, -knobX, knobY, pointerAngle(volume)),
        ...kit.led(
          ww - 0.07,
          wy + 0.1,
          0.018,
          ledIndex,
          lock > 0.5 ? 1 : 0.05,
          {
            z0: GLASS,
          }
        ),
        ...(tall
          ? stations.flatMap((station, i) => {
              const held = Math.abs(tune - station) < 0.003;
              return [
                disc(
                  keyX(i),
                  keyY,
                  keyPitch * 0.3,
                  0.05,
                  held ? 0.07 : 0.1,
                  style.cap(capIndex),
                  'cap'
                ),
              ];
            })
          : []),
      ];
    },
    signals: ['smooth', 'smooth', 'audio'],
    statics,
  };
}
