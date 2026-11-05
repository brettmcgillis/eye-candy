import { detent, dial } from '../hits';
import { TAU, part, quatY } from '../parts';

const INKS = [
  [0.09, 0.14, 0.22],
  [0.65, 0.07, 0.035],
  [0.05, 0.36, 0.12],
  [0.36, 0.1, 0.45],
  [0.02, 0.02, 0.02],
];
// Clock units of trace the paper holds; it moves under the pens at one
// speed, so the grid and every trace scroll together.
const WINDOW = 8;
// Pens sit staggered along the paper, as on a real recorder.
const PEN_STAGGER = 0.09;

export default function buildRecorder(kit, { w, h, variant }) {
  const { slab, disc, style, rng } = kit;
  const hw = w / 2 - 0.3;
  const hh = h / 2 - 0.38;
  const cy = 0.12;
  const phase = rng() * TAU;
  const dual = variant === 'dual' || (!variant && rng() < 0.5);
  const paper = { c: [0.85, 0.81, 0.67], m: 0, r: 0.95 };
  const grid = { c: [0.48, 0.57, 0.48], m: 0, r: 1 };
  const bands = dual ? 2 : 1;
  const paperSpeed = (2 * hw) / WINDOW;
  const penX = (band) => hw - 0.02 - band * PEN_STAGGER;
  const inkOf = (v) => ({
    c: INKS[Math.round(v * (INKS.length - 1))],
    m: 0,
    r: 0.7,
  });
  const buttonY = -h / 2 + 0.25;
  const trace = (t, band) =>
    (Math.sin(t * 1.7 + phase + band) + 0.4 * Math.sin(t * 4.1 + band * 3)) /
    1.4;
  const seg = (a, b, look) =>
    slab(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 + 0.004,
      0.006,
      0.077,
      0.081,
      look,
      Math.atan2(b[1] - a[1], b[0] - a[0])
    );
  return {
    live: true,
    statics: [
      slab(0, 0, w / 2 - 0.08, h / 2 - 0.08, 0, 0.04, style.knob, 0, 'rbox'),
      slab(0, cy, hw + 0.07, hh + 0.035, 0.04, 0.065, style.hole),
      slab(0, cy, hw, hh, 0.065, 0.07, paper),
      ...[-1, 1].map((sign) =>
        part(
          'cyl',
          [sign * (hw + 0.06), cy, 0.075],
          [0.055, 0.055, hh],
          style.metal,
          [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
        )
      ),
      ...[0, 1].map((i) =>
        disc(
          (i - 0.5) * 0.6,
          buttonY,
          0.095,
          0.04,
          0.13,
          style.brushed,
          'knurl'
        )
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        slab(0, cy + (i / 6 - 0.5) * hh * 2, hw, 0.003, 0.07, 0.073, grid)
      ),
    ],
    hits: [
      dial(0, -0.3, buttonY, 0.12),
      dial(1, 0.3, buttonY, 0.12),
      ...Array.from({ length: bands }, (_, band) => ({
        ...detent(2 + band, penX(band), cy, null, INKS.length),
        hh,
        hw: PEN_STAGGER / 2,
      })),
    ],
    signals: [
      { kind: 'smooth', fixed: true, base: 0.5 },
      { kind: 'smooth', fixed: true, base: 0.5 },
      ...Array.from({ length: bands }, (_, band) => ({
        base: band / (INKS.length - 1),
        fixed: true,
        kind: 'step',
        steps: INKS.length,
      })),
    ],
    pose: ([speed, gain, ...inks], { t }) => {
      const clock = t * (0.2 + speed * 1.8);
      const out = [];
      const pitch = 0.15;
      for (
        let x = -hw + ((pitch - ((clock * paperSpeed) % pitch)) % pitch);
        x < hw;
        x += pitch
      )
        out.push(slab(x, cy, 0.003, hh, 0.07, 0.073, grid));
      for (let band = 0; band < bands; band += 1) {
        const pen = inkOf(inks[band]);
        const tip = penX(band) + 0.02;
        const at = (i) => {
          const x = -hw + (i / 72) * (tip + hw);
          return [
            x,
            cy +
              trace(clock - (tip - x) / paperSpeed, band) *
                hh *
                (0.12 + gain * 0.7),
          ];
        };
        for (let i = 0; i < 72; i += 1) out.push(seg(at(i), at(i + 1), pen));
        const end = at(72);
        out.push(
          slab(
            end[0] - 0.02,
            (cy + hh + end[1]) / 2,
            0.018,
            (cy + hh - end[1]) / 2,
            0.08,
            0.12,
            style.metal
          )
        );
        out.push(disc(end[0] - 0.02, end[1], 0.025, 0.08, 0.13, pen, 'cap'));
      }
      [speed, gain].forEach((v, i) =>
        out.push(
          slab(
            (i - 0.5) * 0.6 + Math.sin(v * 5 - 2.5) * 0.05,
            buttonY + Math.cos(v * 5 - 2.5) * 0.05,
            0.01,
            0.025,
            0.13,
            0.135,
            style.legend,
            -v * 5 + 2.5
          )
        )
      );
      out.push(
        part(
          'box',
          [-hw - 0.06, cy, 0.075],
          [0.009, hh * 0.97, 0.057],
          style.knob,
          quatY(clock * 3)
        )
      );
      return out;
    },
  };
}
