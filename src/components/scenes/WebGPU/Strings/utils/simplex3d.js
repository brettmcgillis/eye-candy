import {
  Fn,
  dot,
  float,
  floor,
  fract,
  max,
  sin,
  step,
  vec3,
  vec4,
} from 'three/tsl';

const F3 = 0.3333333;
const G3 = 0.1666667;

export const random3 = Fn(([c]) => {
  const j = float(4096)
    .mul(sin(dot(c, vec3(17, 59.4, 15))))
    .toVar();
  const z = fract(j.mul(512));
  j.mulAssign(0.125);
  const x = fract(j.mul(512));
  j.mulAssign(0.125);
  const y = fract(j.mul(512));

  return vec3(x, y, z).sub(0.5);
}).setLayout({
  name: 'stringsRandom3',
  type: 'vec3',
  inputs: [{ name: 'c', type: 'vec3' }],
});

export const simplex3d = Fn(([p]) => {
  const s = floor(p.add(dot(p, vec3(F3))));
  const x = p.sub(s).add(dot(s, vec3(G3)));

  const e = step(vec3(0), x.sub(x.yzx));
  const i1 = e.mul(e.zxy.oneMinus());
  const i2 = e.zxy.mul(e.oneMinus()).oneMinus();

  const x1 = x.sub(i1).add(G3);
  const x2 = x.sub(i2).add(2 * G3);
  const x3 = x.sub(1).add(3 * G3);

  const w = max(
    vec4(0.6).sub(vec4(dot(x, x), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
    0
  ).toVar();

  const d = vec4(
    dot(random3(s), x),
    dot(random3(s.add(i1)), x1),
    dot(random3(s.add(i2)), x2),
    dot(random3(s.add(1)), x3)
  );

  w.mulAssign(w);
  w.mulAssign(w);

  return dot(d.mul(w), vec4(52));
}).setLayout({
  name: 'stringsSimplex3d',
  type: 'float',
  inputs: [{ name: 'p', type: 'vec3' }],
});
