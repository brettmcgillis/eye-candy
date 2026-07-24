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

import { StructuredArray } from './StructuredArray';

const MAX_SPHERE_COLLIDERS = 4;
const SPHERE_COLLISION_MARGIN = 0.02;
const MAX_BOX_COLLIDERS = 4;
const BOX_COLLISION_MARGIN = 0.002;
const MAX_PLANE_COLLIDERS = 4;
const PLANE_COLLISION_MARGIN = 0.001;

export class VerletPhysics {
  vertices = [];

  springs = [];

  colliders = [];

  bvhColliders = [];

  sphereColliders = [];

  boxColliders = [];

  planeColliders = [];

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

  async bake(renderer, opts = {}) {
    this.renderer = renderer;
    // null disables the floor entirely (use for freely-floating objects like cloth leaves)
    this.yFloor = Object.prototype.hasOwnProperty.call(opts, 'yFloor')
      ? opts.yFloor
      : 0;
    this.vertexCount = this.vertices.length;
    this.springCount = this.springs.length;
    this.objectCount = this.objects.length;

    this.bvhColliders = [];
    this.sphereColliders = [];
    this.boxColliders = [];
    this.planeColliders = [];
    this.colliders.forEach((collider) => {
      if (collider?.findClosestPoint) {
        this.bvhColliders.push(collider);
      } else if (collider?.position && typeof collider.radius === 'number') {
        if (this.sphereColliders.length < MAX_SPHERE_COLLIDERS) {
          this.sphereColliders.push(collider);
        }
      } else if (collider?.center && collider?.size) {
        if (this.boxColliders.length < MAX_BOX_COLLIDERS) {
          this.boxColliders.push(collider);
        }
      } else if (collider?.normal && collider?.point) {
        if (this.planeColliders.length < MAX_PLANE_COLLIDERS) {
          this.planeColliders.push(collider);
        }
      }
    });

    this.uniforms.dampening = uniform(0.995);
    this.uniforms.time = uniform(0.0);
    this.uniforms.stiffness = uniform(0.8);
    this.uniforms.friction = uniform(0.0);
    this.uniforms.maxVelocity = uniform(0.01);
    this.uniforms.sphereColliderPos = [];
    this.uniforms.sphereColliderRadius = [];
    this.uniforms.sphereColliderEnabled = [];
    this.uniforms.boxColliderMin = [];
    this.uniforms.boxColliderMax = [];
    this.uniforms.boxColliderEnabled = [];
    this.uniforms.planeColliderNormal = [];
    this.uniforms.planeColliderPoint = [];
    this.uniforms.planeColliderEnabled = [];

    for (let i = 0; i < MAX_SPHERE_COLLIDERS; i += 1) {
      this.uniforms.sphereColliderPos.push(
        uniform(new THREE.Vector3(10, 10, 10))
      );
      this.uniforms.sphereColliderRadius.push(uniform(0.12));
      this.uniforms.sphereColliderEnabled.push(uniform(0.0));
    }

    for (let i = 0; i < MAX_BOX_COLLIDERS; i += 1) {
      this.uniforms.boxColliderMin.push(uniform(new THREE.Vector3(10, 10, 10)));
      this.uniforms.boxColliderMax.push(uniform(new THREE.Vector3(10, 10, 10)));
      this.uniforms.boxColliderEnabled.push(uniform(0.0));
    }

    for (let i = 0; i < MAX_PLANE_COLLIDERS; i += 1) {
      this.uniforms.planeColliderNormal.push(
        uniform(new THREE.Vector3(0, 1, 0))
      );
      this.uniforms.planeColliderPoint.push(
        uniform(new THREE.Vector3(0, 0, 0))
      );
      this.uniforms.planeColliderEnabled.push(uniform(0.0));
    }

    this.boxColliders.forEach((collider, i) => {
      const { center } = collider;
      const { size } = collider;
      const half = size.clone().multiplyScalar(0.5);
      this.uniforms.boxColliderMin[i].value.copy(center).sub(half);
      this.uniforms.boxColliderMax[i].value.copy(center).add(half);
      this.uniforms.boxColliderEnabled[i].value = 1.0;
    });

    this.planeColliders.forEach((collider, i) => {
      this.uniforms.planeColliderNormal[i].value
        .copy(collider.normal)
        .normalize();
      this.uniforms.planeColliderPoint[i].value.copy(collider.point);
      this.uniforms.planeColliderEnabled[i].value = 1.0;
    });

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

      // Clamp velocity to prevent simulation explosion when spring forces spike
      // during collision (same guard as createClothSimulation's maxVelocityU).
      const speed = force.length().max(0.000001).toVar('verletSpeed');
      If(speed.greaterThan(this.uniforms.maxVelocity), () => {
        force.mulAssign(this.uniforms.maxVelocity.div(speed));
      });

      const projectedPoint = position.add(force).toVar();
      const forceSet = force.toVar();

      if (this.yFloor !== null) {
        const yFloorVal = float(this.yFloor);
        If(projectedPoint.y.lessThan(yFloorVal), () => {
          force.y.subAssign(projectedPoint.y.sub(yFloorVal));
          projectedPoint.y.assign(yFloorVal);
          // Contact friction (breeze semantics): scale retained velocity by
          // (1 - friction). Default friction is 0 — a no-op.
          forceSet.mulAssign(this.uniforms.friction.oneMinus());
        });
      }

      this.bvhColliders.forEach((collider, colliderIndex) => {
        // Use a minimum search radius large enough to reliably catch the thin pole geometry.
        const searchDistSq = float(0.0025);
        const [closestPoint, closestNormal] = collider.findClosestPoint(
          projectedPoint,
          searchDistSq
        );
        const closestPointDelta = closestPoint
          .sub(projectedPoint)
          .toVar(`closestPointDelta${colliderIndex}`);
        If(dot(closestPointDelta, closestNormal).greaterThan(0), () => {
          projectedPoint.assign(closestPoint);
          // Remove inward velocity component so the vertex doesn't build up
          // speed into the collider and explode on the next frame.
          const vDotN = forceSet
            .dot(closestNormal)
            .toVar(`bvhVDotN${colliderIndex}`);
          If(vDotN.lessThan(0), () => {
            forceSet.subAssign(closestNormal.mul(vDotN));
          });
          // Contact friction (breeze semantics) — no-op at the default 0.
          forceSet.mulAssign(this.uniforms.friction.oneMinus());
        });
      });

      for (let i = 0; i < MAX_SPHERE_COLLIDERS; i += 1) {
        const spherePos = this.uniforms.sphereColliderPos[i];
        const sphereRadius = this.uniforms.sphereColliderRadius[i];
        const sphereEnabled = this.uniforms.sphereColliderEnabled[i];
        const toSphere = projectedPoint.sub(spherePos).toVar(`sphereDelta${i}`);
        const dist = toSphere.length().max(0.000001).toVar(`sphereDist${i}`);
        const effectiveRadius = sphereRadius
          .add(SPHERE_COLLISION_MARGIN)
          .toVar(`sphereRadius${i}`);

        If(
          sphereEnabled
            .greaterThan(0.5)
            .and(effectiveRadius.sub(dist).greaterThan(0)),
          () => {
            const normal = toSphere.div(dist).toVar(`sphereNormal${i}`);
            const surface = spherePos.add(normal.mul(effectiveRadius));
            projectedPoint.assign(surface);
            // Remove inward velocity component — prevents velocity buildup that
            // causes vertices to shoot to infinity on the next frame.
            const vDotN = forceSet.dot(normal).toVar(`sphereVDotN${i}`);
            If(vDotN.lessThan(0), () => {
              forceSet.subAssign(normal.mul(vDotN));
            });
          }
        );
      }

      for (let i = 0; i < MAX_BOX_COLLIDERS; i += 1) {
        const boxMin = this.uniforms.boxColliderMin[i];
        const boxMax = this.uniforms.boxColliderMax[i];
        const boxEnabled = this.uniforms.boxColliderEnabled[i];

        const insideX = projectedPoint.x
          .greaterThan(boxMin.x)
          .and(projectedPoint.x.lessThan(boxMax.x));
        const insideY = projectedPoint.y
          .greaterThan(boxMin.y)
          .and(projectedPoint.y.lessThan(boxMax.y));
        const insideZ = projectedPoint.z
          .greaterThan(boxMin.z)
          .and(projectedPoint.z.lessThan(boxMax.z));

        If(
          boxEnabled.greaterThan(0.5).and(insideX.and(insideY).and(insideZ)),
          () => {
            const distToMinX = projectedPoint.x
              .sub(boxMin.x)
              .toVar(`boxMinX${i}`);
            const distToMaxX = boxMax.x
              .sub(projectedPoint.x)
              .toVar(`boxMaxX${i}`);
            const distToMinY = projectedPoint.y
              .sub(boxMin.y)
              .toVar(`boxMinY${i}`);
            const distToMaxY = boxMax.y
              .sub(projectedPoint.y)
              .toVar(`boxMaxY${i}`);
            const distToMinZ = projectedPoint.z
              .sub(boxMin.z)
              .toVar(`boxMinZ${i}`);
            const distToMaxZ = boxMax.z
              .sub(projectedPoint.z)
              .toVar(`boxMaxZ${i}`);

            const nearest = distToMinX.toVar(`boxNearest${i}`);
            const faceId = uint(0).toVar(`boxFace${i}`);

            If(distToMaxX.lessThan(nearest), () => {
              nearest.assign(distToMaxX);
              faceId.assign(uint(1));
            });
            If(distToMinY.lessThan(nearest), () => {
              nearest.assign(distToMinY);
              faceId.assign(uint(2));
            });
            If(distToMaxY.lessThan(nearest), () => {
              nearest.assign(distToMaxY);
              faceId.assign(uint(3));
            });
            If(distToMinZ.lessThan(nearest), () => {
              nearest.assign(distToMinZ);
              faceId.assign(uint(4));
            });
            If(distToMaxZ.lessThan(nearest), () => {
              faceId.assign(uint(5));
            });

            If(faceId.equal(uint(0)), () => {
              projectedPoint.x.assign(
                boxMin.x.sub(float(BOX_COLLISION_MARGIN))
              );
              If(forceSet.x.greaterThan(0), () => {
                forceSet.x.assign(0);
              });
            });
            If(faceId.equal(uint(1)), () => {
              projectedPoint.x.assign(
                boxMax.x.add(float(BOX_COLLISION_MARGIN))
              );
              If(forceSet.x.lessThan(0), () => {
                forceSet.x.assign(0);
              });
            });
            If(faceId.equal(uint(2)), () => {
              projectedPoint.y.assign(
                boxMin.y.sub(float(BOX_COLLISION_MARGIN))
              );
              If(forceSet.y.greaterThan(0), () => {
                forceSet.y.assign(0);
              });
            });
            If(faceId.equal(uint(3)), () => {
              projectedPoint.y.assign(
                boxMax.y.add(float(BOX_COLLISION_MARGIN))
              );
              If(forceSet.y.lessThan(0), () => {
                forceSet.y.assign(0);
              });
            });
            If(faceId.equal(uint(4)), () => {
              projectedPoint.z.assign(
                boxMin.z.sub(float(BOX_COLLISION_MARGIN))
              );
              If(forceSet.z.greaterThan(0), () => {
                forceSet.z.assign(0);
              });
            });
            If(faceId.equal(uint(5)), () => {
              projectedPoint.z.assign(
                boxMax.z.add(float(BOX_COLLISION_MARGIN))
              );
              If(forceSet.z.lessThan(0), () => {
                forceSet.z.assign(0);
              });
            });

            forceSet.mulAssign(this.uniforms.friction.oneMinus());
          }
        );
      }

      for (let i = 0; i < MAX_PLANE_COLLIDERS; i += 1) {
        const planeNormal = this.uniforms.planeColliderNormal[i];
        const planePoint = this.uniforms.planeColliderPoint[i];
        const planeEnabled = this.uniforms.planeColliderEnabled[i];
        const signedDist = projectedPoint
          .sub(planePoint)
          .dot(planeNormal)
          .toVar(`planeSignedDist${i}`);

        If(
          planeEnabled
            .greaterThan(0.5)
            .and(signedDist.lessThan(float(PLANE_COLLISION_MARGIN))),
          () => {
            const pushDist = float(PLANE_COLLISION_MARGIN)
              .sub(signedDist)
              .toVar(`planePushDist${i}`);
            projectedPoint.addAssign(planeNormal.mul(pushDist));
            const vDotN = forceSet.dot(planeNormal).toVar(`planeVDotN${i}`);
            If(vDotN.lessThan(0), () => {
              forceSet.subAssign(planeNormal.mul(vDotN));
            });
            forceSet.mulAssign(this.uniforms.friction.oneMinus());
          }
        );
      }

      this.vertexBuffer.element(instanceIndex).get('force').assign(forceSet);

      // Use projectedPoint (which reflects collision snapping) rather than
      // position + force, so collision response is applied correctly.
      this.vertexBuffer
        .element(instanceIndex)
        .get('position')
        .assign(projectedPoint);
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

  async resetObject(
    id,
    position,
    quaternion = new THREE.Quaternion(),
    scale = 1
  ) {
    this.objects[id].position.copy(position);
    const scaleVec = new THREE.Vector3(scale, scale, scale);
    const matrix = new THREE.Matrix4().compose(position, quaternion, scaleVec);
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

    for (let i = 0; i < MAX_SPHERE_COLLIDERS; i += 1) {
      const collider = this.sphereColliders[i];
      if (collider) {
        this.uniforms.sphereColliderPos[i].value.copy(collider.position);
        this.uniforms.sphereColliderRadius[i].value = collider.radius;
        this.uniforms.sphereColliderEnabled[i].value =
          collider.enabled === false ? 0 : 1;
      } else {
        this.uniforms.sphereColliderEnabled[i].value = 0;
      }
    }

    this.frameNum++;

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
