import { Fn, If, float, floor, int, trunc, vec3 } from 'three/tsl';

const hsvtorgb = Fn(([hsv]) => {
  const s = hsv.y;
  const v = hsv.z;

  const result = vec3().toVar();
  const h = hsv.x.sub(floor(hsv.x)).mul(6).toConst();
  const hi = int(trunc(h)).toConst();
  const f = h.sub(float(hi)).toConst();
  const p = v.mul(s.oneMinus()).toConst();
  const q = v.mul(s.mul(f).oneMinus()).toConst();
  const t = v.mul(s.mul(f.oneMinus()).oneMinus()).toConst();

  If(s.lessThan(0.0001), () => {
    result.assign(vec3(v, v, v));
  })
    .ElseIf(hi.equal(int(0)), () => {
      result.assign(vec3(v, t, p));
    })
    .ElseIf(hi.equal(int(1)), () => {
      result.assign(vec3(q, v, p));
    })
    .ElseIf(hi.equal(int(2)), () => {
      result.assign(vec3(p, v, t));
    })
    .ElseIf(hi.equal(int(3)), () => {
      result.assign(vec3(p, q, v));
    })
    .ElseIf(hi.equal(int(4)), () => {
      result.assign(vec3(t, p, v));
    })
    .Else(() => {
      result.assign(vec3(v, p, q));
    });

  return result;
}).setLayout({
  name: 'hsvtorgb',
  type: 'vec3',
  inputs: [{ name: 'hsv', type: 'vec3' }],
});

export default hsvtorgb;
