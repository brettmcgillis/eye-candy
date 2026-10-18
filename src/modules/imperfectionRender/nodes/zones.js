import {
  Fn,
  If,
  float,
  floor,
  max,
  mix,
  select,
  smoothstep,
  vec2,
} from 'three/tsl';

import { PI, fmod } from './common';
import { generatedSet, referenceExtras } from './zoneSet';

export const ANG_H = 0;
export const ANG_FWD = 0.25 * PI;
export const ANG_V = 0.5 * PI;
export const ANG_BACK = 0.75 * PI;

export const KIND_GRID = 1;
export const KIND_HERO = 2;
export const KIND_GLAZE = 3;

export const dirIndex = (ang) => fmod(floor(ang.div(0.25 * PI).add(0.5)), 4);

// field.glsl zone maps and wet.glsl's wetness map, on the reference square.
export default function createZones(u, c, { composition = 'reference' } = {}) {
  const { box, fbm3 } = c;

  // directionField: inline (four outputs), called inside a laid-out Fn.
  const directionField = (uv) => {
    const nz = fbm3(uv.mul(vec2(9, 7)).add(3.1));
    const back = max(
      box(uv, vec2(-0.1, 0.48), vec2(0.21, 1.1), 0.06),
      box(uv, vec2(0.05, 0.52), vec2(0.27, 0.76), 0.04).mul(0.85)
    );
    const fwd = max(
      max(
        box(uv, vec2(0.84, 0.6), vec2(1.1, 0.88), 0.05),
        box(uv, vec2(0.6, 0.43), vec2(0.72, 0.56), 0.02)
      ),
      box(uv, vec2(0.72, 0.5), vec2(0.86, 0.62), 0.03).mul(0.8)
    );
    const horL = box(uv, vec2(0.47, 0.355), vec2(0.72, 0.425), 0.015);
    const hor = max(
      max(
        max(
          box(uv, vec2(0.74, 0.3), vec2(1.1, 0.6), 0.03),
          box(uv, vec2(0.48, 0.24), vec2(1.1, 0.4), 0.02)
        ),
        max(
          box(uv, vec2(-0.1, 0.36), vec2(0.185, 0.46), 0.01),
          box(uv, vec2(0.8, 0.11), vec2(1.1, 0.28), 0.03).mul(0.8)
        )
      ),
      horL
    );

    const coolTop = box(uv, vec2(0.4, 0.58), vec2(1.1, 1.1), 0.05);
    const ang = float(ANG_V).toVar();
    const len = mix(vec2(60, 380), vec2(120, 460), coolTop).toVar();
    const dark = mix(u.darkLines, 0.1, coolTop).toVar();
    const gain = box(uv, vec2(0.12, 0.55), vec2(0.6, 1.1), 0.05)
      .mul(-0.65)
      .add(1)
      .add(box(uv, vec2(0.72, -0.1), vec2(1.1, 1.1), 0.06).mul(0.6))
      .add(box(uv, vec2(0.5, -0.1), vec2(1.1, 0.25), 0.05))
      .add(box(uv, vec2(0.2, -0.1), vec2(0.48, 0.38), 0.04).mul(0.5));
    const spread = mix(u.lumSpread, 0.13, coolTop).mul(gain).toVar();

    If(hor.greaterThan(nz), () => {
      const fromLeft = uv.x.lessThan(0.3).or(horL.greaterThan(nz));
      ang.assign(select(fromLeft, ANG_H + PI, ANG_H));
      len.assign(select(horL.greaterThan(nz), vec2(150, 420), vec2(40, 260)));
      spread.assign(gain.mul(0.1));
    });
    If(back.greaterThan(nz), () => {
      ang.assign(ANG_BACK);
      len.assign(vec2(40, 260));
      spread.assign(
        smoothstep(0.04, 0.17, uv.x).oneMinus().mul(0.27).add(0.04)
      );
      dark.assign(smoothstep(0.06, 0.16, uv.x).oneMinus().mul(0.05).add(0.08));
    });
    If(fwd.greaterThan(nz), () => {
      ang.assign(ANG_FWD);
      len.assign(vec2(20, 140));
      spread.assign(0.25);
    });
    return { ang, dark, len, spread };
  };

  const blockDensity = Fn(([uv]) => {
    const d = float(0.1).toVar();
    d.assign(max(d, box(uv, vec2(0.2, 0.28), vec2(0.5, 0.95), 0.05).mul(0.45)));
    d.mulAssign(
      box(uv, vec2(-0.1, 0.5), vec2(0.24, 1.1), 0.03).mul(-0.8).add(1)
    );
    d.assign(max(d, box(uv, vec2(0.5, 0.34), vec2(1, 0.58), 0.03).mul(0.8)));
    d.assign(max(d, box(uv, vec2(0.6, 0.6), vec2(0.88, 1), 0.05).mul(0.7)));
    d.mulAssign(
      box(uv, vec2(0.4, 0.62), vec2(0.58, 1.1), 0.02).mul(-0.6).add(1)
    );
    d.mulAssign(
      box(uv, vec2(0.47, 0.34), vec2(0.72, 0.43), 0.01).mul(-0.8).add(1)
    );
    d.assign(max(d, box(uv, vec2(0, 0.33), vec2(0.22, 0.47), 0.03).mul(0.2)));
    d.mulAssign(
      box(uv, vec2(-0.1, -0.1), vec2(0.24, 0.335), 0.02).mul(-0.9).add(1)
    );
    return d;
  }).setLayout({
    name: 'impBlockDensity',
    type: 'float',
    inputs: [{ name: 'p', type: 'vec2' }],
  });

  const wetZone = Fn(([uv]) => {
    const w = float(0.45).toVar();
    w.assign(max(w, box(uv, vec2(0.22, 0.5), vec2(0.46, 0.86), 0.06)));
    w.assign(max(w, box(uv, vec2(0.4, 0.58), vec2(0.64, 1.1), 0.04).mul(0.55)));
    w.assign(
      max(w, box(uv, vec2(0.19, -0.1), vec2(0.49, 0.44), 0.05).mul(0.95))
    );
    w.assign(max(w, box(uv, vec2(0.47, 0.33), vec2(1.1, 0.6), 0.03).mul(0.85)));
    w.assign(
      max(w, box(uv, vec2(-0.1, -0.1), vec2(0.24, 0.34), 0.04).mul(0.9))
    );
    w.mulAssign(
      box(uv, vec2(-0.1, 0.48), vec2(0.2, 1.1), 0.05).mul(-0.4).add(1)
    );
    return w;
  }).setLayout({
    name: 'impWetZone',
    type: 'float',
    inputs: [{ name: 'p', type: 'vec2' }],
  });

  const makeWetness = (zoneFn) =>
    Fn(([uv, meta]) => {
      const dir = fmod(meta, 4);
      const kind = floor(meta.div(4));
      const k = select(
        dir.equal(0),
        0.6,
        select(dir.equal(1).or(dir.equal(3)), 0.75, 1)
      ).mul(
        select(
          kind.equal(KIND_GRID),
          0.55,
          select(
            kind.equal(KIND_HERO),
            0.4,
            select(kind.equal(KIND_GLAZE), 0.5, 1)
          )
        )
      );
      return zoneFn(uv).mul(k);
    }).setLayout({
      name: 'impWetness',
      type: 'float',
      inputs: [
        { name: 'p', type: 'vec2' },
        { name: 'meta0', type: 'float' },
      ],
    });

  if (composition !== 'reference') {
    const gen = generatedSet(u, c);
    return { ...gen, wetness: makeWetness(gen.wetZone) };
  }
  return {
    ...referenceExtras(c),
    blockDensity,
    directionField,
    wetness: makeWetness(wetZone),
    wetZone,
  };
}
