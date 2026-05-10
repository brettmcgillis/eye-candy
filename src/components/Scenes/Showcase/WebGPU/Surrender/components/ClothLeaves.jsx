/* eslint-disable no-plusplus */
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Discard,
  Fn,
  If,
  attribute,
  cross,
  float,
  smoothstep,
  transformNormalToView,
  texture as tslTexture,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, {
  Suspense,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import { BVH } from '../physics/BVH';
import { VerletPhysics } from '../physics/VerletPhysics';
import { triNoise3Dvec } from '../physics/noise';

// Pole geometry constants — must match FlagPole.jsx
const POLE_BOTTOM_Y = -2.55;
const POLE_TOP_Y = 0.95;
const POLE_HEIGHT = POLE_TOP_Y - POLE_BOTTOM_Y;
const POLE_CENTER_Y = (POLE_TOP_Y + POLE_BOTTOM_Y) / 2;
// Thicker collision radius so thin pole acts as a meaningful deflector
const COLLIDER_RADIUS = 0.05;
const FINIAL_Y = POLE_TOP_Y;
const FINIAL_COLLIDER_RADIUS = 0.045;

// Spawn / recycle bounds in world space (Surrender scene coordinates)
const SPAWN_X_MIN = -1.8;
const SPAWN_X_MAX = -1.4;
const RECYCLE_X = 1.8;
const SPAWN_Y_MIN = -0.3;
const SPAWN_Y_MAX = 3.5;
const SPAWN_Z_MIN = -1.5;
const SPAWN_Z_MAX = 1.5;

// Per-type cloth geometry config
const LEAF_CONFIG = {
  widthSegments: 10,
  heightSegments: 10,
  segmentSize: 0.008,
};
const PETAL_CONFIG = { widthSegments: 4, heightSegments: 4, segmentSize: 0.01 };

function buildPoleColliderGeometry() {
  const cylinderGeo = new THREE.CylinderGeometry(
    COLLIDER_RADIUS,
    COLLIDER_RADIUS,
    POLE_HEIGHT,
    12
  );
  cylinderGeo.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, POLE_CENTER_Y, 0)
  );

  const sphereGeo = new THREE.SphereGeometry(FINIAL_COLLIDER_RADIUS, 12, 12);
  sphereGeo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, FINIAL_Y, 0));

  return BufferGeometryUtils.mergeGeometries([cylinderGeo, sphereGeo]);
}

function randomSpawnPosition(isInitial = false) {
  // Initial: scatter across full scene; recycle: wide band so arrivals stay staggered
  const x = isInitial
    ? THREE.MathUtils.randFloat(SPAWN_X_MIN - 2.0, RECYCLE_X)
    : THREE.MathUtils.randFloat(SPAWN_X_MIN - 4.0, SPAWN_X_MAX);
  return new THREE.Vector3(
    x,
    THREE.MathUtils.randFloat(SPAWN_Y_MIN, SPAWN_Y_MAX),
    THREE.MathUtils.randFloat(SPAWN_Z_MIN, SPAWN_Z_MAX)
  );
}

function randomRotation() {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    )
  );
}

