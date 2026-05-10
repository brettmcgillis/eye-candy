import {
  Fn,
  If,
  Loop,
  Return,
  dot,
  float,
  instanceIndex,
  instancedArray,
  mix,
  select,
  uint,
  uniform,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { StructuredArray } from './StructuredArray.js';

export class VerletPhysics {
  vertices = [];

  springs = [];

  colliders = [];

  forces = [];

  uniforms = {};

  kernels = {};

  objects = [];

  frameNum = 0;

  timeSinceLastStep = 0;

  time = 0;

  isBaked = false;

  renderer = null;

  addObject() {
    const id = this.objects.length;
    const object = {
      id,
      position: new THREE.Vector3(),
      vertexStart: this.vertices.length,
      vertexCount: 0,
      springStart: this.springs.length,
      springCount: 0,
    };
    this.objects.push(object);
    return object;
  }

  addCollider(collider) {
    this.colliders.push(collider);
  }

  addForce(force) {
    this.forces.push(force);
  }

  addVertex(objectId, position, fixed = false) {
    const vertex = new THREE.Vector3().copy(position);
    vertex.id = this.vertices.length;
    vertex.springs = [];
    vertex.fixed = fixed;
    this.vertices.push(vertex);
    this.objects[objectId].vertexCount++;
    return vertex;
  }

  addSpring(objectId, vertex0, vertex1) {
    const id = this.springs.length;
    vertex0.springs.push({ id, sign: 1 });
    vertex1.springs.push({ id, sign: -1 });
    const restLength = vertex0.distanceTo(vertex1);
    this.springs.push({ id, vertex0, vertex1, restLength });
    this.objects[objectId].springCount++;
    return id;
  }

  async bake(renderer) {
    this.renderer = renderer;
    this.vertexCount = this.vertices.length;
    this.springCount = this.springs.length;
    this.objectCount = this.objects.length;

    this.uniforms.dampening = uniform(0.995);
    this.uniforms.time = uniform(0.0);
    this.uniforms.stiffness = uniform(0.8);
    this.uniforms.friction = uniform(0.0);

    const vertexStruct = {
      position: 'vec3',
      isFixed: 'uint',
      initialPosition: 'vec3',
      springPtr: 'uint',
      force: 'vec3',
      springCount: 'uint',
      smoothedPosition: 'vec3',
    };
    this.vertexBuffer = new StructuredArray(
      vertexStruct,
      this.vertexCount,
      'verletVertices'
    );

    const springStruct = {
      restLength: 'float',
      vertex0: 'uint',
      vertex1: 'uint',
      dummy: 'float',
    };
    this.springBuffer = new StructuredArray(
      springStruct,
      this.springCount,
      'verletSprings'
    );

    const influencerArray = new Int32Array(this.springCount * 2);
    let influencerPtr = 0;

    this.vertices.forEach((vertex) => {
      const { id, springs, fixed } = vertex;
      this.vertexBuffer.set(id, 'position', vertex.customPos || vertex);
      this.vertexBuffer.set(id, 'smoothedPosition', vertex.customPos || vertex);
      this.vertexBuffer.set(id, 'initialPosition', vertex);
      this.vertexBuffer.set(id, 'isFixed', fixed ? 1 : 0);
      this.vertexBuffer.set(id, 'springPtr', influencerPtr);
      if (!fixed) {
        this.vertexBuffer.set(id, 'springCount', springs.length);
        springs.forEach((s) => {
          influencerArray[influencerPtr] = (s.id + 1) * s.sign;
          influencerPtr++;
        });
      }
    });

    this.influencerData = instancedArray(influencerArray, 'int');

    this.springs.forEach((spring) => {
      const { id, vertex0, vertex1, restLength } = spring;
      this.springBuffer.set(id, 'vertex0', vertex0.id);
      this.springBuffer.set(id, 'vertex1', vertex1.id);
      this.springBuffer.set(id, 'restLength', restLength);
    });

    this.springForceData = instancedArray(this.springCount, 'vec3');

    const firstVertexIdArray = new Uint32Array(this.objectCount);
    this.objects.forEach((object) => {
      firstVertexIdArray[object.id] = object.vertexStart;
    });
    this.firstVertexIdData = instancedArray(firstVertexIdArray, 'uint');
    this.objectPositionData = instancedArray(this.objectCount, 'vec3');

    this.kernels.computeSpringForces = Fn(() => {
      const spring = this.springBuffer.element(instanceIndex);
      const v0id = spring.get('vertex0');
      const v1id = spring.get('vertex1');
      const restLength = spring.get('restLength');
      const v0 = this.vertexBuffer.element(v0id).get('position');
      const v1 = this.vertexBuffer.element(v1id).get('position');
      const delta = v1.sub(v0).toVar();
      const dist = delta.length().max(0.000001).toVar();
      const force = dist
        .sub(restLength)
        .mul(this.uniforms.stiffness)
        .mul(delta)
        .mul(0.5)
        .div(dist);
      this.springForceData.element(instanceIndex).assign(force);
    })().compute(this.springCount);

    this.kernels.computeVertexForces = Fn(() => {
      const vertex = this.vertexBuffer.element(instanceIndex);

      If(vertex.get('isFixed').greaterThan(uint(0)), () => {
        Return();
      });

      const position = vertex.get('position').toVar();
      const ptrStart = vertex.get('springPtr').toVar();
      const springCount = vertex.get('springCount').toVar();
      const ptrEnd = ptrStart.add(springCount).toVar();

      const force = vertex.get('force').toVar();
      force.mulAssign(this.uniforms.dampening);

      Loop(
        { start: ptrStart, end: ptrEnd, type: 'uint', condition: '<' },
        ({ i }) => {
          const springPtr = this.influencerData.element(i);
          const springForce = this.springForceData.element(
            uint(springPtr.abs()).sub(uint(1))
          );
          const factor = select(springPtr.greaterThan(0), 1.0, -1.0);
          force.addAssign(springForce.mul(factor));
        }
      );

      this.forces.forEach((f) => {
        force.addAssign(f(position, this.uniforms.time));
      });

      const projectedPoint = position.add(force).toVar();

      If(projectedPoint.y.lessThan(0), () => {
        force.y.subAssign(projectedPoint.y);
        projectedPoint.y.assign(0);
      });

      if (this.colliders.length > 0) {
        // Use a minimum search radius large enough to reliably catch the thin pole geometry
        const searchDistSq = float(0.0025); // 0.05 unit radius
        const [closestPoint, closestNormal] =
          this.colliders[0].findClosestPoint(projectedPoint, searchDistSq);
        const closestPointDelta = closestPoint
          .sub(projectedPoint)
          .toVar('closestPointDelta');
        const forceSet = force.toVar();
        If(dot(closestPointDelta, closestNormal).greaterThan(0), () => {
          force.assign(closestPoint.sub(position));
          forceSet.assign(force.mul(this.uniforms.friction.oneMinus()));
        });
        this.vertexBuffer.element(instanceIndex).get('force').assign(forceSet);
      } else {
        this.vertexBuffer.element(instanceIndex).get('force').assign(force);
      }

      this.vertexBuffer.element(instanceIndex).get('position').addAssign(force);
    })().compute(this.vertexCount);

    this.kernels.smoothPositions = Fn(() => {
      const vertex = this.vertexBuffer.element(instanceIndex);
      const position = vertex.get('position');
      const smoothedPosition = vertex.get('smoothedPosition');
      vertex
        .get('smoothedPosition')
        .assign(mix(smoothedPosition, position, 0.25));
    })().compute(this.vertexCount);

    this.kernels.readPositions = Fn(() => {
      const firstVertex = this.firstVertexIdData.element(instanceIndex);
      const position = this.vertexBuffer.element(firstVertex).get('position');
      this.objectPositionData.element(instanceIndex).assign(position);
    })().compute(this.objects.length);

    this.uniforms.resetVertexStart = uniform(0, 'uint');
    this.uniforms.resetVertexCount = uniform(0, 'uint');
    this.uniforms.resetMatrix = uniform(new THREE.Matrix4());

    // Compile with the max per-object vertex count; the shader bounds-checks via resetVertexCount
    const maxPerObjectVertexCount = Math.max(
      ...this.objects.map((o) => o.vertexCount)
    );

    this.kernels.resetVertices = Fn(() => {
      If(instanceIndex.greaterThanEqual(this.uniforms.resetVertexCount), () => {
        Return();
      });
      const vertexId = this.uniforms.resetVertexStart
        .add(instanceIndex)
        .toVar();
      const vertex = this.vertexBuffer.element(vertexId);
      const initialPosition = vertex.get('initialPosition').toVar();
      const transformedPosition = this.uniforms.resetMatrix
        .mul(vec4(initialPosition, 1))
        .xyz.toVar();
      vertex.get('position').assign(transformedPosition);
      vertex.get('smoothedPosition').assign(transformedPosition);
      vertex.get('force').assign(0);
    })().compute(maxPerObjectVertexCount);

    await this.renderer.computeAsync(this.kernels.resetVertices);
    this.isBaked = true;
  }

  async readPositions() {
    await this.renderer.computeAsync(this.kernels.readPositions);
    const positions = new Float32Array(
      await this.renderer.getArrayBufferAsync(this.objectPositionData.value)
    );
    this.objects.forEach((o, index) => {
      o.position.set(
        positions[index * 4],
        positions[index * 4 + 1],
        positions[index * 4 + 2]
      );
    });
  }

  async resetObject(id, position, quaternion = new THREE.Quaternion()) {
    this.objects[id].position.copy(position);
    const scale = new THREE.Vector3(1, 1, 1);
    const matrix = new THREE.Matrix4().compose(position, quaternion, scale);
    if (this.isBaked) {
      this.uniforms.resetMatrix.value.copy(matrix);
      this.uniforms.resetVertexStart.value = this.objects[id].vertexStart;
      this.uniforms.resetVertexCount.value = this.objects[id].vertexCount;
      await this.renderer.computeAsync(this.kernels.resetVertices);
    } else {
      const { vertexStart, vertexCount } = this.objects[id];
      for (let i = vertexStart; i < vertexStart + vertexCount; i++) {
        const pos = this.vertices[i].clone();
        pos.applyMatrix4(matrix);
        this.vertices[i].customPos = pos;
      }
    }
  }

  async update(delta) {
    if (!this.isBaked) return;

    this.frameNum++;

    // Read back CPU-side positions every 50 frames for recycling checks
    if (this.frameNum % 50 === 0) {
      this.readPositions();
    }

    const stepsPerSecond = 360;
    const timePerStep = 1 / stepsPerSecond;
    const clampedDelta = Math.max(Math.min(delta, 1 / 30), 0.0001);
    this.timeSinceLastStep += clampedDelta;

    while (this.timeSinceLastStep >= timePerStep) {
      this.time += timePerStep;
      this.uniforms.time.value = this.time;
      this.timeSinceLastStep -= timePerStep;
      await this.renderer.computeAsync(this.kernels.computeSpringForces);
      await this.renderer.computeAsync(this.kernels.computeVertexForces);
    }

    await this.renderer.computeAsync(this.kernels.smoothPositions);
  }
}
