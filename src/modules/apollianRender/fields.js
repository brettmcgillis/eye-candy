import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  float,
  floor,
  fract,
  int,
  max,
  min,
  select,
  storage,
  tanh,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { PACKING_GRID } from '@modules/apollian';
import { rot2 } from '@modules/apollonian';

const MIN_RADIUS_SQ = 1e-12;

// WGSL `%` truncates; the folds need GLSL's floor-based mod.
const floorMod = (x, y) => x.sub(floor(x.div(y)).mul(y));

// A layout makes a Fn a real WGSL function; without one TSL inlines the whole
// fold loop at every call site, and a march + normal + AO + shadow shader
// then outgrows Metal's compiler.
const layout = (fn, name, type, inputType = 'vec3') =>
  fn.setLayout({ inputs: [{ name: 'p', type: inputType }], name, type });

// Each core is the CPU kernel's estimator (@modules/apollian fields.js),
// line for line: vec3(distance in field units, accumulated scale, trap).
function apollian4Core(u) {
  return layout(
    Fn(([q]) => {
      const w = u.a4W.mul(float(1).sub(u.a4Twist.mul(tanh(q.length().mul(4)))));
      const p = vec4(q, w).toVar();
      const xw = rot2(vec2(p.x, p.w), u.a4Angles.x);
      p.x.assign(xw.x);
      p.w.assign(xw.y);
      const yw = rot2(vec2(p.y, p.w), u.a4Angles.y);
      p.y.assign(yw.x);
      p.w.assign(yw.y);
      const zw = rot2(vec2(p.z, p.w), u.a4Angles.z);
      p.z.assign(zw.x);
      p.w.assign(zw.y);
      const scale = float(1).toVar();
      const trap = float(1e9).toVar();
      Loop({ end: u.a4Folds, start: 0, type: 'int' }, () => {
        p.assign(fract(p.mul(0.5).add(0.5)).mul(2).sub(1));
        const r2 = p.dot(p).max(MIN_RADIUS_SQ);
        trap.assign(trap.min(r2));
        const k = u.a4Scale.div(r2);
        p.mulAssign(k);
        scale.mulAssign(k);
      });
      const ap = abs(p).div(scale);
      const tubes = min(
        vec2(ap.y, ap.w).length(),
        vec2(ap.x, ap.z).length()
      ).mul(0.55);
      const sheets = abs(p.y).div(scale);
      return vec3(
        select(u.a4Sheets.greaterThan(0.5), sheets, tubes),
        scale,
        trap
      );
    }),
    'apollian4Core',
    'vec3'
  );
}

function discCore(u) {
  return layout(
    Fn(([q]) => {
      const p = vec4(
        q.x.mul(0.5),
        q.y.mul(0.5).add(u.discDrift),
        q.z.mul(0.5),
        1
      ).toVar();
      const trap = float(1e9).toVar();
      Loop({ end: u.discFolds, start: 0, type: 'int' }, () => {
        const f = floorMod(p.xyz.sub(1), float(2)).sub(1);
        const r2 = f.dot(f).max(MIN_RADIUS_SQ);
        trap.assign(trap.min(r2));
        const k = u.discScale.div(r2);
        p.assign(vec4(f, p.w).mul(k));
      });
      return vec3(abs(p.y.div(p.w)).mul(0.5), p.w, trap);
    }),
    'discCore',
    'vec3'
  );
}

function kleinianCore(u) {
  return layout(
    Fn(([q]) => {
      const p = vec3(q).toVar();
      const scale = float(1).toVar();
      const trap = float(1e9).toVar();
      Loop({ end: u.kleinFolds, start: 0, type: 'int' }, () => {
        p.assign(clamp(p, u.kleinMins.xyz, u.kleinMaxs.xyz).mul(2).sub(p));
        const r2 = p.dot(p).max(MIN_RADIUS_SQ);
        trap.assign(trap.min(r2));
        const k = max(u.kleinMins.w.div(r2), 1);
        p.mulAssign(k);
        scale.mulAssign(k);
      });
      const rxy = vec2(p.x, p.y).length();
      const d = max(rxy.sub(u.kleinMaxs.w), rxy.mul(p.z).div(p.length()))
        .mul(0.7)
        .div(scale);
      return vec3(d, scale, trap);
    }),
    'kleinianCore',
    'vec3'
  );
}

