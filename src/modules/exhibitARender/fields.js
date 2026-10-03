/* eslint-disable no-param-reassign */
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  acos,
  atan,
  clamp,
  cos,
  float,
  floor,
  log,
  max,
  min,
  pow,
  select,
  sin,
  sqrt,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  applyApollianConfig,
  createApollianUniforms,
  createObjectField,
} from '@modules/apollianRender';
import { FIELD_EXHIBITS, guestConfig } from '@modules/exhibitA';

// The TSL twins of @modules/exhibitA's fields.js, line for line: change both
// together. Every core takes a field-space point and returns
// vec2(distance in field units, trap).
const DEG = Math.PI / 180;
const MIN_R = 1e-8;
const PHI = (1 + Math.sqrt(5)) / 2;
const { SQRT2 } = Math;

const floorMod = (x, y) => x.sub(floor(x.div(y)).mul(y));
const rot = (a, b, c, s) => [c.mul(a).sub(s.mul(b)), s.mul(a).add(c.mul(b))];

// A layout makes a Fn a real WGSL function; without one TSL inlines the fold
// loop at every call site and Metal's compiler gives up.
const layout = (fn, name) =>
  fn.setLayout({ inputs: [{ name: 'p', type: 'vec3' }], name, type: 'vec2' });

const int = (v = 0) => uniform(v, 'int');

export function createFieldUniforms() {
  return {
    algebraicCos: uniform(1),
    algebraicShell: uniform(0),
    algebraicSign: uniform(1),
    algebraicSin: uniform(0),
    bulbIterations: int(10),
    bulbPhase: uniform(0),
    bulbPower: uniform(8),
    boxFold: uniform(1),
    boxIterations: int(12),
    boxMinRadius2: uniform(0.25),
    boxScale: uniform(-1.77),
    fieldRadius: uniform(1),
    juliaC: uniform(new THREE.Vector4()),
    juliaIterations: int(11),
    juliaSlice: uniform(0),
    kifsAngleA: uniform(0),
    kifsAngleB: uniform(0),
    kifsIterations: int(8),
    kifsOffset: uniform(1),
    kifsScale: uniform(2),
    kummerLambda: uniform(1),
    kummerMu2: uniform(1.69),
    mengerLevel: int(4),
    mengerTwist: uniform(0),
    shellHalf: uniform(0),
  };
}

const ORIENTATION = { barth: -1, clebsch: -1, kummer: 1 };

export function applyFieldConfig(f, guest, id, c) {
  if (id === 'apollian4' || id === 'kleinian') {
    applyApollianConfig(guest, guestConfig(c));
    return;
  }
  f.fieldRadius.value = FIELD_EXHIBITS[id].radius(c);
  f.bulbPower.value = c.bulbPower;
  f.bulbIterations.value = c.bulbIterations;
  f.bulbPhase.value = c.bulbPhase * DEG;
  f.juliaC.value.set(c.juliaCX, c.juliaCY, c.juliaCZ, c.juliaCW);
  f.juliaSlice.value = c.juliaSlice;
  f.juliaIterations.value = c.juliaIterations;
  f.boxScale.value = c.boxScale;
  f.boxFold.value = c.boxFold;
  f.boxMinRadius2.value = c.boxMinRadius ** 2;
  f.boxIterations.value = c.boxIterations;
  f.mengerLevel.value = c.mengerLevel;
  f.mengerTwist.value = c.mengerTwist * DEG;
  f.kifsScale.value = c.kifsScale;
  f.kifsOffset.value = c.kifsOffset * (c.kifsScale - 1);
  f.kifsAngleA.value = c.kifsAngleA * DEG;
  f.kifsAngleB.value = c.kifsAngleB * DEG;
  f.kifsIterations.value = c.kifsIterations;
  const mu2 = c.kummerMu ** 2;
  f.kummerMu2.value = mu2;
  f.kummerLambda.value = (3 * mu2 - 1) / (3 - mu2);
  f.algebraicCos.value = Math.cos(c.algebraicTurn * DEG);
  f.algebraicSin.value = Math.sin(c.algebraicTurn * DEG);
  f.algebraicSign.value =
    (ORIENTATION[id] ?? 1) * (c.algebraicSide === 'inverse' ? -1 : 1);
  const shell = c.family === 'algebraic' && c.algebraicSide === 'shell';
  f.algebraicShell.value = shell ? 1 : 0;
  f.shellHalf.value = shell ? c.algebraicWall / 2 : 0;
}

const boxDistance = (p, h) => {
  const q = abs(p).sub(h);
  return q
    .max(0)
    .length()
    .add(min(max(q.x, max(q.y, q.z)), 0));
};