// Builds cloth-particle geometry + material for N instances
// segmentSize controls per-particle physical + visual size
function buildClothGeometry(
  physics,
  widthSegments,
  heightSegments,
  segmentSize,
  instances,
  texture,
  colorBuffer
) {
  // Template vertex layout — one leaf shape shared across all instances
  const vertexRows = [];
  const templateVertices = [];
  const templateSprings = [];

  function addVertex(position) {
    const id = templateVertices.length;
    const v = { id, position, fixed: false };
    templateVertices.push(v);
    return v;
  }
  function addSpring(v0, v1) {
    templateSprings.push({ vertex0: v0, vertex1: v1 });
  }

  for (let y = 0; y <= heightSegments; y++) {
    const row = [];
    vertexRows.push(row);
    for (let x = 0; x <= widthSegments; x++) {
      const jx = (Math.random() * 2 - 1) * segmentSize * 0.2;
      const jy = (Math.random() * 2 - 1) * segmentSize * 0.2;
      const pos = new THREE.Vector3(
        0,
        (x - widthSegments * 0.5) * segmentSize + jx,
        (y - heightSegments * 0.5) * segmentSize + jy
      );
      row.push(addVertex(pos));
    }
  }
  for (let y = 0; y <= heightSegments; y++) {
    for (let x = 0; x <= widthSegments; x++) {
      const v = vertexRows[y][x];
      if (x > 0) addSpring(v, vertexRows[y][x - 1]);
      if (y > 0) addSpring(v, vertexRows[y - 1][x]);
      if (x > 0 && y > 0) addSpring(v, vertexRows[y - 1][x - 1]);
      if (y > 0 && x < widthSegments) addSpring(v, vertexRows[y - 1][x + 1]);
      if (x > 1) addSpring(v, vertexRows[y][x - 2]);
      if (y > 1) addSpring(v, vertexRows[y - 2][x]);
    }
  }

  // Register each instance in the physics sim
  const physicsInstances = instances.map(() => {
    const instance = physics.addObject();
    const pVerts = templateVertices.map(({ position, fixed }) =>
      physics.addVertex(instance.id, position, fixed)
    );
    templateSprings.forEach(({ vertex0, vertex1 }) => {
      physics.addSpring(instance.id, pVerts[vertex0.id], pVerts[vertex1.id]);
    });
    return instance;
  });

  // Dual-plane geometry (front + back for proper two-sided normals)
  const plane0 = new THREE.PlaneGeometry(
    1,
    1,
    widthSegments - 1,
    heightSegments - 1
  );
  plane0.deleteAttribute('uv');
  plane0.deleteAttribute('normal');
  plane0.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 1));

  const plane1 = new THREE.PlaneGeometry(
    1,
    1,
    widthSegments - 1,
    heightSegments - 1
  );
  plane1.applyQuaternion(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0))
  );
  plane1.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -1));
  plane1.deleteAttribute('uv');
  plane1.deleteAttribute('normal');

  const merged = BufferGeometryUtils.mergeGeometries([plane0, plane1]);
  const geometry = new THREE.InstancedBufferGeometry().copy(
    BufferGeometryUtils.mergeVertices(merged)
  );

  const vertexCount = geometry.attributes.position.count;
  const positionArray = geometry.attributes.position.array;
  const uvScale = 1.0 / (widthSegments - 1);
  const vertexIdsArray = new Uint32Array(4 * vertexCount);
  const sideArray = new Float32Array(3 * vertexCount);
  const uvArray = new Float32Array(2 * vertexCount);

  for (let i = 0; i < vertexCount; i++) {
    const px = positionArray[i * 3 + 0];
    const py = positionArray[i * 3 + 1];
    const pz = positionArray[i * 3 + 2];
    const xi = Math.round((px + 0.5) * (widthSegments - 1));
    const yi = Math.round((py + 0.5) * (heightSegments - 1));
    const uvx = xi * uvScale;
    const uvy = yi * uvScale;

    vertexIdsArray[i * 4 + 0] = vertexRows[yi][xi].id;
    vertexIdsArray[i * 4 + 1] = vertexRows[yi][xi + 1].id;
    vertexIdsArray[i * 4 + 2] = vertexRows[yi + 1][xi].id;
    vertexIdsArray[i * 4 + 3] = vertexRows[yi + 1][xi + 1].id;

    if (Math.abs(pz) < 0.001) {
      if (Math.abs(px) - Math.abs(py) > 0.001) {
        sideArray[i * 3 + 0] = Math.sign(px);
      } else if (Math.abs(py) - Math.abs(px) > 0.001) {
        sideArray[i * 3 + 1] = Math.sign(py);
      } else {
        sideArray[i * 3 + 0] = Math.sign(px) / Math.sqrt(2);
        sideArray[i * 3 + 1] = Math.sign(py) / Math.sqrt(2);
      }
    } else {
      sideArray[i * 3 + 2] = Math.sign(pz);
    }
    uvArray[i * 2 + 0] = uvx;
    uvArray[i * 2 + 1] = uvy;
  }

  geometry.setAttribute(
    'vertexIds',
    new THREE.BufferAttribute(vertexIdsArray, 4, false)
  );
  geometry.setAttribute('side', new THREE.BufferAttribute(sideArray, 3, false));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2, false));

  // Per-instance vertex offset into physics buffer
  const vertexOffsetArray = new Uint32Array(physicsInstances.length);
  physicsInstances.forEach((inst, i) => {
    vertexOffsetArray[i] = inst.vertexStart;
  });
  geometry.setAttribute(
    'vertexOffset',
    new THREE.InstancedBufferAttribute(vertexOffsetArray, 1, false)
  );

  // Per-instance color tint
  geometry.setAttribute('instanceColor', colorBuffer);

  geometry.instanceCount = physicsInstances.length;

  // TSL material — position driven by physics vertex buffer
  const map = texture.clone();
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.needsUpdate = true;

  const material = new THREE.MeshPhysicalNodeMaterial({
    transparent: true,
    roughness: 0.8,
  });

  material.colorNode = Fn(() => {
    const color = tslTexture(map);
    If(color.a.lessThan(0.9), () => {
      Discard();
    });
    const tint = attribute('instanceColor');
    return color.mul(vec4(tint.mul(0.9), 1));
  })();

  material.castShadowNode = Fn(() => {
    const color = tslTexture(map);
    If(color.a.lessThan(0.9), () => {
      Discard();
    });
    return color.a.oneMinus();
  })();

  const vNormal = vec3().toVarying('vNormal');
  const vOpacity = float(0).toVarying('vOpacity');

  material.positionNode = Fn(() => {
    const side = attribute('side');
    const vertexIds = attribute('vertexIds');
    const vertexOffset = attribute('vertexOffset');

    const v0 = physics.vertexBuffer
      .element(vertexIds.x.add(vertexOffset))
      .get('smoothedPosition')
      .toVar();
    const v1 = physics.vertexBuffer
      .element(vertexIds.y.add(vertexOffset))
      .get('smoothedPosition')
      .toVar();
    const v2 = physics.vertexBuffer
      .element(vertexIds.z.add(vertexOffset))
      .get('smoothedPosition')
      .toVar();
    const v3 = physics.vertexBuffer
      .element(vertexIds.w.add(vertexOffset))
      .get('smoothedPosition')
      .toVar();

    const top = v0.add(v1);
    const right = v1.add(v3);
    const bottom = v2.add(v3);
    const left = v0.add(v2);

    const tangent = right.sub(left).normalize().toVar();
    const bitangent = bottom.sub(top).normalize().toVar();
    const n = cross(tangent, bitangent);
    const normal = tangent
      .mul(side.x)
      .add(bitangent.mul(side.y))
      .add(n.mul(side.z))
      .normalize()
      .toVar();

    vNormal.assign(transformNormalToView(normal));

    const position = v0.add(v1).add(v2).add(v3).mul(0.25).toVar();
    // Fade in from left spawn zone, fade out at right recycle boundary
    const leftFade = smoothstep(float(-2.0), float(-1.5), position.x);
    const rightFade = smoothstep(float(1.5), float(1.9), position.x).oneMinus();
    vOpacity.assign(leftFade.mul(rightFade));

    return position;
  })();

  material.normalNode = vNormal.normalize();
  material.opacityNode = vOpacity;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, physicsInstances };
}