// The packing's grid lookup: every sphere within `margin` of a cell is on
// its list, so min(listed, margin) bounds the distance from below.
function packingCore(u, buffers) {
  const spheres = storage(
    buffers.spheres,
    'vec4',
    buffers.spheres.count
  ).toReadOnly();
  const starts = storage(
    buffers.starts,
    'uint',
    buffers.starts.count
  ).toReadOnly();
  const indices = storage(
    buffers.indices,
    'uint',
    buffers.indices.count
  ).toReadOnly();
  const res = PACKING_GRID;
  const margin = 2 / res;
  return layout(
    Fn(([p]) => {
      const d = float(margin).toVar();
      const generation = float(0).toVar();
      const radius = float(1).toVar();
      const outside = max(max(abs(p.x), abs(p.y)), abs(p.z)).greaterThanEqual(
        1
      );
      If(outside, () => {
        d.assign(p.length().sub(1));
      }).Else(() => {
        const cell = clamp(floor(p.add(1).mul(res / 2)), 0, res - 1);
        const c = int(
          cell.z
            .mul(res * res)
            .add(cell.y.mul(res))
            .add(cell.x)
        );
        const s0 = int(starts.element(c));
        const s1 = int(starts.element(c.add(1)));
        Loop({ end: s1, start: s0, type: 'int' }, ({ i }) => {
          const s = spheres.element(int(indices.element(i)));
          const r = abs(s.w);
          const dist = p
            .sub(s.xyz)
            .length()
            .sub(r.mul(float(1).sub(u.classicGap)));
          If(dist.lessThan(d), () => {
            d.assign(dist);
            radius.assign(r);
            generation.assign(select(s.w.lessThan(0), float(1), float(0)));
          });
        });
      });
      return vec3(d, radius, generation);
    }),
    'packingCore',
    'vec3'
  );
}

function boundDistance(u, p) {
  const sphere = p.length().sub(1);
  const disc = max(abs(p.y).sub(u.discHalf), vec2(p.x, p.z).length().sub(1));
  const q = abs(p).sub(vec3(0.75, u.cubeHalf, 0.75));
  const cube = q
    .max(0)
    .length()
    .add(min(max(q.x, max(q.y, q.z)), 0));
  const open = p.length().sub(2.5);
  return select(
    u.boundKind.equal(0),
    sphere,
    select(u.boundKind.equal(1), disc, select(u.boundKind.equal(2), cube, open))
  );
}

const depthOf = (scale, folds) =>
  scale.max(1).log2().div(folds.toFloat().mul(2)).clamp(0, 1);

// The solid in object space, as the CPU kernel's createField: the family
// field less thickness, the bound, and (if on) the section cut. `info`
// returns vec3(s, colour source blend, 1 on the cut face).
export default function createObjectField(family, u, buffers) {
  const core =
    family === 'classic'
      ? packingCore(u, buffers)
      : { apollian4: apollian4Core, disc: discCore, kleinian: kleinianCore }[
          family
        ](u);
  const folds = {
    apollian4: u.a4Folds,
    classic: u.kleinFolds,
    disc: u.discFolds,
    kleinian: u.kleinFolds,
  }[family];

  const raw = (p) => {
    if (family === 'classic') return core(p);
    const q = p.mul(u.fieldScale).add(u.fieldOffset);
    const r = core(q);
    return vec3(r.x.div(u.fieldScale).sub(u.thickness), r.y, r.z);
  };

  const shape = (p, s) => {
    const bounded = max(s, boundDistance(u, p));
    const plane = p.dot(u.cutNormal).sub(u.cutOffset);
    const cut = select(u.cutOn.greaterThan(0.5), plane, float(-1e9));
    return vec2(
      max(bounded, cut),
      select(cut.greaterThan(bounded), float(1), float(0))
    );
  };

  const distance = layout(
    Fn(([p]) => shape(p, raw(p).x).x),
    'objectDistance',
    'float'
  );

  const makeInfo = (withCut) =>
    layout(
      Fn(([p]) => {
        const r = raw(p);
        const s = withCut
          ? shape(p, r.x)
          : vec2(max(r.x, boundDistance(u, p)), float(0));
        const trap =
          family === 'classic'
            ? r.z.div(8).clamp(0, 1)
            : r.z.sqrt().clamp(0, 1);
        const depth =
          family === 'classic'
            ? float(1).div(r.y).log2().div(7).clamp(0, 1)
            : depthOf(r.y, folds);
        const w = u.colorWeights;
        const sources = vec4(
          trap,
          depth,
          p.length().clamp(0, 1),
          p.y.mul(0.5).add(0.5).clamp(0, 1)
        );
        const total = w.x.add(w.y).add(w.z).add(w.w).max(1e-6);
        return vec3(s.x, sources.dot(w).div(total), s.y);
      }),
      withCut ? 'objectInfo' : 'sliceInfo',
      'vec3'
    );
  const info = makeInfo(true);
  const sliceInfo = makeInfo(false);

  const sliceDistance = layout(
    Fn(([p]) => max(raw(p).x, boundDistance(u, p))),
    'sliceDistance',
    'float'
  );

  return { distance, info, sliceDistance, sliceInfo };
}
