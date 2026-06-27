import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  Fn,
  attribute,
  cross,
  instanceIndex,
  mat3,
  normalize,
  uniform,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const calcLookAtMatrix = Fn(([targetImmutable]) => {
  const target = vec3(targetImmutable).toVar();
  const rr = vec3(0, 0, 1).toVar();
  const ww = vec3(normalize(target)).toVar();
  const uu = vec3(normalize(cross(ww, rr)).negate()).toVar();
  const vv = vec3(normalize(cross(uu, ww)).negate()).toVar();
  return mat3(uu, vv, ww);
}).setLayout({
  name: 'calcLookAtMatrix',
  type: 'mat3',
  inputs: [{ name: 'direction', type: 'vec3' }],
});

function createRoundedBox(width, height, depth, radius) {
  const box = new THREE.BoxGeometry(
    width - radius * 2,
    height - radius * 2,
    depth - radius * 2
  );
  const epsilon = Math.min(width, height, depth) * 0.01;
  const positionArray = box.attributes.position.array;
  const normalArray = box.attributes.normal.array;
  const indices = [...box.getIndex().array];
  const vertices = [];
  const posMap = {};
  const edgeMap = {};

  for (let i = 0; i < positionArray.length / 3; i += 1) {
    const oldPosition = new THREE.Vector3(
      positionArray[i * 3],
      positionArray[i * 3 + 1],
      positionArray[i * 3 + 2]
    );
    positionArray[i * 3] += normalArray[i * 3] * radius;
    positionArray[i * 3 + 1] += normalArray[i * 3 + 1] * radius;
    positionArray[i * 3 + 2] += normalArray[i * 3 + 2] * radius;
    const vertex = new THREE.Vector3(
      positionArray[i * 3],
      positionArray[i * 3 + 1],
      positionArray[i * 3 + 2]
    );
    vertex.normal = new THREE.Vector3(
      normalArray[i * 3],
      normalArray[i * 3 + 1],
      normalArray[i * 3 + 2]
    );
    vertex.id = i;
    vertex.faces = [];
    vertex.posHash = oldPosition
      .toArray()
      .map((v) => Math.round(v / epsilon))
      .join('_');
    posMap[vertex.posHash] = [...(posMap[vertex.posHash] || []), vertex];
    vertices.push(vertex);
  }

  vertices.forEach((vertex) => {
    const face = vertex.normal
      .toArray()
      .map((v) => Math.round(v))
      .join('_');
    // eslint-disable-next-line no-param-reassign
    vertex.face = face;
    posMap[vertex.posHash].forEach((v) => {
      v.faces.push(face);
    });
  });

  vertices.forEach((vertex) => {
    const addVertexToEdgeMap = (v, entry) => {
      edgeMap[entry] = [...(edgeMap[entry] || []), v];
    };
    vertex.faces.sort();
    const [f0, f1, f2] = vertex.faces;
    const { face } = vertex;
    if (f0 === face || f1 === face) addVertexToEdgeMap(vertex, `${f0}_${f1}`);
    if (f0 === face || f2 === face) addVertexToEdgeMap(vertex, `${f0}_${f2}`);
    if (f1 === face || f2 === face) addVertexToEdgeMap(vertex, `${f1}_${f2}`);
  });

  const addFace = (v0, v1, v2) => {
    const a = v1.clone().sub(v0);
    const b = v2.clone().sub(v0);
    if (a.cross(b).dot(v0) > 0) {
      indices.push(v0.id, v1.id, v2.id);
    } else {
      indices.push(v0.id, v2.id, v1.id);
    }
  };

  Object.keys(posMap).forEach((key) => {
    addFace(...posMap[key]);
  });

  Object.keys(edgeMap).forEach((key) => {
    const edgeVertices = edgeMap[key];
    const v0 = edgeVertices[0];
    edgeVertices.sort((v1, v2) => v1.distanceTo(v0) - v2.distanceTo(v0));
    addFace(...edgeVertices.slice(0, 3));
    addFace(...edgeVertices.slice(1, 4));
  });

  box.setIndex(indices);
  return box;
}

export default class ParticleRenderer {
  constructor(simulator) {
    this.simulator = simulator;

    const boxGeometry = BufferGeometryUtils.mergeVertices(
      new THREE.BoxGeometry(7, 7, 30),
      3
    );
    boxGeometry.attributes.position.array =
      boxGeometry.attributes.position.array.map((v) => v * 0.1);
    const roundedBoxGeometry = createRoundedBox(0.7, 0.7, 3, 0.1);

    this.defaultIndexCount = roundedBoxGeometry.index.count;
    const mergedGeometry = BufferGeometryUtils.mergeGeometries([
      roundedBoxGeometry,
      boxGeometry,
    ]);

    this.geometry = new THREE.InstancedBufferGeometry().copy(mergedGeometry);
    this.geometry.setDrawRange(0, this.defaultIndexCount);
    this.geometry.instanceCount = 0;

    this.material = new THREE.MeshStandardNodeMaterial({
      metalness: 0.9,
      roughness: 0.5,
    });

    this.uniforms = {
      depthScale: uniform(0.4),
      size: uniform(1),
    };

    const vAo = varying(0, 'vAo');
    const particle = this.simulator.particleBuffer.element(instanceIndex);

    this.material.positionNode = Fn(() => {
      const particlePosition = particle.get('position');
      const particleDensity = particle.get('density');
      const particleDirection = particle.get('direction');
      const mat = calcLookAtMatrix(particleDirection.xyz);
      vAo.assign(particlePosition.z.div(64));
      vAo.assign(vAo.mul(vAo).oneMinus());
      return mat
        .mul(attribute('position').xyz.mul(this.uniforms.size))
        .mul(particleDensity.mul(0.4).add(0.5).clamp(0, 1))
        .add(particlePosition.mul(vec3(1, 1, this.uniforms.depthScale)));
    })();

    this.material.colorNode = particle.get('color');
    this.material.aoNode = vAo;

    this.object = new THREE.Mesh(this.geometry, this.material);
    this.object.frustumCulled = false;

    this.object.onBeforeShadow = () => {
      this.geometry.setDrawRange(this.defaultIndexCount, Infinity);
    };
    this.object.onAfterShadow = () => {
      this.geometry.setDrawRange(0, this.defaultIndexCount);
    };

    const scale = 1 / 64;
    this.object.position.set(-32 * scale, 0, 0);
    this.object.scale.set(scale, scale, scale);
    this.object.castShadow = true;
    this.object.receiveShadow = true;
  }

  update(config) {
    this.uniforms.depthScale.value = config.depthScale;
    this.uniforms.size.value = config.size;
    this.geometry.instanceCount = config.particles;
    this.object.position.z = config.zOffset;
  }
}