// ------------------------------------------------------------------
// ClothLeavesInner — suspends until textures are ready
// ------------------------------------------------------------------
function ClothLeavesInner({
  leafType,
  count,
  speed,
  cycleTravel,
  windDirX,
  windDirZ,
  color1,
  color2,
  color3,
}) {
  const textureUrl =
    leafType === 'Blossoms'
      ? '/textures/flowers/sakurapetal.png'
      : '/textures/leaves/mapleleaf.png';

  const loadedTexture = useTexture(textureUrl);
  const gl = useThree((s) => s.gl);

  const [mesh, setMesh] = useState(null);
  const physicsRef = useRef(null);
  const instancesRef = useRef([]);
  const windUniformsRef = useRef({
    windDirXU: null,
    windDirZU: null,
  });
  const computingRef = useRef(false);

  // Build per-instance color buffer from the three color props
  const colorBuffer = useMemo(() => {
    const colors = [color1, color2, color3];
    const arr = new Float32Array(count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      col.set(colors[i % colors.length]);
      arr[i * 3 + 0] = col.r;
      arr[i * 3 + 1] = col.g;
      arr[i * 3 + 2] = col.b;
    }
    return new THREE.InstancedBufferAttribute(arr, 3);
  }, [count, color1, color2, color3]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const config = leafType === 'Blossoms' ? PETAL_CONFIG : LEAF_CONFIG;

      // Pole + finial BVH collider
      const poleGeo = buildPoleColliderGeometry();
      const bvh = new BVH(poleGeo);

      // Wind uniforms (referenced inside TSL force function)
      const windDirXU = uniform(windDirX);
      const windDirZU = uniform(windDirZ);
      windUniformsRef.current = { windDirXU, windDirZU };

      // Match billboard speed: terminal_velocity = speed * cycleTravel units/sec
      // Verlet at 360 steps/sec, dampening=0.995 → F_ext = v_target * (1-d) / steps
      const baseForce = (speed * cycleTravel * 0.005) / 360;

      // Physics
      const physics = new VerletPhysics();
      physics.addCollider(bvh);
      physics.addForce((position, time) => {
        const force = vec3(0).toVar();
        force.y.subAssign(baseForce * 0.24);
        // Small noise for organic feel — x/y only to prevent camera drift
        const noise = triNoise3Dvec(position.mul(0.2), 0.5, time)
          .sub(vec3(0.285, 0.285, 0.285))
          .mul(baseForce * 0.15);
        force.x.addAssign(noise.x);
        force.y.addAssign(noise.y);
        // Directional wind
        force.addAssign(vec3(windDirXU, 0, windDirZU).mul(baseForce));
        // Soft Z boundary walls to keep leaves in the [-1.9, 1.6] range
        force.z.subAssign(position.z.sub(float(1.6)).max(float(0)).mul(0.0003));
        force.z.addAssign(
          float(-1.9).sub(position.z).max(float(0)).mul(0.0003)
        );
        return force;
      });

      // Placeholder instances array (count slots, filled by buildClothGeometry)
      const placeholderInstances = Array.from({ length: count }, (_, i) => i);

      // Build geometry + register all instances in physics
      const { mesh: clothMesh, physicsInstances } = buildClothGeometry(
        physics,
        config.widthSegments,
        config.heightSegments,
        config.segmentSize,
        placeholderInstances,
        loadedTexture,
        colorBuffer
      );

      if (cancelled) {
        clothMesh.geometry.dispose();
        clothMesh.material.dispose();
        return;
      }

      // Set initial scattered positions before baking
      for (let i = 0; i < physicsInstances.length; i++) {
        const pos = randomSpawnPosition(true);
        const quat = randomRotation();
        await physics.resetObject(physicsInstances[i].id, pos, quat);
        if (cancelled) return;
      }

      await physics.bake(gl);
      if (cancelled) {
        clothMesh.geometry.dispose();
        clothMesh.material.dispose();
        return;
      }

      physicsRef.current = physics;
      instancesRef.current = physicsInstances;
      setMesh(clothMesh);
    };

    init();

    return () => {
      cancelled = true;
      if (physicsRef.current) {
        // Dispose GPU resources on unmount
        const p = physicsRef.current;
        if (p.vertexBuffer) p.vertexBuffer.buffer.value = null;
        if (p.springBuffer) p.springBuffer.buffer.value = null;
      }
      if (mesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      physicsRef.current = null;
      instancesRef.current = [];
      setMesh(null);
    };
  }, [gl, leafType, count]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update wind uniforms each frame (cheap, avoids re-init)
  useFrame((_, delta) => {
    const { windDirXU, windDirZU } = windUniformsRef.current;
    if (windDirXU) {
      windDirXU.value = windDirX;
      windDirZU.value = windDirZ;
    }

    if (
      !physicsRef.current ||
      !physicsRef.current.isBaked ||
      computingRef.current
    )
      return;
    computingRef.current = true;

    const physics = physicsRef.current;
    const instances = instancesRef.current;

    const doUpdate = async () => {
      await physics.update(delta);

      // Recycle instances that have blown past the right boundary
      // Check a batch per frame to spread GPU readback cost
      const checksPerFrame = Math.min(50, instances.length);
      for (let i = 0; i < checksPerFrame; i++) {
        const inst =
          instances[(physics.frameNum * checksPerFrame + i) % instances.length];
        if (physics.objects[inst.id].position.x > RECYCLE_X) {
          const pos = randomSpawnPosition(false);
          const quat = randomRotation();
          await physics.resetObject(inst.id, pos, quat);
        }
      }

      computingRef.current = false;
    };

    doUpdate();
  });

  if (!mesh) return null;
  return <primitive object={mesh} />;
}

// ------------------------------------------------------------------
// ClothLeaves — public export, wraps inner in Suspense
// ------------------------------------------------------------------
function ClothLeaves({
  leafType = 'Leaves',
  count = 300,
  speed = 0.08,
  cycleTravel = 5,
  windDirX = 1,
  windDirZ = 0,
  color1 = '#d70654',
  color2 = '#ffd95f',
  color3 = '#b8d576',
}) {
  return (
    <Suspense fallback={null}>
      <ClothLeavesInner
        leafType={leafType}
        count={count}
        speed={speed}
        cycleTravel={cycleTravel}
        windDirX={windDirX}
        windDirZ={windDirZ}
        color1={color1}
        color2={color2}
        color3={color3}
      />
    </Suspense>
  );
}

export default memo(ClothLeaves);
