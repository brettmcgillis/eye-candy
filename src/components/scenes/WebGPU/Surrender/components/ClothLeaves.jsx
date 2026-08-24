/* eslint-disable no-plusplus */
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

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Fn,
  attribute,
  float,
  texture as tslTexture,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { BVH, VerletPhysics, triNoise3Dvec } from '@modules/verletPhysics';

const ATLAS_SIZE = 256;

function buildArrayTexture(loadedTextures) {
  const texArray = Array.isArray(loadedTextures)
    ? loadedTextures
    : [loadedTextures];
  const N = texArray.length;
  const W = ATLAS_SIZE;
  const H = ATLAS_SIZE;
  const data = new Uint8Array(W * H * 4 * N);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  texArray.forEach((tex, i) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(tex.image, 0, 0, W, H);
    data.set(ctx.getImageData(0, 0, W, H).data, i * W * H * 4);
  });
  const arrayTex = new THREE.DataArrayTexture(data, W, H, N);
  arrayTex.format = THREE.RGBAFormat;
  arrayTex.type = THREE.UnsignedByteType;
  arrayTex.colorSpace = THREE.SRGBColorSpace;
  arrayTex.minFilter = THREE.LinearFilter;
  arrayTex.magFilter = THREE.LinearFilter;
  arrayTex.needsUpdate = true;
  return arrayTex;
}

// Pole geometry constants — must match FlagPole.jsx
const POLE_BOTTOM_Y = -2.55;
const POLE_TOP_Y = 0.95;
const POLE_HEIGHT = POLE_TOP_Y - POLE_BOTTOM_Y;
const POLE_CENTER_Y = (POLE_TOP_Y + POLE_BOTTOM_Y) / 2;
const COLLIDER_RADIUS = 0.05;
const FINIAL_Y = POLE_TOP_Y;
const FINIAL_COLLIDER_RADIUS = 0.045;

// Match billboard Z range exactly for consistent depth distribution
const SPAWN_Z_MIN = -2;
const SPAWN_Z_MAX = 2.1;

const LEAF_SEGMENTS = { width: 10, height: 10 };
const PETAL_SEGMENTS = { width: 4, height: 4 };
const RECYCLE_READBACK_INTERVAL = 8;

const LEAF_FORCE_RESPONSE = {
  gravityScale: 0,
};

// Mirror billboard's frustum-derived X extent calculation
function getXExtentAtZ(camera, aspect, zPlane) {
  const vFovRad = THREE.MathUtils.degToRad(camera.fov);
  const hFovHalf = Math.atan(Math.tan(vFovRad / 2) * aspect);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const t = (zPlane - camera.position.z) / dir.z;
  const centerX = camera.position.x + dir.x * t;
  const halfWidth = Math.tan(hFovHalf) * Math.abs(camera.position.z - zPlane);
  return { leftEdge: centerX - halfWidth, rightEdge: centerX + halfWidth };
}

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

function randomRotation() {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    )
  );
}

