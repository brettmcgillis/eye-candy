import { float, instancedBufferAttribute, uv, vec3 } from 'three/tsl';

export default function bladeFrame({
  chunkOffsetX = 0,
  chunkOffsetZ = 0,
  store,
}) {
  const offset = instancedBufferAttribute(store.offsetAttribute);
  const data = instancedBufferAttribute(store.dataAttribute);
  const clump = instancedBufferAttribute(store.clumpAttribute);
  const cosA = data.x.cos();
  const sinA = data.x.sin();

  return {
    clump,
    data,
    offset,
    rotateY: (v) =>
      vec3(
        v.x.mul(cosA).add(v.z.mul(sinA)),
        v.y,
        v.z.mul(cosA).sub(v.x.mul(sinA))
      ),
    t: uv().y,
    worldX: offset.x.add(float(chunkOffsetX)),
    worldZ: offset.z.add(float(chunkOffsetZ)),
  };
}