function mandelbulb(f) {
  return layout(
    Fn(([q]) => {
      const c = vec3(q.x, q.z, q.y);
      const z = vec3(c).toVar();
      const dr = float(1).toVar();
      const r = float(0).toVar();
      const trap = float(1e9).toVar();
      const n = f.bulbPower;
      Loop({ end: f.bulbIterations, start: 0, type: 'int' }, () => {
        r.assign(z.length().max(MIN_R));
        If(r.greaterThan(2), () => {
          Break();
        });
        trap.assign(trap.min(r));
        const theta = acos(z.z.div(r).clamp(-1, 1)).mul(n).add(f.bulbPhase);
        const phi = atan(z.y, z.x).mul(n);
        dr.assign(pow(r, n.sub(1)).mul(n).mul(dr).add(1));
        const zr = pow(r, n);
        z.assign(
          vec3(sin(theta).mul(cos(phi)), sin(theta).mul(sin(phi)), cos(theta))
            .mul(zr)
            .add(c)
        );
      });
      r.assign(z.length().max(MIN_R));
      return vec2(log(r).mul(r).mul(0.5).div(dr), trap.clamp(0, 1));
    }),
    'mandelbulbCore'
  );
}

function quatJulia(f) {
  return layout(
    Fn(([q]) => {
      const z = vec4(q, f.juliaSlice).toVar();
      const mz2 = z.dot(z).toVar();
      const md2 = float(1).toVar();
      const trap = float(1e9).toVar();
      Loop({ end: f.juliaIterations, start: 0, type: 'int' }, () => {
        md2.mulAssign(mz2.mul(4));
        const a = z.x;
        z.assign(
          vec4(
            a.mul(a).sub(vec3(z.y, z.z, z.w).dot(vec3(z.y, z.z, z.w))),
            vec3(z.y, z.z, z.w).mul(a.mul(2))
          ).add(f.juliaC)
        );
        trap.assign(trap.min(mz2));
        mz2.assign(z.dot(z));
        If(mz2.greaterThan(16), () => {
          Break();
        });
      });
      const m = mz2.max(MIN_R);
      return vec2(
        sqrt(m.div(md2)).mul(log(m)).mul(0.25),
        sqrt(trap).clamp(0, 1)
      );
    }),
    'quatJuliaCore'
  );
}

function mandelbox(f) {
  return layout(
    Fn(([q]) => {
      const z = vec3(q).toVar();
      const dr = float(1).toVar();
      const trap = float(1e9).toVar();
      const s = f.boxScale;
      Loop({ end: f.boxIterations, start: 0, type: 'int' }, () => {
        z.assign(clamp(z, f.boxFold.negate(), f.boxFold).mul(2).sub(z));
        const r2 = z.dot(z);
        trap.assign(trap.min(r2));
        const k = select(
          r2.lessThan(f.boxMinRadius2),
          float(1).div(f.boxMinRadius2),
          select(r2.lessThan(1), float(1).div(r2.max(MIN_R)), float(1))
        );
        z.assign(z.mul(k).mul(s).add(q));
        dr.assign(dr.mul(k).mul(abs(s)).add(1));
      });
      const d = z
        .length()
        .sub(abs(s.sub(1)))
        .div(abs(dr))
        .sub(pow(abs(s), float(1).sub(f.boxIterations.toFloat())));
      return vec2(d, sqrt(trap).clamp(0, 1));
    }),
    'mandelboxCore'
  );
}

function menger(f) {
  return layout(
    Fn(([q]) => {
      const p = vec3(q).toVar();
      const d = boxDistance(p, float(1)).toVar();
      const s = float(1).toVar();
      const trap = float(0).toVar();
      const c = cos(f.mengerTwist);
      const sn = sin(f.mengerTwist);
      Loop({ end: f.mengerLevel, start: 0, type: 'int' }, ({ i }) => {
        const [x, z] = rot(p.x, p.z, c, sn);
        p.assign(vec3(x, p.y, z));
        const a = floorMod(p.mul(s), float(2)).sub(1);
        s.mulAssign(3);
        const r = abs(float(1).sub(abs(a).mul(3)));
        const da = max(r.x, r.y);
        const db = max(r.y, r.z);
        const dc = max(r.z, r.x);
        const cut = min(da, min(db, dc)).sub(1).div(s);
        If(cut.greaterThan(d), () => {
          d.assign(cut);
          trap.assign(i.toFloat().add(1).div(f.mengerLevel.toFloat()));
        });
      });
      return vec2(d, trap);
    }),
    'mengerCore'
  );
}

