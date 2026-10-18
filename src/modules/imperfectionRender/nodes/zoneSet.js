import { Fn, If, Loop, float, max, select, vec2 } from 'three/tsl';

import { ZONE_SLOTS } from '@modules/imperfection';

import { PI } from './common';

// Where a composition puts things. The reference's are its literals, kept as
// JS numbers so the shader folds them exactly as before; a generated
// composition's are uniforms.
const REFERENCE_PLACES = {
  dripU: [0.49, 0.76],
  fireRadius: [0.16, 0.26],
  fleckTop: 0.334,
  fleckX: [0.49, 0.75],
  glowCentre: [0.35, 0.68],
  glowRadius: [0.1, 0.18],
  sootBot: 0.29,
  sootOn: 1,
  sootTop: 0.342,
  sootX: [0.42, 0.5],
  wedgeOn: 1,
  wedgePt: [0.8, 0.675],
  wedgeV: [0.46, 0.56, 0.9, 0.97],
};

// The reference's zone literals that sit outside field.glsl's zone maps:
// warm variation, the lower column and the core, block shape gates, grain
// odds, the crisp column, the ink seams.
function referenceExtras(c) {
  const { box } = c;
  return {
    blockGate(cell, cz, dens) {
      If(cell.x.greaterThan(cell.y), () => {
        dens.mulAssign(box(cz, vec2(0, 0.3), vec2(1, 0.62), 0.03));
      });
      If(cell.y.greaterThan(0.25), () => {
        dens.assign(box(cz, vec2(0.58, 0.55), vec2(0.92, 1.1), 0.03).mul(0.75));
      });
      If(cell.x.lessThan(0.1), () => {
        dens.mulAssign(
          max(
            box(cz, vec2(0.15, 0.2), vec2(0.5, 0.9), 0.03),
            box(cz, vec2(0.5, 0.33), vec2(1, 0.6), 0.03)
          )
        );
      });
    },
    core: (p) => box(p, vec2(0.29, 0.53), vec2(0.43, 0.8), 0.04),
    crisp: (p) => box(p, vec2(0.19, -0.1), vec2(0.49, 0.42), 0.03),
    horP: (cz) =>
      box(cz, vec2(0.48, 0.33), vec2(1, 0.6), 0.02)
        .mul(0.5)
        .add(box(cz, vec2(0.72, 0.33), vec2(1, 0.52), 0.02).mul(0.4))
        .add(box(cz, vec2(0, 0.33), vec2(0.22, 0.47), 0.02).mul(0.35))
        .add(box(cz, vec2(0.1, 0.4), vec2(0.5, 0.62), 0.02).mul(0.25)),
    lowCol: (p) => box(p, vec2(0.21, 0), vec2(0.47, 0.42), 0.04),
    places: REFERENCE_PLACES,
    seam: (uv) =>
      max(
        max(
          box(uv, vec2(0.4, 0.5), vec2(0.47, 0.8), 0.02),
          box(uv, vec2(0.55, 0.55), vec2(0.66, 0.8), 0.03)
        ),
        box(uv, vec2(0.45, 0.12), vec2(0.62, 0.34), 0.03)
      ),
    warmVarMask: (p) =>
      max(
        max(float(0.25), box(p, vec2(0.19, -0.1), vec2(0.49, 0.5), 0.04)),
        box(p, vec2(0.2, 0.5), vec2(0.46, 0.84), 0.04).mul(0.75)
      ),
    warmZone: (cz) =>
      max(
        box(cz, vec2(0.15, 0.25), vec2(0.5, 1), 0.05),
        box(cz, vec2(0.5, 0.33), vec2(1, 0.6), 0.03)
      ),
  };
}

