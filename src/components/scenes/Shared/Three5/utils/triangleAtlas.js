/* eslint-disable no-param-reassign */
import {
  BufferAttribute,
  CanvasTexture,
  LinearFilter,
  Matrix3,
  SRGBColorSpace,
  Vector3,
} from 'three';

export function triangleAtlas(geometry, tile = 14) {
  const count = geometry.attributes.position.count / 3;
  const columns = Math.ceil(Math.sqrt(count));
  const size = columns * tile;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const uv = new Float32Array(count * 6);
  for (let i = 0; i < count; i += 1) {
    const x = (i % columns) * tile;
    const y = Math.floor(i / columns) * tile;
    uv.set(
      [
        (x + 1) / size,
        1 - (y + 1) / size,
        (x + tile - 1) / size,
        1 - (y + 1) / size,
        (x + 1) / size,
        1 - (y + tile - 1) / size,
      ],
      i * 6
    );
  }
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, texture, columns, tile };
}

const point = new Vector3();
const normal = new Vector3();
const normalMatrix = new Matrix3();
const fract = (value) => value - Math.floor(value);

export function bakeTriplanar(atlas, faces, source, config, matrix) {
  const ctx = atlas.canvas.getContext('2d');
  const output = ctx.createImageData(atlas.canvas.width, atlas.canvas.height);
  const input = source
    .getContext('2d')
    .getImageData(0, 0, source.width, source.height).data;
  if (matrix) normalMatrix.getNormalMatrix(matrix);
  const { tile, columns } = atlas;
  const sample = (u, v, channel) => {
    const x = Math.min(source.width - 1, Math.floor(fract(u) * source.width));
    const y = Math.min(source.height - 1, Math.floor(fract(v) * source.height));
    return input[(y * source.width + x) * 4 + channel];
  };
  faces.forEach((face, index) => {
    for (let y = 0; y < tile; y += 1) {
      for (let x = 0; x < tile; x += 1) {
        let u = Math.max(0, (x - 1) / (tile - 2));
        let v = Math.max(0, (y - 1) / (tile - 2));
        if (u + v > 1) {
          const sum = u + v;
          u /= sum;
          v /= sum;
        }
        point
          .copy(face.points[0])
          .multiplyScalar(1 - u - v)
          .addScaledVector(face.points[1], u)
          .addScaledVector(face.points[2], v);
        normal
          .copy(face.normals[0])
          .multiplyScalar(1 - u - v)
          .addScaledVector(face.normals[1], u)
          .addScaledVector(face.normals[2], v)
          .normalize();
        if (matrix) {
          point.applyMatrix4(matrix);
          normal.applyMatrix3(normalMatrix).normalize();
        }
        const wx = Math.abs(normal.x) ** config.mappingSharpness;
        const wy = Math.abs(normal.y) ** config.mappingSharpness;
        const wz = Math.abs(normal.z) ** config.mappingSharpness;
        const sum = wx + wy + wz;
        point.multiplyScalar(config.mappingScale);
        const offset =
          ((Math.floor(index / columns) * tile + y) * atlas.canvas.width +
            (index % columns) * tile +
            x) *
          4;
        for (let c = 0; c < 3; c += 1)
          output.data[offset + c] =
            (sample(point.z + 0.5, point.y + 0.5, c) * wx +
              sample(point.x + 0.5, point.z + 0.5, c) * wy +
              sample(point.x + 0.5, point.y + 0.5, c) * wz) /
            sum;
        output.data[offset + 3] = 255;
      }
    }
  });
  ctx.putImageData(output, 0, 0);
  atlas.texture.needsUpdate = true;
}