function kifs(f) {
  return layout(
    Fn(([q]) => {
      const z = vec3(q).toVar();
      const trap = float(1e9).toVar();
      const ca = cos(f.kifsAngleA);
      const sa = sin(f.kifsAngleA);
      const cb = cos(f.kifsAngleB);
      const sb = sin(f.kifsAngleB);
      Loop({ end: f.kifsIterations, start: 0, type: 'int' }, () => {
        z.assign(abs(z));
        z.assign(select(z.x.lessThan(z.y), vec3(z.y, z.x, z.z), z));
        z.assign(select(z.x.lessThan(z.z), vec3(z.z, z.y, z.x), z));
        z.assign(select(z.y.lessThan(z.z), vec3(z.x, z.z, z.y), z));
        const [y1, z1] = rot(z.y, z.z, ca, sa);
        z.assign(vec3(z.x, y1, z1));
        z.assign(z.mul(f.kifsScale).sub(f.kifsOffset));
        const [x2, y2] = rot(z.x, z.y, cb, sb);
        z.assign(vec3(x2, y2, z.z));
        trap.assign(trap.min(z.dot(z)));
      });
      return vec2(
        boxDistance(z, float(1)).mul(
          pow(f.kifsScale, f.kifsIterations.toFloat().negate())
        ),
        sqrt(trap).div(4).clamp(0, 1)
      );
    }),
    'kifsCore'
  );
}

const POLYNOMIALS = {
  barth: () => (x, y, z, w) => {
    const p2 = PHI * PHI;
    const r = x.mul(x).add(y.mul(y)).add(z.mul(z)).sub(w.mul(w));
    return x
      .mul(x)
      .mul(p2)
      .sub(y.mul(y))
      .mul(y.mul(y).mul(p2).sub(z.mul(z)))
      .mul(z.mul(z).mul(p2).sub(x.mul(x)))
      .mul(4)
      .sub(
        r
          .mul(r)
          .mul(w)
          .mul(w)
          .mul(1 + 2 * PHI)
      );
  },
  clebsch: () => (x, y, z, w) => {
    const sum = x.add(y).add(z).add(w);
    return x
      .mul(x)
      .mul(x)
      .add(y.mul(y).mul(y))
      .add(z.mul(z).mul(z))
      .add(w.mul(w).mul(w))
      .sub(sum.mul(sum).mul(sum));
  },
  kummer: (f) => (x, y, z, w) => {
    const r = x
      .mul(x)
      .add(y.mul(y))
      .add(z.mul(z))
      .sub(f.kummerMu2.mul(w).mul(w));
    const p = w.sub(z).sub(x.mul(SQRT2));
    const q = w.sub(z).add(x.mul(SQRT2));
    const s = w.add(z).add(y.mul(SQRT2));
    const t = w.add(z).sub(y.mul(SQRT2));
    return r.mul(r).sub(f.kummerLambda.mul(p).mul(q).mul(s).mul(t));
  },
};

const TETRA = [
  [1, -1, -1],
  [-1, -1, 1],
  [-1, 1, -1],
  [1, 1, 1],
];
const GRAD_STEP = 1e-3;

function algebraic(f, id) {
  const poly = POLYNOMIALS[id](f);
  const evaluate = Fn(([p]) =>
    poly(
      f.algebraicCos.mul(p.x).sub(f.algebraicSin),
      p.y,
      p.z,
      f.algebraicSin.mul(p.x).add(f.algebraicCos)
    )
  ).setLayout({
    inputs: [{ name: 'p', type: 'vec3' }],
    name: `${id}Polynomial`,
    type: 'float',
  });
  return layout(
    Fn(([q]) => {
      const value = evaluate(q);
      const g = vec3(0).toVar();
      TETRA.forEach((k) => {
        const kv = vec3(...k);
        g.addAssign(kv.mul(evaluate(q.add(kv.mul(GRAD_STEP)))));
      });
      const grad = g
        .length()
        .div(4 * GRAD_STEP)
        .max(MIN_R);
      const d = value.div(grad).mul(f.algebraicSign);
      return vec2(
        select(f.algebraicShell.greaterThan(0.5), abs(d), d),
        log(grad.add(1)).div(6).clamp(0, 1)
      );
    }),
    `${id}Core`
  );
}

const CORES = {
  barth: (f) => algebraic(f, 'barth'),
  clebsch: (f) => algebraic(f, 'clebsch'),
  kifs,
  kummer: (f) => algebraic(f, 'kummer'),
  mandelbox,
  mandelbulb,
  menger,
  quatJulia,
};

// The solid in object space (unit ball, or a guest's bound): `distance(p)`
// and `info(p)` → vec2(distance, structure) in object units.
export function createExhibitFieldNode(id, f, guest) {
  if (id === 'apollian4' || id === 'kleinian') {
    const field = createObjectField(id, guest, null);
    return {
      distance: (p) => field.distance(p),
      info: (p) => {
        const r = field.info(p);
        return vec2(r.x, r.y);
      },
    };
  }
  const core = CORES[id](f);
  const solid = layout(
    Fn(([p]) => {
      const r = core(p.mul(f.fieldRadius));
      return vec2(
        max(r.x.div(f.fieldRadius).sub(f.shellHalf), p.length().sub(1)),
        r.y
      );
    }),
    `${id}Solid`
  );
  return { distance: (p) => solid(p).x, info: (p) => solid(p) };
}

export { createApollianUniforms as createGuestUniforms };
