/* eslint-disable no-plusplus */

/* eslint-disable no-shadow */
import React, { Suspense, memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import {
  Fn,
  cameraPosition,
  cos,
  dot,
  faceDirection,
  float,
  instancedBufferAttribute,
  mod,
  positionLocal,
  positionWorld,
  rotate,
  sin,
  time,
  transformNormalToView,
  texture as tslTexture,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import ClothLeaves from './ClothLeaves';

const LEAF_SPRITES = [
  '/textures/leaves/willow.png',
  '/textures/leaves/bay.png',
  '/textures/leaves/broadleaf.png',
  '/textures/leaves/ivy.png',
  '/textures/leaves/palm.png',
  '/textures/leaves/tropical.png',
  '/textures/leaves/maple.png',
  '/textures/leaves/iris.png',
  '/textures/leaves/grass.png',
  '/textures/leaves/linden.png',
  '/textures/leaves/mapleleaf.png',
];

const BLOSSOM_SPRITES = [
  '/textures/flowers/blossom1.png',
  '/textures/flowers/blossom2.png',
  '/textures/flowers/sakurapetal.png',
];

const SNOWFLAKE_SPRITES = [
  '/textures/snow/snowflake_01.png',
  '/textures/snow/snowflake_02.png',
  '/textures/snow/snowflake_03.png',
  '/textures/snow/snowflake_04.png',
  '/textures/snow/snowflake_05.png',
  '/textures/snow/snowflake_06.png',
];

function makeRainStreakDataUri(widthFrac, alpha) {
  const W = 256;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const streakW = Math.max(2, Math.round(W * widthFrac));
  const x0 = (W - streakW) / 2;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.0, `rgba(255,255,255,0)`);
  grad.addColorStop(0.05, `rgba(255,255,255,${alpha})`);
  grad.addColorStop(0.8, `rgba(255,255,255,${alpha * 0.5})`);
  grad.addColorStop(1.0, `rgba(255,255,255,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x0, 0, streakW, H);
  return canvas.toDataURL('image/png');
}

export const RAIN_SPRITES = [
  makeRainStreakDataUri(0.05, 0.9),
  makeRainStreakDataUri(0.04, 0.65),
  makeRainStreakDataUri(0.06, 0.75),
];

const ATLAS_SIZE = 256;

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

function getYExtentAtZ(camera, zPlane) {
  const vFovHalf = THREE.MathUtils.degToRad(camera.fov / 2);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const t = (zPlane - camera.position.z) / dir.z;
  const centerY = camera.position.y + dir.y * t;
  const halfHeight = Math.tan(vFovHalf) * Math.abs(camera.position.z - zPlane);
  return { topEdge: centerY + halfHeight, bottomEdge: centerY - halfHeight };
}

// Build a DataArrayTexture from already-loaded THREE.Texture objects.
// All source images must be 256×256 (ATLAS_SIZE).
function buildArrayTexture(loadedTextures) {
  const N = loadedTextures.length;
  const W = ATLAS_SIZE;
  const H = ATLAS_SIZE;
  const data = new Uint8Array(W * H * 4 * N);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  loadedTextures.forEach((tex, i) => {
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

// ------------------------------------------------------------------
// FallingLeavesInner — single mesh, one draw call
// ------------------------------------------------------------------
function FallingLeavesInner({
  count,
  colors,
  sprites: spriteUrls,
  leafSize,
  leafAspect,
  speed,
  speedJitter,
  cycleTravel,
  tumble,
  curvature,
  wind,
  windDirX,
  windDirZ,
  windInfluence,
  flutter,
  roughness,
  translucency,
  keyPosX,
  keyPosY,
  keyPosZ,
  keyColor,
  flowMode,
  alignToWind,
  wireframe,
  scenePhysics,
}) {
  const loadedSprites = useTexture(spriteUrls);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const sceneCursorSphere = scenePhysics?.cursorSphere ?? null;

  // Pack all sprites into one DataArrayTexture
  const arrayTex = useMemo(
    () =>
      buildArrayTexture(
        Array.isArray(loadedSprites) ? loadedSprites : [loadedSprites]
      ),
    [loadedSprites]
  );

  // Frustum-derived spawn bounds (z=-1 = widest cross-section in leaf depth range)
  const { spawnXMin, spawnXMax, spawnYMin, spawnYMax, safeTravel } =
    useMemo(() => {
      const aspect = size.width / size.height;
      const margin = 1.5;

      if (flowMode === 'vertical') {
        const { leftEdge, rightEdge } = getXExtentAtZ(camera, aspect, -1);
        const { topEdge, bottomEdge } = getYExtentAtZ(camera, -1);
        const spawnYMin = topEdge + margin * 0.5;
        const spawnYMax = topEdge + margin * 2;
        const windNorm = Math.sqrt(
          (windDirX * 0.15) ** 2 + 1 + (windDirZ * 0.15) ** 2
        );
        const yComp = 1 / windNorm;
        return {
          spawnXMin: leftEdge - margin,
          spawnXMax: rightEdge + margin,
          spawnYMin,
          spawnYMax,
          safeTravel: (spawnYMax - bottomEdge + margin) / yComp,
        };
      }

      const { leftEdge, rightEdge } = getXExtentAtZ(camera, aspect, -1);
      const windNorm = Math.sqrt(windDirX ** 2 + 0.0625 + windDirZ ** 2);
      const windXComp = Math.max(windDirX / windNorm, 0.5);
      const spawnXMax = leftEdge - margin * 0.5;
      const spawnXMin = leftEdge - margin * 2;
      return {
        spawnXMin,
        spawnXMax,
        spawnYMin: -2,
        spawnYMax: 4,
        safeTravel: (rightEdge - spawnXMax + margin) / windXComp,
      };
    }, [camera, size, flowMode, windDirX, windDirZ]);

  const effectiveTravel = Math.max(cycleTravel, safeTravel);

  const windUniforms = useMemo(
    () => ({
      windU: uniform(wind),
      windDirXU: uniform(windDirX),
      windDirZU: uniform(windDirZ),
      windInfluenceU: uniform(windInfluence),
      windTiltU: uniform(0),
    }),
    []
  );

  const lightUniforms = useMemo(
    () => ({
      keyDirU: uniform(new THREE.Vector3(0, 1, 0)),
      keyColorU: uniform(new THREE.Color('#ffffff')),
      translucencyU: uniform(0),
    }),
    []
  );

  const cursorUniforms = useMemo(
    () => ({
      cursorPosU: uniform(new THREE.Vector3(10, 10, 10)),
      cursorRadiusU: uniform(0.12),
      cursorEnabledU: uniform(0),
    }),
    []
  );

  useFrame(() => {
    // The scene's key light aims at the origin, so its position doubles as the
    // direction light arrives from.
    lightUniforms.keyDirU.value.set(keyPosX, keyPosY, keyPosZ).normalize();
    lightUniforms.keyColorU.value.set(keyColor);
    lightUniforms.translucencyU.value = translucency;

    windUniforms.windU.value = wind;
    windUniforms.windDirXU.value = windDirX;
    windUniforms.windDirZU.value = windDirZ;
    windUniforms.windInfluenceU.value = windInfluence;
    windUniforms.windTiltU.value = alignToWind
      ? -Math.atan(windDirX * windInfluence)
      : 0;

    if (sceneCursorSphere) {
      cursorUniforms.cursorPosU.value.copy(sceneCursorSphere.position);
      cursorUniforms.cursorRadiusU.value = sceneCursorSphere.radius;
      cursorUniforms.cursorEnabledU.value = sceneCursorSphere.enabled ? 1 : 0;
    } else {
      cursorUniforms.cursorEnabledU.value = 0;
    }
  });

  // Single mesh — all instances, all sprites, all colors, one draw call
  const mesh = useMemo(() => {
    const numSprites = spriteUrls.length;
    const numColors = colors.length;
    const totalCombos = numSprites * numColors;

    // WebGPU binds at most 8 vertex buffers and a lit material claims three of
    // them for position/uv/normal, so every per-instance scalar rides in the
    // spare component of a vector rather than taking a buffer of its own.
    const positions = []; // vec4: xyz = spawn point, w = scale
    const rotations = []; // vec4: xyz = euler angles, w = speed multiplier
    const timeOffsets = [];
    const instanceColors = []; // vec4: rgb = tint, w = sprite layer

    const col = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const combo = i % totalCombos;
      const si = combo % numSprites;
      const ci = Math.floor(combo / numSprites) % numColors;
      col.set(colors[ci]);

      const x = THREE.MathUtils.randFloat(spawnXMin, spawnXMax);
      const y =
        flowMode === 'vertical'
          ? THREE.MathUtils.randFloat(spawnYMin, spawnYMax)
          : THREE.MathUtils.randFloat(-2, 4);

      // Extend z toward camera (at z=2.5) so some particles pass close
      const z = THREE.MathUtils.randFloat(-2, 2.1);
      // Natural size variation — closer particles also appear larger via perspective
      positions.push(x, y, z, THREE.MathUtils.randFloat(0.5, 1.8));
      rotations.push(
        Math.random(),
        Math.random(),
        Math.random(),
        1 + (Math.random() * 2 - 1) * speedJitter
      );
      timeOffsets.push(i / count);
      instanceColors.push(col.r, col.g, col.b, si);
    }

    const posAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(positions),
      4
    );
    const rotAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(rotations),
      4
    );
    const timeAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(timeOffsets),
      1
    );
    const colorAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(instanceColors),
      4
    );

    const geometry = new THREE.PlaneGeometry(
      leafSize,
      leafSize * leafAspect,
      8,
      8
    );
    const alphaClip = 0.1;

    const material = new THREE.MeshStandardNodeMaterial({
      side: THREE.DoubleSide,
      forceSinglePass: true,
      transparent: true,
      alphaTest: alphaClip,
      roughness,
      metalness: 0,
      wireframe,
    });

    // TSL instance nodes
    const posAndScale = instancedBufferAttribute(posAttr); // vec4
    const instancePosition = posAndScale.xyz;
    const instanceScale = posAndScale.w;
    const rotAndSpeed = instancedBufferAttribute(rotAttr); // vec4
    const instanceRotation = rotAndSpeed.xyz;
    const instanceSpeedMult = rotAndSpeed.w;
    const instanceTime = instancedBufferAttribute(timeAttr);
    const colorAndSprite = instancedBufferAttribute(colorAttr); // vec4
    const instanceColor = colorAndSprite.xyz;
    const instanceSpriteIdx = colorAndSprite.w;

    const { windDirXU, windDirZU, windInfluenceU, windTiltU } = windUniforms;
    const { cursorPosU, cursorRadiusU, cursorEnabledU } = cursorUniforms;
    const { keyDirU, keyColorU, translucencyU } = lightUniforms;

    const localTime = instanceTime.add(time.mul(speed).mul(instanceSpeedMult));
    const modTime = mod(localTime, 1.0);
    const cursorReactionRange = leafSize * 4;
    const cursorPushStrength = leafSize * 4;
    const cursorSpinStrength = 1.4;

    // Paraboloid cup: bend z before rotation so the cup follows the tumble
    const leafUV = uv();
    const dx = leafUV.x.sub(0.5);
    const dy = leafUV.y.sub(0.5);
    const bent = positionLocal.add(
      vec3(
        0,
        0,
        dx
          .mul(dx)
          .add(dy.mul(dy))
          .mul(curvature * leafSize * 2)
      )
    );

    const travelDir =
      flowMode === 'vertical'
        ? vec3(windDirXU.mul(windInfluenceU), -1, windDirZU.mul(windInfluenceU))
            .normalize()
            .mul(effectiveTravel)
            .mul(modTime)
        : vec3(windDirXU, -0.25, windDirZU)
            .normalize()
            .mul(effectiveTravel)
            .mul(modTime);

    const basePosition = instancePosition.add(travelDir);
    const cursorDelta = basePosition.sub(cursorPosU);
    const cursorDistance = cursorDelta.length().max(float(0.0001));
    const cursorReach = cursorRadiusU.add(float(cursorReactionRange));
    const cursorResponse = cursorReach
      .sub(cursorDistance)
      .div(cursorReach)
      .clamp(0, 1)
      .mul(cursorEnabledU);
    const cursorOffset = cursorDelta
      .div(cursorDistance)
      .mul(cursorResponse.mul(cursorPushStrength));
    const cursorSpin = vec3(
      cursorResponse.mul(cursorSpinStrength),
      cursorResponse.mul(cursorSpinStrength * 0.6),
      cursorResponse.mul(cursorSpinStrength * 0.25)
    );

    // A leaf falls unevenly — it stalls, slips sideways and rocks about its
    // stem. Without this every instance tracks the same straight line at a
    // constant rate and the field reads as being on rails.
    const flutterPhase = instanceTime.mul(Math.PI * 2 * 7).add(time.mul(2.1));
    const flutterSway = vec3(
      sin(flutterPhase),
      sin(flutterPhase.mul(0.73).add(1.7)).mul(0.35),
      cos(flutterPhase.mul(1.31))
    ).mul(flutter * leafSize * 2.5);
    const flutterRock = vec3(
      sin(flutterPhase.mul(1.17)).mul(0.6),
      cos(flutterPhase.mul(0.81)).mul(0.4),
      sin(flutterPhase.mul(1.43)).mul(0.5)
    ).mul(flutter);

    // windTiltU is 0 for normal particles; for rain it aligns the streak to travel direction.
    // tumble is 0 for rain, so the two terms are mutually exclusive in practice.
    const rotation = instanceRotation
      .mul(modTime.mul(tumble))
      .add(vec3(0, 0, windTiltU))
      .add(cursorSpin)
      .add(flutterRock);
    const rotated = rotate(bent.mul(instanceScale), rotation);

    material.positionNode = rotated
      .add(basePosition)
      .add(cursorOffset)
      .add(flutterSway);

    // The geometry is a flat plane, so its stored normal points at +Z for every
    // instance no matter how the positionNode has tumbled it. Rotate the cup's
    // own normal by the same euler or the whole field lights identically.
    // dx/dy are UV-space while the cup's rise is world-space, so divide the
    // slope through by the quad's extent in each axis.
    const cupSlope = curvature * 4;
    const leafNormal = vec3(
      dx.mul(-cupSlope),
      dy.mul(-cupSlope / leafAspect),
      1
    ).normalize();
    const rotatedNormal = rotate(leafNormal, rotation).normalize();
    // Carried as a varying so the tumble stays in the vertex stage instead of
    // dragging every instanced attribute it depends on into the fragment one.
    // faceDirection is applied after, where gl_FrontFacing exists.
    material.normalNode = transformNormalToView(rotatedNormal)
      .toVarying()
      .mul(faceDirection);

    // Sample DataArrayTexture: uv as vec2, layer as separate depth int
    const texSample = tslTexture(arrayTex, leafUV).depth(instanceSpriteIdx);
    material.colorNode = instanceColor.mul(texSample.rgb);
    material.opacityNode = texSample.a;

    // Autumn leaves are thin enough to glow when the light is behind them.
    // Strongest looking into the light, through a leaf turned broadside to it.
    // Both terms vary slowly across a leaf this small, so resolve them per
    // vertex and hand the fragment stage a single float.
    const viewDirWorld = cameraPosition.sub(positionWorld).normalize();
    const towardLight = dot(viewDirWorld, keyDirU).negate().clamp(0, 1).pow(3);
    const broadside = dot(rotatedNormal, keyDirU).abs();
    const backlit = towardLight.mul(broadside).toVarying();
    material.emissiveNode = instanceColor
      .mul(texSample.rgb)
      .mul(keyColorU)
      .mul(backlit.mul(translucencyU));
    material.castShadowNode = Fn(() => {
      texSample.a.lessThanEqual(alphaClip).discard();
      return vec4(0, 0, 0, 1);
    })();

    const m = new THREE.Mesh(geometry, material);
    m.count = count;
    m.castShadow = true;
    m.frustumCulled = false;
    return m;
  }, [
    count,
    colors,
    spriteUrls,
    arrayTex,
    leafSize,
    leafAspect,
    speed,
    speedJitter,
    effectiveTravel,
    tumble,
    curvature,
    flutter,
    roughness,
    windUniforms,
    cursorUniforms,
    lightUniforms,
    flowMode,
    spawnXMin,
    spawnXMax,
    spawnYMin,
    spawnYMax,
  ]);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      arrayTex.dispose();
    };
  }, [mesh, arrayTex]);

  useEffect(() => {
    if (mesh.material.wireframe === wireframe) return;
    mesh.material.wireframe = wireframe;
    mesh.material.needsUpdate = true;
  }, [mesh, wireframe]);

  return <primitive object={mesh} />;
}

// ------------------------------------------------------------------
// FallingLeaves — public export
// ------------------------------------------------------------------
const SPRITES_BY_TYPE = {
  Leaves: LEAF_SPRITES,
  Blossoms: BLOSSOM_SPRITES,
  Snowflakes: SNOWFLAKE_SPRITES,
  Rain: RAIN_SPRITES,
};

function FallingLeaves({
  mode = 'billboard',
  leafType = 'Leaves',
  count = 300,
  color1 = '#d70654',
  color2 = '#ffd95f',
  color3 = '#b8d576',
  leafSize = 0.08,
  leafAspect = 1,
  speed = 0.08,
  speedJitter = 0.15,
  cycleTravel = 5,
  tumble = 20,
  curvature = 0.4,
  wind = 1,
  windDirX = 1,
  windDirZ = 0,
  windInfluence = 0.15,
  flutter = 0,
  roughness = 0.6,
  translucency = 0,
  keyPosX = 0,
  keyPosY = 1,
  keyPosZ = 0,
  keyColor = '#ffffff',
  wireframe = false,
  scenePhysics = null,
}) {
  // Cloth mode only supports Leaves and Blossoms (physics-based, ignores billboard-only params)
  if (mode === 'cloth' && (leafType === 'Leaves' || leafType === 'Blossoms')) {
    return (
      <ClothLeaves
        leafType={leafType}
        count={count}
        sprites={SPRITES_BY_TYPE[leafType] ?? LEAF_SPRITES}
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
    );
  }

  const sprites = SPRITES_BY_TYPE[leafType] ?? LEAF_SPRITES;
  const flowMode =
    leafType === 'Snowflakes' || leafType === 'Rain'
      ? 'vertical'
      : 'horizontal';
  const alignToWind = leafType === 'Rain';
  const colors = useMemo(
    () => [color1, color2, color3],
    [color1, color2, color3]
  );

  return (
    <Suspense fallback={null}>
      <FallingLeavesInner
        count={count}
        colors={colors}
        sprites={sprites}
        leafSize={leafSize}
        leafAspect={leafAspect}
        speed={speed}
        speedJitter={speedJitter}
        cycleTravel={cycleTravel}
        tumble={tumble}
        curvature={curvature}
        wind={wind}
        windDirX={windDirX}
        windDirZ={windDirZ}
        windInfluence={windInfluence}
        flutter={flutter}
        roughness={roughness}
        translucency={translucency}
        keyPosX={keyPosX}
        keyPosY={keyPosY}
        keyPosZ={keyPosZ}
        keyColor={keyColor}
        flowMode={flowMode}
        alignToWind={alignToWind}
        wireframe={wireframe}
        scenePhysics={scenePhysics}
      />
    </Suspense>
  );
}

export default memo(FallingLeaves);
