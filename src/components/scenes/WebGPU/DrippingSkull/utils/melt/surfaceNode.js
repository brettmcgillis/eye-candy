import {
  Fn,
  If,
  attribute,
  instanceIndex,
  instancedArray,
  int,
  normalLocal,
  positionLocal,
  storage,
  texture,
  transformNormalToView,
  uniform,
  varying,
  vec4,
  vertexIndex,
  wgsl,
  wgslFn,
} from 'three/tsl';

// eslint-disable-next-line import/no-unresolved
import source from './surface.wgsl?raw';

const surface = wgslFn(
  `
fn skullSurface(p: vec3f, n: vec3f, fade: f32, room: f32, blobs: texture_2d<f32>, trails: texture_2d<f32>, grid: texture_2d<f32>, pools: texture_2d<f32>, gridMin: vec3f, gridSize: f32, blobCount: i32, trailCount: i32, poolCount: i32, maxBlobs: i32, points: i32, poolN: i32, gravity: vec3f) -> mat3x3f {
  let field = meltField(p, n, blobs, trails, grid, gridMin, gridSize, blobCount, trailCount, maxBlobs, points);
  let cl = max(0.5 * room, 1e-6); let attenuation = exp(-fade * field.w / cl);
  let h = cl * (1.0 - attenuation); let grad = field.xyz * fade * attenuation;
  let m = n + 0.3 * (gravity - n * dot(n, gravity));
  let e1 = normalize(cross(n, select(vec3f(1.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0), abs(n.y) < 0.9)));
  let e2 = cross(n, e1);
  let pool = meltPools(p, n, h * m, e1 + dot(grad, e1) * m, e2 + dot(grad, e2) * m, h, pools, poolCount, poolN);
  return mat3x3f(pool[0].xyz, normalize(cross(pool[1].xyz, pool[2].xyz)), vec3f(pool[0].w, 0.0, 0.0));
}`,
  [wgsl(source)]
);

export default function createSurfaceNodes(
  shape,
  field,
  pendants,
  layout,
  pixelDetail
) {
  const scalarKeys = ['gridSize', 'blobCount', 'trailCount'];
  const u = Object.fromEntries(
    scalarKeys.map((key) => [
      key,
      uniform(field.uniforms[key].value, key === 'gridSize' ? 'float' : 'int'),
    ])
  );
  const poolCount = uniform(0, 'int');
  const gridMin = uniform(field.uniforms.gridMin.value);
  const gravity = uniform(field.uniforms.gravityObj.value[0]);
  const textures = ['blobTex', 'trailTex', 'gridTex'].map((key) =>
    texture(field.uniforms[key].value)
  );
  const poolTexture = texture(pendants.tex);
  const evaluate = (p, n, fade, room) =>
    surface(
      p,
      n,
      fade,
      room,
      ...textures,
      poolTexture,
      gridMin,
      u.gridSize,
      u.blobCount,
      u.trailCount,
      poolCount,
      int(field.MAXB),
      int(field.P),
      int(layout.N),
      gravity
    );
  const { geometry } = shape;
  const { count } = geometry.attributes.position;
  const rest = new Float32Array(count * 4);
  const normals = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    rest.set(
      geometry.attributes.position.array.subarray(i * 3, i * 3 + 3),
      i * 4
    );
    rest[i * 4 + 3] = geometry.attributes.fade.getX(i);
    normals.set(
      geometry.attributes.normal.array.subarray(i * 3, i * 3 + 3),
      i * 4
    );
    normals[i * 4 + 3] = geometry.attributes.clearance.getX(i);
  }
  const restBuffer = instancedArray(rest, 'vec4');
  const normalBuffer = instancedArray(normals, 'vec4');
  const offsets = instancedArray(count, 'vec4');
  const displacedNormals = instancedArray(count, 'vec4');
  const compute = Fn(() => {
    const p = restBuffer.element(instanceIndex);
    const n = normalBuffer.element(instanceIndex);
    const result = evaluate(p.xyz, n.xyz, p.w, n.w).toVar();
    offsets
      .element(instanceIndex)
      .assign(vec4(result.element(0), result.element(2).x));
    displacedNormals.element(instanceIndex).assign(vec4(result.element(1), 0));
  })()
    .compute(count)
    .setName('skullMeltSurface');
  const offset = storage(offsets.value, 'vec4', count)
    .toReadOnly()
    .element(vertexIndex);
  const bakedNormal = storage(displacedNormals.value, 'vec4', count)
    .toReadOnly()
    .element(vertexIndex).xyz;
  const restPosition = varying(positionLocal);
  const restNormal = varying(normalLocal);
  const detail = uniform(pixelDetail ? 1 : 0);
  const smoothNormal = varying(bakedNormal);
  const bakedHeight = varying(offset.w);
  const result = Fn(() => {
    const shaded = vec4(smoothNormal, bakedHeight).toVar();
    If(detail.greaterThan(0.5), () => {
      const exact = evaluate(
        restPosition,
        restNormal.normalize(),
        varying(attribute('fade', 'float')),
        varying(attribute('clearance', 'float'))
      ).toVar();
      shaded.assign(vec4(exact.element(1), exact.element(2).x));
    });
    return shaded;
  })().toVar();
  const height = result.w;
  const normal = result.xyz;
  return {
    position: positionLocal.add(offset.xyz),
    normal: transformNormalToView(normal.normalize()),
    height,
    compute,
    setDetail(enabled) {
      detail.value = enabled ? 1 : 0;
    },
    sync(countPools) {
      scalarKeys.forEach((key) => {
        u[key].value = field.uniforms[key].value;
      });
      poolCount.value = countPools;
    },
    dispose() {
      compute.dispose();
      [restBuffer, normalBuffer, offsets, displacedNormals].forEach((node) =>
        node.value.dispose()
      );
    },
  };
}
