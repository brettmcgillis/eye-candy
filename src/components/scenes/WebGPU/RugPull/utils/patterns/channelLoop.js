import { abs, float, floor, fract, vec2, vec3 } from 'three/tsl';

import { CHANNELS, hash31, pan, triangleWave } from './shared';

export function persianCarpet7({ fragCoord, resolution, time }) {
  const offset = vec2(2.5, 2);
  const scale = -1.5;
  const t1 = 4.5 * (3 / 2);
  const t = time.div(2).add(45.87);
  const uv = fragCoord
    .sub(resolution)
    .div(resolution.y)
    .div(t1 * 128 * 2)
    .add(vec2(t.div(2), t.div(3)).div(t1 * 128 * 4))
    .toVar();
  const col = vec3(0).toVar();
  const nudge = 1 - 0.05;

  CHANNELS.forEach((channel) => {
    for (let i = 0; i < 3; i += 1) {
      const colPrev = vec3(col).toVar();
      uv.assign(
        triangleWave(uv.yx.add(scale), scale, offset)
          .negate()
          .add(triangleWave(uv, scale, offset))
      );
      uv.x.mulAssign(0.7);
      for (let j = 0; j < 3; j += 1) {
        uv.assign(triangleWave(uv.mul(nudge), scale, offset));
      }
      uv.x.divAssign(-0.7);

      if (i > 0) {
        col.assign(
          abs(col.yzx.mul(col.x).add(colPrev.mul(col.y))).div(col.x.sub(col.y))
        );
      }

      col[channel].assign(
        fract(uv.x.mul(col.x.div(8).add(1)).sub(uv.y.mul(col.y.div(8).add(1))))
      );
    }
  });

  return col;
}

export function persianRug({ fragCoord, resolution, time }) {
  const offsetXY = vec2(2, 2.5);
  const scale2 = 1.05;
  const t1 = 4.5;
  const uv = fragCoord
    .sub(resolution)
    .div(resolution.y)
    .div(t1 * 2)
    .add(pan(time, t1 * 8))
    .toVar();
  const col = vec3(0).toVar();
  let offset = 0.18;

  CHANNELS.forEach((channel) => {
    const scale = float(1.4).toVar();
    for (let i = 0; i < 9; i += 1) {
      uv.assign(
        triangleWave(uv.add(offset), scale, offsetXY).add(
          triangleWave(uv.yx, scale, offsetXY)
        )
      );
      uv.x.mulAssign(-1);
      uv.assign(triangleWave(uv, scale, offsetXY));
      scale.divAssign(col.x.add(scale2));
      offset *= scale2;
      uv.y.mulAssign(-1);
      uv.assign(uv.yx);
    }
    col[channel].assign(fract(uv.x.sub(uv.y)));
  });

  return col;
}

export function orientalRug({ fragCoord, resolution, time }) {
  const offsetXY = vec2(2, 2.5);
  const scale2 = 1.02;
  const t1 = 4;
  const uv = fragCoord
    .sub(resolution)
    .div(resolution.y)
    .div(t1 * 2)
    .add(pan(time, t1 * 8))
    .toVar();
  const col = vec3(0).toVar();
  let offset = 0.16;

  CHANNELS.forEach((channel) => {
    const scale = float(1.4).toVar();
    for (let i = 0; i < 6; i += 1) {
      uv.assign(
        triangleWave(uv.add(offset), scale, offsetXY).add(
          triangleWave(uv.yx, scale, offsetXY)
        )
      );
      uv.assign(triangleWave(uv.add(col.xy), scale, offsetXY));
      scale.divAssign(col.x.add(scale2));
      offset /= scale2;
      uv.y.divAssign(-1);
    }
    col[channel].assign(fract(uv.x.sub(uv.y)));
  });

  return col;
}

export function persianCarpet18({ fragCoord, resolution, time }) {
  const offsetXY = vec2(3, 2.5);
  const offset = 0.5;
  const t1 = 4.5 / 8;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .add(pan(time, t1 * 8))
    .toVar();
  const epoch = floor(time.div(2).add(uv.x).div(10));
  const random1 = hash31(epoch.add(3)).sub(0.5).div(12).toVar();
  const random2 = hash31(epoch.add(4)).sub(0.5).div(12).toVar();
  const scale2 = float(1.5).toVar();
  const col = vec3(0).toVar();

  CHANNELS.forEach((channel) => {
    const scale = float(1.5).toVar();
    for (let i = 0; i < 3; i += 1) {
      CHANNELS.forEach((k) => {
        uv.divAssign(scale2.negate());
        const t2 = triangleWave(uv.yx.sub(offset), scale, offsetXY);
        const t3 = triangleWave(uv, scale, offsetXY);
        uv.assign(t2.add(t3).yx);
        uv.addAssign(vec2(random1[k], random2[k]));
      });
      scale.divAssign(scale2.mul(col.x).div(8).add(1));
      scale2.subAssign(col.x.sub(1).div(4));
      col[channel].assign(abs(uv.x.sub(uv.y)));
    }
  });

  return col.mul(2);
}
