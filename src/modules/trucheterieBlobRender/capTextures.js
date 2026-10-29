import * as THREE from 'three/webgpu';

export function createCapTexture() {
  const texture = new THREE.DataTexture(
    new Float32Array(4),
    1,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

const uploaded = new WeakMap();
export function fillCapTexture(textures, drawn) {
  if (uploaded.get(textures) === drawn || !drawn.some((entry) => entry.cap))
    return;
  uploaded.set(textures, drawn);
  const data = new Float32Array(drawn.length * 12);
  drawn.forEach(({ cap }, index) => {
    if (!cap) return;
    const [top, middle, bottom] = cap.connections;
    const angle =
      (cap.side * Math.PI * 2) / 3 + (cap.host.up ? Math.PI / 3 : 0);
    data.set(
      [
        cap.host.size,
        top[1],
        middle[1],
        bottom[1],
        cap.topIndex,
        cap.bottomIndex,
        ...cap.offset,
        Math.cos(angle),
        Math.sin(angle),
        0,
        0,
      ],
      index * 12
    );
  });
  const { caps } = textures;
  caps.image = { data, width: 3, height: drawn.length };
  caps.dispose();
  caps.needsUpdate = true;
}