// A generated composition's zones, read from three vec4 arrays (box, param,
// aux) in fixed slot ranges (ZONE_SLOTS) and a few misc vec4s.
function generatedSet(u, c) {
  const { box, fbm3 } = c;
  const slot = (name, i = 0) => ZONE_SLOTS[name][0] + i;
  const boxAt = (p, i) => {
    const b = u.zoneBox.element(i);
    return box(p, b.xy, b.zw, u.zoneParam.element(i).y);
  };

  // Weighted boxes over a base: w >= 0 raises to max(d, w·box), w < 0 cuts
  // d by (1 + w·box). Unused slots carry w = 0.
  const opMap = (name, base) =>
    Fn(([p]) => {
      const d = float(base).toVar();
      const [start, count] = ZONE_SLOTS[name];
      Loop(count, ({ i }) => {
        const index = i.add(start);
        const w = u.zoneParam.element(index).x;
        const v = boxAt(p, index);
        d.assign(
          select(
            w.greaterThanEqual(0),
            max(d, v.mul(w)),
            d.mul(w.mul(v).add(1))
          )
        );
      });
      return d;
    }).setLayout({
      name: `impZone_${name}`,
      type: 'float',
      inputs: [{ name: 'p', type: 'vec2' }],
    });

  const blockDensity = opMap('density', 0.1);
  const wetZone = opMap('wet', 0.45);
  const warmVar = opMap('warmVar', 0.25);
  const gainMap = opMap('gain', 0);

  const directionField = (uv) => {
    const nz = fbm3(uv.mul(vec2(9, 7)).add(3.1));
    const base = u.zoneMisc.element(5);
    const gain = gainMap(uv).add(1);
    const ang = float(0.5 * PI).toVar();
    const len = vec2(base.x, base.y).toVar();
    const spread = u.lumSpread.mul(base.z).mul(gain).toVar();
    const dark = u.darkLines.add(base.w).toVar();
    const [start, count] = ZONE_SLOTS.dirs;
    Loop(count, ({ i }) => {
      const index = i.add(start);
      const prm = u.zoneParam.element(index);
      const aux = u.zoneAux.element(index);
      const b = u.zoneBox.element(index);
      const w = box(uv, b.xy, b.zw, aux.y);
      If(aux.w.greaterThan(0.5).and(w.greaterThan(nz)), () => {
        ang.assign(prm.x.mul(0.25 * PI));
        len.assign(prm.yz);
        spread.assign(prm.w.mul(select(aux.z.greaterThan(0.5), gain, 1)));
        dark.assign(aux.x);
      });
    });
    return { ang, dark, len, spread };
  };

  const misc = (i) => u.zoneMisc.element(i);
  const glow = misc(0);
  const wedge = misc(1);
  const wedgeV = misc(2);
  const soot = misc(3);
  const drip = misc(4);

  return {
    blockDensity,
    blockGate(cell, cz, dens) {
      If(cell.x.greaterThan(cell.y), () => {
        dens.mulAssign(boxAt(cz, slot('band')));
      });
      If(cell.y.greaterThan(0.25), () => {
        dens.assign(boxAt(cz, slot('tall')).mul(0.75));
      });
      If(cell.x.lessThan(0.1), () => {
        dens.mulAssign(
          max(boxAt(cz, slot('small')), boxAt(cz, slot('small', 1)))
        );
      });
    },
    core: (p) => boxAt(p, slot('core')),
    crisp: (p) => boxAt(p, slot('crisp')),
    directionField,
    horP: (cz) =>
      [0, 1, 2, 3]
        .map((i) =>
          boxAt(cz, slot('horP', i)).mul(u.zoneParam.element(slot('horP', i)).x)
        )
        .reduce((a, b) => a.add(b)),
    lowCol: (p) => boxAt(p, slot('lowCol')),
    places: {
      dripU: [drip.x, drip.y],
      fireRadius: [glow.z.mul(1.6), glow.w.mul(1.444)],
      fleckTop: soot.x.sub(0.008),
      fleckX: [drip.x, drip.y],
      glowCentre: [glow.x, glow.y],
      glowRadius: [glow.z, glow.w],
      sootBot: soot.y,
      sootOn: soot.w,
      sootTop: soot.x,
      sootX: [soot.z, soot.z.add(0.08)],
      wedgeOn: wedge.z,
      wedgePt: [wedge.x, wedge.y],
      wedgeV: [wedgeV.x, wedgeV.y, wedgeV.z, wedgeV.w],
    },
    seam: (uv) =>
      max(
        max(boxAt(uv, slot('seam')), boxAt(uv, slot('seam', 1))),
        boxAt(uv, slot('seam', 2))
      ),
    warmVarMask: warmVar,
    warmZone: (cz) =>
      max(boxAt(cz, slot('warmZone')), boxAt(cz, slot('warmZone', 1))),
    wetZone,
  };
}

export { generatedSet, referenceExtras };
