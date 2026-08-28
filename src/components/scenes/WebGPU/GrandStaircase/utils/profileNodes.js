import { clamp, int, ivec2, mix, textureLoad } from 'three/tsl';

export function sampleSlice(map, s, windowDepth, sliceCount) {
  const last = sliceCount.sub(1);
  const t = clamp(s.div(windowDepth), 0, 1).mul(last);
  const i0 = t.floor();
  const i1 = i0.add(1).min(last);
  return mix(
    textureLoad(map, ivec2(int(i0), int(0))),
    textureLoad(map, ivec2(int(i1), int(0))),
    t.sub(i0)
  );
}

export function shaftFrame(axisSample, angleSample) {
  const dir = angleSample.xy.normalize();
  return {
    axisX: axisSample.x,
    axisZ: axisSample.y,
    voidRadius: axisSample.z,
    cosA: dir.x,
    sinA: dir.y,
    angleRate: angleSample.z,
  };
}
