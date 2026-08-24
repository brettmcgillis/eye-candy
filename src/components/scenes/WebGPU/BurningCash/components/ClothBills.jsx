/* eslint-disable no-plusplus */

/* eslint-disable no-shadow */
import React, {
  Suspense,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import {
  Fn,
  attribute,
  float,
  frontFacing,
  mix,
  mx_noise_float as mxNoiseFloat,
  smoothstep,
  texture as tslTexture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { VerletPhysics, triNoise3Dvec } from '@modules/verletPhysics';

// Pre-baked per-face bill textures (see public/textures/cash). Layer order:
// [hundred front, hundred back, one front, one back] — spriteIdx*2 + face.
const BILL_TEXTURES = [
  '/textures/cash/hundred_front.png',
  '/textures/cash/hundred_back.png',
  '/textures/cash/one_front.png',
  '/textures/cash/one_back.png',
];
const ATLAS_W = 512;
const ATLAS_H = 220;

const BILL_SEGMENTS = 10;
const RECYCLE_READBACK_INTERVAL = 8;

// Burn threshold sweeps BURN_START → BURN_END. Noise is in [0, 1], so the
// padding keeps unlit bills fully intact and guarantees full consumption.
const BURN_START = -0.3;
const BURN_END = 1.2;

const DEFAULT_SPAWN = {
  initialMinX: -4,
  initialMaxX: 3,
  minX: -6,
  maxX: -4.5,
  minY: 0.3,
  maxY: 3,
  minZ: -2,
  maxZ: 2,
};

const DEFAULT_BOUNDS = {
  minY: 0.15,
  maxY: 3.5,
  minZ: -2.5,
  maxZ: 2.5,
  recycleX: 6,
};

const FLOOR_Y = 0.02;

function resolveSpawn(spawn) {
  const cfg = spawn || DEFAULT_SPAWN;
  return {
    initialMinX: cfg.initialMinX,
    initialMaxX: cfg.initialMaxX,
    minX: cfg.minX,
    maxX: cfg.maxX,
    minY: cfg.minY,
    maxY: cfg.maxY,
    minZ: cfg.minZ,
    maxZ: cfg.maxZ,
  };
}

function resolveBounds(bounds) {
  const cfg = bounds || DEFAULT_BOUNDS;
  return {
    minY: cfg.minY,
    maxY: cfg.maxY,
    minZ: cfg.minZ,
    maxZ: cfg.maxZ,
    recycleX: cfg.recycleX,
  };
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

function buildBillArrayTexture(textures) {
  const N = textures.length;
  const data = new Uint8Array(ATLAS_W * ATLAS_H * 4 * N);
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  textures.forEach((tex, i) => {
    ctx.clearRect(0, 0, ATLAS_W, ATLAS_H);
    ctx.drawImage(tex.image, 0, 0, ATLAS_W, ATLAS_H);
    data.set(
      ctx.getImageData(0, 0, ATLAS_W, ATLAS_H).data,
      i * ATLAS_W * ATLAS_H * 4
    );
  });
  const arrayTex = new THREE.DataArrayTexture(data, ATLAS_W, ATLAS_H, N);
  arrayTex.format = THREE.RGBAFormat;
  arrayTex.type = THREE.UnsignedByteType;
  arrayTex.colorSpace = THREE.SRGBColorSpace;
  arrayTex.minFilter = THREE.LinearFilter;
  arrayTex.magFilter = THREE.LinearFilter;
  arrayTex.needsUpdate = true;
  return arrayTex;
}

function buildBillGeometry(
  physics,
  segments,
  billSize,
  billAspect,
  curvature,
  instanceCount,
  hundredFraction,
  arrayTex,
  burnUniforms,
  wireframe
) {
  const widthSegments = segments;
  const heightSegments = segments;
  const segmentSize = billSize / (widthSegments - 1);

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
      const curveX = curvature * billSize * 2 * (u * u + v * v);
      const pos = new THREE.Vector3(
        curveX,
        (x - widthSegments * 0.5) * segmentSize,
        (y - heightSegments * 0.5) * segmentSize * billAspect
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

  const physicsInstances = [];
  for (let i = 0; i < instanceCount; i++) {
    const instance = physics.addObject();
    const pVerts = templateVertices.map(({ position, fixed }) =>
      physics.addVertex(instance.id, position, fixed)
    );
    templateSprings.forEach(({ vertex0, vertex1 }) => {
      physics.addSpring(instance.id, pVerts[vertex0.id], pVerts[vertex1.id]);
    });
    physicsInstances.push(instance);
  }

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

    vertexIdsArray[i * 4 + 0] = vertexRows[yi][xi].id;
    vertexIdsArray[i * 4 + 1] = vertexRows[yi][xi + 1].id;
    vertexIdsArray[i * 4 + 2] = vertexRows[yi + 1][xi].id;
    vertexIdsArray[i * 4 + 3] = vertexRows[yi + 1][xi + 1].id;
    uvArray[i * 2 + 0] = xi * uvScale;
    uvArray[i * 2 + 1] = yi * uvScale;
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

  // Weighted denomination mix — sprite 0 is the $100, sprite 1 the $1.
  const spriteIdxArray = new Float32Array(physicsInstances.length);
  for (let i = 0; i < physicsInstances.length; i++) {
    spriteIdxArray[i] = Math.random() < hundredFraction ? 0 : 1;
  }
  geometry.setAttribute(
    'instanceSpriteIdx',
    new THREE.InstancedBufferAttribute(spriteIdxArray, 1, false)
  );

  const burnArray = new Float32Array(physicsInstances.length).fill(BURN_START);
  const burnAttr = new THREE.InstancedBufferAttribute(burnArray, 1, false);
  burnAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('instanceBurn', burnAttr);

  const seedArray = new Float32Array(physicsInstances.length);
  for (let i = 0; i < physicsInstances.length; i++) {
    seedArray[i] = Math.random() * 10;
  }
  geometry.setAttribute(
    'instanceSeed',
    new THREE.InstancedBufferAttribute(seedArray, 1, false)
  );

  geometry.instanceCount = physicsInstances.length;

  const vClothOpacity = float(0).toVarying('vClothOpacity');
  const alphaClip = 0.1;

  const {
    noiseScaleU,
    edgeWidthU,
    charWidthU,
    glowColorAU,
    glowColorBU,
    glowIntensityU,
  } = burnUniforms;

  const burnNoise = Fn(() => {
    const seed = attribute('instanceSeed');
    const burnUV = uv().mul(vec2(noiseScaleU.mul(2.35), noiseScaleU));
    return mxNoiseFloat(vec3(burnUV, seed.mul(43.7)))
      .mul(0.5)
      .add(0.5);
  });

  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    forceSinglePass: true,
    transparent: true,
    alphaTest: alphaClip,
    wireframe,
  });

  // Front face shows layer spriteIdx*2, back face spriteIdx*2+1 with the
  // U axis mirrored so the back of the bill reads correctly from behind.
  const billFaceColor = Fn(() => {
    const spriteIdx = attribute('instanceSpriteIdx');
    const layer = spriteIdx.mul(2).add(frontFacing.oneMinus());
    const faceUV = vec2(mix(uv().x.oneMinus(), uv().x, frontFacing), uv().y);
    return tslTexture(arrayTex, faceUV).depth(layer);
  });

  material.colorNode = Fn(() => {
    const texColor = billFaceColor();

    const burn = attribute('instanceBurn');
    const d = burnNoise().sub(burn).toVar();
    d.lessThan(0).discard();

    // Glowing burn front, then a charred band trailing behind it.
    const glow = smoothstep(edgeWidthU, float(0), d).toVar();
    const char = smoothstep(charWidthU, edgeWidthU.mul(0.5), d);

    const base = mix(texColor.rgb, vec3(0.01, 0.008, 0.006), char.mul(0.92));
    const emberCol = mix(glowColorAU, glowColorBU, glow.pow(2.5));
    const rgb = base.add(emberCol.mul(glow.pow(1.5)).mul(glowIntensityU));

    return vec4(rgb, texColor.a.mul(vClothOpacity));
  })();

  material.castShadowNode = Fn(() => {
    const burn = attribute('instanceBurn');
    burnNoise().sub(burn).lessThan(0).discard();
    vClothOpacity.lessThanEqual(alphaClip).discard();
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

  return { mesh, physicsInstances, burnAttr };
}

const ClothBillsInner = forwardRef(function ClothBillsInner(
  {
    count,
    billSize,
    billAspect,
    curvature,
    speed,
    tumble,
    lift,
    windDirX,
    windDirZ,
    hundredFraction,
    burnSpeed,
    autoIgnite,
    igniteMinAge,
    igniteMaxAge,
    noiseScale,
    edgeWidth,
    charWidth,
    glowColorA,
    glowColorB,
    glowIntensity,
    emberRate,
    spawn,
    bounds,
    surfaceFriction,
    palletBox,
    wireframe,
    embersRef,
  },
  ref
) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  const spawnConfig = useMemo(
    () => resolveSpawn(spawn),
    [
      spawn?.initialMinX,
      spawn?.initialMaxX,
      spawn?.minX,
      spawn?.maxX,
      spawn?.minY,
      spawn?.maxY,
      spawn?.minZ,
      spawn?.maxZ,
    ]
  );

  const boundsConfig = useMemo(
    () => resolveBounds(bounds),
    [bounds?.minY, bounds?.maxY, bounds?.minZ, bounds?.maxZ, bounds?.recycleX]
  );

  const billTextures = useTexture(BILL_TEXTURES);

  const [mesh, setMesh] = useState(null);
  const physicsRef = useRef(null);
  const instancesRef = useRef([]);
  const burnAttrRef = useRef(null);
  const computingRef = useRef(false);

  // Per-instance burn lifecycle state
  const stateRef = useRef(null);

  const burnUniformsRef = useRef(null);
  if (!burnUniformsRef.current) {
    burnUniformsRef.current = {
      noiseScaleU: uniform(noiseScale),
      edgeWidthU: uniform(edgeWidth),
      charWidthU: uniform(charWidth),
      glowColorAU: uniform(new THREE.Color(glowColorA)),
      glowColorBU: uniform(new THREE.Color(glowColorB)),
      glowIntensityU: uniform(glowIntensity),
    };
  }

  const windUniformsRef = useRef(null);
  if (!windUniformsRef.current) {
    windUniformsRef.current = {
      windDirXU: uniform(windDirX),
      windDirZU: uniform(windDirZ),
      speedU: uniform(speed),
      liftU: uniform(lift),
    };
  }

  // Live prop sync for uniforms
  useEffect(() => {
    const u = burnUniformsRef.current;
    u.noiseScaleU.value = noiseScale;
    u.edgeWidthU.value = edgeWidth;
    u.charWidthU.value = charWidth;
    u.glowColorAU.value.set(glowColorA);
    u.glowColorBU.value.set(glowColorB);
    u.glowIntensityU.value = glowIntensity;
  }, [noiseScale, edgeWidth, charWidth, glowColorA, glowColorB, glowIntensity]);

  useEffect(() => {
    const u = windUniformsRef.current;
    u.windDirXU.value = windDirX;
    u.windDirZU.value = windDirZ;
    u.speedU.value = speed;
    u.liftU.value = lift;
  }, [windDirX, windDirZ, speed, lift]);

  useEffect(() => {
    let cancelled = false;

    const arrayTex = buildBillArrayTexture(billTextures);

    const spawnFn = (isInitial) =>
      new THREE.Vector3(
        isInitial
          ? THREE.MathUtils.randFloat(
              spawnConfig.initialMinX,
              spawnConfig.initialMaxX
            )
          : THREE.MathUtils.randFloat(spawnConfig.minX, spawnConfig.maxX),
        THREE.MathUtils.randFloat(spawnConfig.minY, spawnConfig.maxY),
        THREE.MathUtils.randFloat(spawnConfig.minZ, spawnConfig.maxZ)
      );

    const init = async () => {
      const physics = new VerletPhysics();

      physics.addCollider({
        normal: new THREE.Vector3(0, 1, 0),
        point: new THREE.Vector3(0, FLOOR_Y, 0),
      });

      // Pallet collider as a world-space AABB. The solver resolves penetration
      // against the nearest face so cloth does not tunnel through the stack.
      if (palletBox) {
        physics.addCollider({
          center: new THREE.Vector3(
            palletBox.center[0],
            palletBox.center[1],
            palletBox.center[2]
          ),
          size: new THREE.Vector3(
            palletBox.size[0],
            palletBox.size[1],
            palletBox.size[2]
          ),
        });
      }

      const { windDirXU, windDirZU, speedU, liftU } = windUniformsRef.current;
      const baseForce = 0.005 / 360;

      physics.addForce((position, time) => {
        const force = vec3(0).toVar();
        const noise = triNoise3Dvec(position.mul(0.2), 0.5, time)
          .sub(vec3(0.43, 0.43, 0.43))
          .mul(baseForce * 0.15);
        force.x.addAssign(noise.x.mul(tumble));
        force.y.addAssign(noise.y.mul(tumble));
        force.z.addAssign(noise.z.mul(0.5 * tumble));
        // Directional wind + buoyant lift noise
        force.addAssign(
          vec3(windDirXU, 0, windDirZU).mul(speedU.mul(baseForce))
        );
        force.y.addAssign(
          triNoise3Dvec(position.mul(0.35).add(vec3(7.3, 0, 0)), 0.4, time)
            .x.sub(0.43)
            .mul(baseForce * 0.6)
            .mul(liftU)
        );
        // Light gravity so bills sink when the gusts let go
        force.y.subAssign(baseForce * 0.12);
        // Soft ceiling / walls keep the storm inside the shot
        force.y.subAssign(
          position.y.sub(float(boundsConfig.maxY)).max(float(0)).mul(0.0003)
        );
        force.y.addAssign(
          float(boundsConfig.minY).sub(position.y).max(float(0)).mul(0.0006)
        );
        force.z.subAssign(
          position.z.sub(float(boundsConfig.maxZ)).max(float(0)).mul(0.0003)
        );
        force.z.addAssign(
          float(boundsConfig.minZ).sub(position.z).max(float(0)).mul(0.0003)
        );
        return force;
      });

      const {
        mesh: billMesh,
        physicsInstances,
        burnAttr,
      } = buildBillGeometry(
        physics,
        BILL_SEGMENTS,
        billSize,
        billAspect,
        curvature,
        count,
        hundredFraction,
        arrayTex,
        burnUniformsRef.current,
        wireframe
      );

      if (cancelled) {
        billMesh.geometry.dispose();
        billMesh.material.dispose();
        return;
      }

      const n = physicsInstances.length;
      stateRef.current = {
        burning: new Uint8Array(n),
        aliveTime: new Float32Array(n),
        igniteAt: new Float32Array(n),
        burnRate: new Float32Array(n),
        emberAcc: new Float32Array(n),
      };
      for (let i = 0; i < n; i++) {
        stateRef.current.igniteAt[i] = THREE.MathUtils.randFloat(
          igniteMinAge,
          igniteMaxAge
        );
        stateRef.current.burnRate[i] = THREE.MathUtils.randFloat(0.75, 1.35);
      }

      const seedInstances = async (index = 0) => {
        if (index >= physicsInstances.length || cancelled) return;
        // Real money is all the same size
        physicsInstances[index].scale = 1;
        await physics.resetObject(
          physicsInstances[index].id,
          spawnFn(true),
          randomRotation(),
          physicsInstances[index].scale
        );
        if (cancelled) return;
        // Stagger initial alive clocks so ignitions don't fire in unison
        stateRef.current.aliveTime[index] = THREE.MathUtils.randFloat(
          0,
          igniteMinAge
        );
        await seedInstances(index + 1);
      };
      await seedInstances();

      await physics.bake(gl, { yFloor: FLOOR_Y });
      if (cancelled) {
        billMesh.geometry.dispose();
        billMesh.material.dispose();
        return;
      }

      physicsRef.current = physics;
      instancesRef.current = physicsInstances;
      burnAttrRef.current = burnAttr;
      physics.spawnFn = spawnFn;
      setMesh(billMesh);
    };

    init();

    return () => {
      cancelled = true;
      if (physicsRef.current) {
        const p = physicsRef.current;
        if (p.vertexBuffer) p.vertexBuffer.buffer.value = null;
        if (p.springBuffer) p.springBuffer.buffer.value = null;
      }
      arrayTex.dispose();
      physicsRef.current = null;
      instancesRef.current = [];
      burnAttrRef.current = null;
      setMesh((m) => {
        if (m) {
          m.geometry.dispose();
          m.material.dispose();
        }
        return null;
      });
    };
    // Structural params require a full physics rebuild
  }, [
    gl,
    billTextures,
    count,
    billSize,
    billAspect,
    curvature,
    tumble,
    hundredFraction,
    spawnConfig,
    boundsConfig,
    palletBox,
  ]);

  // Ignite a fraction of the currently unlit bills (used by the overlay button)
  useImperativeHandle(
    ref,
    () => ({
      igniteFraction(fraction) {
        const state = stateRef.current;
        const burnAttr = burnAttrRef.current;
        if (!state || !burnAttr) return 0;
        const unlit = [];
        for (let i = 0; i < state.burning.length; i++) {
          if (!state.burning[i] && burnAttr.array[i] < BURN_END) unlit.push(i);
        }
        const n = Math.min(
          unlit.length,
          Math.ceil(unlit.length * THREE.MathUtils.clamp(fraction, 0, 1))
        );
        for (let k = 0; k < n; k++) {
          const pick = Math.floor(Math.random() * unlit.length);
          state.burning[unlit[pick]] = 1;
          unlit.splice(pick, 1);
        }
        return n;
      },
    }),
    []
  );

  useEffect(() => {
    if (!mesh) return;
    if (mesh.material.wireframe === wireframe) return;
    mesh.material.wireframe = wireframe;
    mesh.material.needsUpdate = true;
  }, [mesh, wireframe]);

  // Click / tap to ignite the nearest bill along the pointer ray
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return undefined;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const onPointerDown = (event) => {
      const physics = physicsRef.current;
      const state = stateRef.current;
      if (!physics || !state) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      let best = -1;
      let bestDist = billSize * 2;
      for (let i = 0; i < physics.objects.length; i++) {
        if (!state.burning[i]) {
          const dist = raycaster.ray.distanceToPoint(
            physics.objects[i].position
          );
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
      }
      if (best >= 0) state.burning[best] = 1;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    return () => dom.removeEventListener('pointerdown', onPointerDown);
  }, [gl, camera, billSize]);

  useFrame((_, rawDelta) => {
    const physics = physicsRef.current;
    const state = stateRef.current;
    const burnAttr = burnAttrRef.current;
    if (!physics || !physics.isBaked || !state || !burnAttr) return;

    if (physics.uniforms.friction) {
      physics.uniforms.friction.value = surfaceFriction;
    }

    const delta = Math.min(rawDelta, 0.05);
    const instances = instancesRef.current;
    const embers = embersRef?.current;

    // Advance burn lifecycle on the CPU — cheap at these counts
    for (let i = 0; i < instances.length; i++) {
      if (state.burning[i]) {
        const prev = burnAttr.array[i];
        burnAttr.array[i] = Math.min(
          prev + delta * burnSpeed * state.burnRate[i],
          BURN_END
        );
        // Emit embers while the front is sweeping the bill
        if (embers && burnAttr.array[i] > 0 && burnAttr.array[i] < 1) {
          state.emberAcc[i] += delta * emberRate;
          const spawnCount = Math.floor(state.emberAcc[i]);
          if (spawnCount > 0) {
            state.emberAcc[i] -= spawnCount;
            const pos = physics.objects[i].position;
            embers.spawn(
              pos.x,
              pos.y,
              pos.z,
              spawnCount,
              billSize * 0.6 * (instances[i].scale ?? 1)
            );
          }
        }
      } else {
        state.aliveTime[i] += delta;
        if (autoIgnite && state.aliveTime[i] > state.igniteAt[i]) {
          state.burning[i] = 1;
        }
      }
    }
    burnAttr.needsUpdate = true;

    if (computingRef.current) return;
    computingRef.current = true;

    const doUpdate = async () => {
      await physics.update(delta);

      if (physics.frameNum % RECYCLE_READBACK_INTERVAL !== 0) {
        computingRef.current = false;
        return;
      }

      await physics.readPositions();

      const recycle = async (index = 0) => {
        if (index >= instances.length) return;
        const i = (physics.frameNum + index) % instances.length;
        const inst = instances[i];
        const burnedOut = burnAttr.array[i] >= BURN_END;
        const blownAway =
          physics.objects[inst.id].position.x > boundsConfig.recycleX;
        if (burnedOut || blownAway) {
          await physics.resetObject(
            inst.id,
            physics.spawnFn(false),
            randomRotation(),
            inst.scale
          );
          burnAttr.array[i] = BURN_START;
          burnAttr.needsUpdate = true;
          state.burning[i] = 0;
          state.aliveTime[i] = 0;
          state.emberAcc[i] = 0;
          state.igniteAt[i] = THREE.MathUtils.randFloat(
            igniteMinAge,
            igniteMaxAge
          );
          state.burnRate[i] = THREE.MathUtils.randFloat(0.75, 1.35);
        }
        await recycle(index + 1);
      };
      await recycle();

      computingRef.current = false;
    };

    doUpdate();
  });

  if (!mesh) return null;
  return <primitive object={mesh} />;
});

const ClothBills = forwardRef(function ClothBills(
  {
    count = 60,
    billSize = 0.7,
    billAspect = 0.43,
    curvature = 0.15,
    speed = 1.0,
    tumble = 1.0,
    lift = 1.0,
    windDirX = 1,
    windDirZ = 0,
    hundredFraction = 0.8,
    burnSpeed = 0.35,
    autoIgnite = true,
    igniteMinAge = 3,
    igniteMaxAge = 14,
    noiseScale = 3,
    edgeWidth = 0.06,
    charWidth = 0.22,
    glowColorA = '#ff4000',
    glowColorB = '#ffd089',
    glowIntensity = 5,
    emberRate = 26,
    spawn = DEFAULT_SPAWN,
    bounds = DEFAULT_BOUNDS,
    surfaceFriction = 0,
    palletBox = null,
    wireframe = false,
    embersRef = null,
  },
  ref
) {
  return (
    <Suspense fallback={null}>
      <ClothBillsInner
        ref={ref}
        count={count}
        billSize={billSize}
        billAspect={billAspect}
        curvature={curvature}
        speed={speed}
        tumble={tumble}
        lift={lift}
        windDirX={windDirX}
        windDirZ={windDirZ}
        hundredFraction={hundredFraction}
        burnSpeed={burnSpeed}
        autoIgnite={autoIgnite}
        igniteMinAge={igniteMinAge}
        igniteMaxAge={igniteMaxAge}
        noiseScale={noiseScale}
        edgeWidth={edgeWidth}
        charWidth={charWidth}
        glowColorA={glowColorA}
        glowColorB={glowColorB}
        glowIntensity={glowIntensity}
        emberRate={emberRate}
        spawn={spawn}
        bounds={bounds}
        surfaceFriction={surfaceFriction}
        palletBox={palletBox}
        wireframe={wireframe}
        embersRef={embersRef}
      />
    </Suspense>
  );
});

useTexture.preload(BILL_TEXTURES);

export default memo(ClothBills);
