import { Fn, Loop, float, floor, fract, vec2, vec3 } from 'three/tsl';

export const hash2 = Fn(([xIn]) => {
  const k = vec2(0.3183099, 0.3678794);
  const x = xIn.mul(k).add(k.yx).toVar();

  return fract(k.mul(16).mul(fract(x.x.mul(x.y).mul(x.x.add(x.y)))))
    .mul(2)
    .sub(1);
});

// Gradient noise returning the value in x and its derivatives in yz, from
// https://www.shadertoy.com/view/XdXBRH. The erosion filter needs the
// derivatives, not just the value — they are the input slope the gullies align
// themselves to.
export const noised = Fn(([p]) => {
  const i = floor(p).toVar();
  const f = fract(p).toVar();

  const u = f
    .mul(f)
    .mul(f)
    .mul(f.mul(f.mul(6).sub(15)).add(10))
    .toVar();
  const du = f
    .mul(f)
    .mul(30)
    .mul(f.mul(f.sub(2)).add(1))
    .toVar();

  const ga = hash2(i).toVar();
  const gb = hash2(i.add(vec2(1, 0))).toVar();
  const gc = hash2(i.add(vec2(0, 1))).toVar();
  const gd = hash2(i.add(vec2(1, 1))).toVar();

  const va = ga.dot(f).toVar();
  const vb = gb.dot(f.sub(vec2(1, 0))).toVar();
  const vc = gc.dot(f.sub(vec2(0, 1))).toVar();
  const vd = gd.dot(f.sub(vec2(1, 1))).toVar();

  const corner = va.sub(vb).sub(vc).add(vd).toVar();

  const value = va
    .add(u.x.mul(vb.sub(va)))
    .add(u.y.mul(vc.sub(va)))
    .add(u.x.mul(u.y).mul(corner));

  const gradient = ga
    .add(u.x.mul(gb.sub(ga)))
    .add(u.y.mul(gc.sub(ga)))
    .add(u.x.mul(u.y).mul(ga.sub(gb).sub(gc).add(gd)))
    .add(du.mul(u.yx.mul(corner).add(vec2(vb, vc)).sub(va)));

  return vec3(value, gradient);
});

export const fractalNoise = Fn(([p, frequency, octaves, lacunarity, gain]) => {
  const total = vec3(0).toVar();
  const nf = float(frequency).toVar();
  const na = float(1).toVar();

  Loop({ end: octaves, start: 0, type: 'int' }, () => {
    total.addAssign(
      noised(p.mul(nf))
        .mul(na)
        .mul(vec3(1, nf, nf))
    );
    na.mulAssign(gain);
    nf.mulAssign(lacunarity);
  });

  return total;
});

// Buffer B of the reference: a supplemental detail texture that breaks up the
// diffuse and perturbs the water normal.
export const detailNoise = Fn(([p]) => {
  const total = vec3(0).toVar();
  const a = float(0.5).toVar();
  const f = float(2).toVar();

  Loop(8, () => {
    total.addAssign(noised(p.mul(f)).mul(a));
    a.mulAssign(0.95);
    f.mulAssign(2);
  });

  return total;
});