function buildClothGeometry(
  physics,
  widthSegments,
  heightSegments,
  leafSize,
  leafAspect,
  curvature,
  instances,
  arrayTex,
  numSprites,
  colorBuffer,
  wireframe
) {
  // Compensate for center-of-cell shrink: rendered surface spans (N-1)/N of the
  // physics grid, so scale segment size up by N/(N-1) to match the true leaf footprint.
  const segmentSize = leafSize / (widthSegments - 1);

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
      const u = x / widthSegments - 0.5;
      const v = y / heightSegments - 0.5;
      const curveX = curvature * leafSize * 2 * (u * u + v * v);
      const pos = new THREE.Vector3(
        curveX,
        (x - widthSegments * 0.5) * segmentSize,
        (y - heightSegments * 0.5) * segmentSize * leafAspect
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

  const plane = new THREE.PlaneGeometry(
    1,
    1,
    widthSegments - 1,
    heightSegments - 1
  );
  plane.deleteAttribute('uv');
  plane.deleteAttribute('normal');
  const geometry = new THREE.InstancedBufferGeometry().copy(plane);

  const vertexCount = geometry.attributes.position.count;
  const positionArray = geometry.attributes.position.array;
  const uvScale = 1.0 / (widthSegments - 1);
  const vertexIdsArray = new Uint32Array(4 * vertexCount);
  const uvArray = new Float32Array(2 * vertexCount);

  for (let i = 0; i < vertexCount; i++) {
    const px = positionArray[i * 3 + 0];
    const py = positionArray[i * 3 + 1];
    const xi = Math.round((px + 0.5) * (widthSegments - 1));
    const yi = Math.round((py + 0.5) * (heightSegments - 1));
    const uvx = xi * uvScale;
    const uvy = yi * uvScale;

    vertexIdsArray[i * 4 + 0] = vertexRows[yi][xi].id;
    vertexIdsArray[i * 4 + 1] = vertexRows[yi][xi + 1].id;
    vertexIdsArray[i * 4 + 2] = vertexRows[yi + 1][xi].id;
    vertexIdsArray[i * 4 + 3] = vertexRows[yi + 1][xi + 1].id;
    uvArray[i * 2 + 0] = uvx;
    uvArray[i * 2 + 1] = uvy;
  }

  geometry.setAttribute(
    'vertexIds',
    new THREE.BufferAttribute(vertexIdsArray, 4, false)
  );
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2, false));

  const vertexOffsetArray = new Uint32Array(physicsInstances.length);
  physicsInstances.forEach((inst, i) => {
    vertexOffsetArray[i] = inst.vertexStart;
  });
  geometry.setAttribute(
    'vertexOffset',
    new THREE.InstancedBufferAttribute(vertexOffsetArray, 1, false)
  );
  geometry.setAttribute('instanceColor', colorBuffer);

  const spriteIdxArray = new Float32Array(physicsInstances.length);
  physicsInstances.forEach((_, i) => {
    spriteIdxArray[i] = i % numSprites;
  });
  geometry.setAttribute(
    'instanceSpriteIdx',
    new THREE.InstancedBufferAttribute(spriteIdxArray, 1, false)
  );

  geometry.instanceCount = physicsInstances.length;

  const vClothOpacity = float(0).toVarying('vClothOpacity');
  const alphaClip = 0.1;

  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    forceSinglePass: true,
    transparent: true,
    alphaTest: alphaClip,
    wireframe,
  });

  material.colorNode = Fn(() => {
    const spriteIdx = attribute('instanceSpriteIdx');
    const leafUV = uv();
    const texColor = tslTexture(arrayTex, leafUV).depth(spriteIdx);
    const tint = attribute('instanceColor');
    return vec4(texColor.rgb.mul(tint), texColor.a.mul(vClothOpacity));
  })();

  material.castShadowNode = Fn(() => {
    const spriteIdx = attribute('instanceSpriteIdx');
    const leafUV = uv();
    const texColor = tslTexture(arrayTex, leafUV).depth(spriteIdx);
    texColor.a.mul(vClothOpacity).lessThanEqual(alphaClip).discard();
    return vec4(0, 0, 0, 1);
  })();

  material.positionNode = Fn(() => {
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

    vClothOpacity.assign(float(1.0));

    return v0.add(v1).add(v2).add(v3).mul(0.25);
  })();

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
  sprites,
  leafSize,
  leafAspect,
  curvature,
  speed,
  cycleTravel,
  tumble,
  windDirX,
  windDirZ,
  color1,
  color2,
  color3,
  wireframe,
  scenePhysics,
}) {
  const loadedSprites = useTexture(sprites);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const sceneCursorSphere = scenePhysics?.cursorSphere ?? null;

  const arrayTex = useMemo(
    () =>
      buildArrayTexture(
        Array.isArray(loadedSprites) ? loadedSprites : [loadedSprites]
      ),
    [loadedSprites]
  );

  const [mesh, setMesh] = useState(null);
  const physicsRef = useRef(null);
  const instancesRef = useRef([]);
  const windUniformsRef = useRef({
    windDirXU: null,
    windDirZU: null,
    gravityU: null,
    gravityDirU: null,
  });
  const computingRef = useRef(false);
  // Spawn function and recycle X stored in refs so useFrame can access them
  const spawnFnRef = useRef(null);
  const recycleXRef = useRef(2.0);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const segments = leafType === 'Blossoms' ? PETAL_SEGMENTS : LEAF_SEGMENTS;

      // Frustum-derived X spawn bounds — mirrors billboard's horizontal mode
      const aspect = size.width / size.height;
      const { leftEdge, rightEdge } = getXExtentAtZ(camera, aspect, -1);
      const windNorm = Math.sqrt(windDirX ** 2 + 0.0625 + windDirZ ** 2);
      const windXComp = Math.max(windDirX / windNorm, 0.5);
      // Tight off-screen margins: recycle spawn just 0.25–1 unit left of screen edge.
      // Cloth is a flow system (not analytic cycling), so narrow margins maximize the
      // fraction of instances that are visible at any given time (~79% vs ~47% with wide margins).
      const recycleSpawnMax = leftEdge - 0.25;
      const recycleSpawnMin = leftEdge - 1.0;
      const recycleX = rightEdge + 0.25;
      const safeTravel = (recycleX - recycleSpawnMin) / windXComp;
      const effectiveTravel = Math.max(cycleTravel, safeTravel);

      recycleXRef.current = recycleX;

      // Y and Z match billboard's hardcoded ranges.
      // isInitial spreads across the visible frustum so all N leaves start on-screen.
      // Recycled leaves come from the tight off-screen band.
      spawnFnRef.current = (isInitial) =>
        new THREE.Vector3(
          isInitial
            ? THREE.MathUtils.randFloat(leftEdge, rightEdge)
            : THREE.MathUtils.randFloat(recycleSpawnMin, recycleSpawnMax),
          THREE.MathUtils.randFloat(-2, 4),
          THREE.MathUtils.randFloat(SPAWN_Z_MIN, SPAWN_Z_MAX)
        );

      // Cloth is a flow system — at steady state only ~visibleFraction of instances are
      // on-screen. Provision physicsCount = ceil(count / fraction) so visible density
      // matches the requested count, same as billboard's fract()-based cycling.
      const visibleFraction =
        (rightEdge - leftEdge) /
        (recycleX - (recycleSpawnMin + recycleSpawnMax) / 2);
      const physicsCount = Math.ceil(count / Math.min(visibleFraction, 1));

      // colorBuffer sized to physicsCount, cycles the three colors across all instances
      const colors = [color1, color2, color3];
      const colorArr = new Float32Array(physicsCount * 3);
      const col = new THREE.Color();
      for (let i = 0; i < physicsCount; i++) {
        col.set(colors[i % colors.length]);
        colorArr[i * 3 + 0] = col.r;
        colorArr[i * 3 + 1] = col.g;
        colorArr[i * 3 + 2] = col.b;
      }
      const colorBuffer = new THREE.InstancedBufferAttribute(colorArr, 3);

      const poleGeo = buildPoleColliderGeometry();
      const bvh = new BVH(poleGeo);

      const windDirXU = uniform(scenePhysics?.windDirection?.x ?? windDirX);
      const windDirZU = uniform(scenePhysics?.windDirection?.z ?? windDirZ);
      const gravityU = uniform(scenePhysics?.gravity ?? 0.00005);
      const gravityDirU = uniform(
        scenePhysics?.gravityDirection?.clone() ?? new THREE.Vector3(0, -1, 0)
      );
      windUniformsRef.current = {
        windDirXU,
        windDirZU,
        gravityU,
        gravityDirU,
      };

      // Terminal X velocity = speed * effectiveTravel units/sec
      const baseForce = (speed * effectiveTravel * 0.005) / 360;

      const physics = new VerletPhysics();
      physics.addCollider(bvh);
      if (sceneCursorSphere) {
        physics.addCollider(sceneCursorSphere);
      }
      physics.addForce((position, time) => {
        const force = vec3(0).toVar();
        // triNoise3Dvec outputs trivec (|fract(x)-0.5|) summed over 4 octaves with
        // z=[1.4,2.1,3.15,4.725]. Mean per component = 0.25 * Σ(1/z) ≈ 0.43.
        // Subtracting 0.43 properly centers the noise at zero so Y/Z components
        // don't introduce net drift. All three axes applied: differential spatial
        // noise across vertices creates the torque that drives organic tumbling.
        // tumble (default 20) scales the transverse noise that creates per-vertex
        // differential forces — those differentials are what drive organic tumbling.
        const tumbleScale = tumble / 20;
        const noise = triNoise3Dvec(position.mul(0.2), 0.5, time)
          .sub(vec3(0.43, 0.43, 0.43))
          .mul(baseForce * 0.15);
        force.x.addAssign(noise.x);
        force.y.addAssign(noise.y.mul(tumbleScale));
        force.z.addAssign(noise.z.mul(0.5 * tumbleScale));
        // Directional wind drives X trajectory matching billboard's analytic path
        force.addAssign(vec3(windDirXU, 0, windDirZU).mul(baseForce));
        force.addAssign(
          gravityDirU.mul(gravityU.mul(LEAF_FORCE_RESPONSE.gravityScale))
        );
        // Soft boundary walls matching billboard's -2/4 Y and -2/2.1 Z spawn ranges
        force.y.subAssign(position.y.sub(float(4.0)).max(float(0)).mul(0.0003));
        force.y.addAssign(
          float(-2.0).sub(position.y).max(float(0)).mul(0.0003)
        );
        force.z.subAssign(position.z.sub(float(2.1)).max(float(0)).mul(0.0003));
        force.z.addAssign(
          float(-2.0).sub(position.z).max(float(0)).mul(0.0003)
        );
        return force;
      });

      const placeholderInstances = Array.from(
        { length: physicsCount },
        (_, i) => i
      );
      const numSprites = Array.isArray(loadedSprites)
        ? loadedSprites.length
        : 1;

      const { mesh: clothMesh, physicsInstances } = buildClothGeometry(
        physics,
        segments.width,
        segments.height,
        leafSize,
        leafAspect,
        curvature,
        placeholderInstances,
        arrayTex,
        numSprites,
        colorBuffer,
        wireframe
      );

      if (cancelled) {
        clothMesh.geometry.dispose();
        clothMesh.material.dispose();
        return;
      }

      const seedInstances = async (index = 0) => {
        if (index >= physicsInstances.length || cancelled) return;

        physicsInstances[index].scale = THREE.MathUtils.randFloat(0.5, 1.8);
        const pos = spawnFnRef.current(true);
        const quat = randomRotation();
        await physics.resetObject(
          physicsInstances[index].id,
          pos,
          quat,
          physicsInstances[index].scale
        );
        if (cancelled) return;

        await seedInstances(index + 1);
      };

      await seedInstances();

      // Disable the Y=0 floor — cloth leaves float freely, recycling handles OOB.
      // The hard floor was clamping all negative-Y leaves to Y=0, collapsing the
      // bottom half of the spawn volume and causing the "cloud too high" appearance.
      await physics.bake(gl, { yFloor: null });
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
  }, [
    gl,
    leafType,
    count,
    leafSize,
    leafAspect,
    curvature,
    speed,
    cycleTravel,
    tumble,
    color1,
    color2,
    color3,
    sceneCursorSphere,
  ]);

  useEffect(() => {
    return () => {
      arrayTex.dispose();
    };
  }, [arrayTex]);

  useEffect(() => {
    if (!mesh) return;
    if (mesh.material.wireframe === wireframe) return;
    mesh.material.wireframe = wireframe;
    mesh.material.needsUpdate = true;
  }, [mesh, wireframe]);

  useFrame((_, delta) => {
    const { windDirXU, windDirZU, gravityU, gravityDirU } =
      windUniformsRef.current;
    if (windDirXU) {
      const nextWindDir = scenePhysics?.windDirection;
      windDirXU.value = nextWindDir ? nextWindDir.x : windDirX;
      windDirZU.value = nextWindDir ? nextWindDir.z : windDirZ;
      gravityU.value = scenePhysics?.gravity ?? 0.00005;
      if (scenePhysics?.gravityDirection) {
        gravityDirU.value.copy(scenePhysics.gravityDirection);
      }
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
    const recycleX = recycleXRef.current;
    const spawnFn = spawnFnRef.current;

    const doUpdate = async () => {
      await physics.update(delta);

      if (physics.frameNum % RECYCLE_READBACK_INTERVAL !== 0) {
        computingRef.current = false;
        return;
      }

      await physics.readPositions();

      const recycleInstances = async (index = 0) => {
        if (index >= instances.length) return;

        const inst = instances[(physics.frameNum + index) % instances.length];
        if (physics.objects[inst.id].position.x > recycleX) {
          const pos = spawnFn(false);
          const quat = randomRotation();
          await physics.resetObject(inst.id, pos, quat, inst.scale);
        }

        await recycleInstances(index + 1);
      };

      await recycleInstances();

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
  sprites = ['/textures/leaves/mapleleaf.png'],
  leafSize = 0.08,
  leafAspect = 1,
  curvature = 0.4,
  speed = 0.08,
  cycleTravel = 5,
  tumble = 20,
  windDirX = 1,
  windDirZ = 0,
  color1 = '#d70654',
  color2 = '#ffd95f',
  color3 = '#b8d576',
  wireframe = false,
  scenePhysics = null,
}) {
  return (
    <Suspense fallback={null}>
      <ClothLeavesInner
        leafType={leafType}
        count={count}
        sprites={sprites}
        leafSize={leafSize}
        leafAspect={leafAspect}
        curvature={curvature}
        speed={speed}
        cycleTravel={cycleTravel}
        tumble={tumble}
        windDirX={windDirX}
        windDirZ={windDirZ}
        color1={color1}
        color2={color2}
        color3={color3}
        wireframe={wireframe}
        scenePhysics={scenePhysics}
      />
    </Suspense>
  );
}

export default memo(ClothLeaves);
