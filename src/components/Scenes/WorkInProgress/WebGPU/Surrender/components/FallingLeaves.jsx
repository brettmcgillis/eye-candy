import {
  instancedBufferAttribute,
  mod,
  positionLocal,
  rotate,
  time,
  texture as tslTexture,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { Suspense, memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

export const LEAF_SPRITES = [
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
];

export const BLOSSOM_SPRITES = [
  '/textures/flowers/blossom1.png',
  '/textures/flowers/blossom2.png',
];

export const SNOWFLAKE_SPRITES = ['/textures/snowflake.png'];

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
  const ctx = canvas.getContext('2d');

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
  speed,
  cycleTravel,
  tumble,
  curvature,
  wind,
  windDirX,
  windDirZ,
  flowMode,
}) {
  const loadedSprites = useTexture(spriteUrls);
  const { camera, size } = useThree();

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
    }),
    []
  );

  useFrame(() => {
    windUniforms.windU.value = wind;
    windUniforms.windDirXU.value = windDirX;
    windUniforms.windDirZU.value = windDirZ;
  });

  // Single mesh — all instances, all sprites, all colors, one draw call
  const mesh = useMemo(() => {
    const numSprites = spriteUrls.length;
    const numColors = colors.length;
    const totalCombos = numSprites * numColors;

    const positions = [];
    const rotations = [];
    const timeOffsets = [];
    const spriteIndices = [];
    const instanceColors = [];

    const col = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const combo = i % totalCombos;
      const si = combo % numSprites;
      const ci = Math.floor(combo / numSprites) % numColors;
      col.set(colors[ci]);

      const x =
        flowMode === 'vertical'
          ? THREE.MathUtils.randFloat(spawnXMin, spawnXMax)
          : THREE.MathUtils.randFloat(spawnXMin, spawnXMax);
      const y =
        flowMode === 'vertical'
          ? THREE.MathUtils.randFloat(spawnYMin, spawnYMax)
          : THREE.MathUtils.randFloat(-2, 4);

      positions.push(x, y, THREE.MathUtils.randFloat(-1, 1));
      rotations.push(Math.random(), Math.random(), Math.random());
      timeOffsets.push(i / count);
      spriteIndices.push(si);
      instanceColors.push(col.r, col.g, col.b);
    }

    const posAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(positions),
      3
    );
    const rotAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(rotations),
      3
    );
    const timeAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(timeOffsets),
      1
    );
    const spriteAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(spriteIndices),
      1
    );
    const colorAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(instanceColors),
      3
    );

    const geometry = new THREE.PlaneGeometry(leafSize, leafSize, 8, 8);

    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      forceSinglePass: true,
      transparent: true,
    });

    // TSL instance nodes
    const instancePosition = instancedBufferAttribute(posAttr);
    const instanceRotation = instancedBufferAttribute(rotAttr);
    const instanceTime = instancedBufferAttribute(timeAttr);
    const instanceSpriteIdx = instancedBufferAttribute(spriteAttr);
    const instanceColor = instancedBufferAttribute(colorAttr);

    const { windDirXU, windDirZU } = windUniforms;

    const localTime = instanceTime.add(time.mul(speed));
    const modTime = mod(localTime, 1.0);

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
    const rotated = rotate(bent, instanceRotation.mul(modTime.mul(tumble)));

    const travelDir =
      flowMode === 'vertical'
        ? vec3(windDirXU.mul(0.15), -1, windDirZU.mul(0.15))
            .normalize()
            .mul(effectiveTravel)
            .mul(modTime)
        : vec3(windDirXU, -0.25, windDirZU)
            .normalize()
            .mul(effectiveTravel)
            .mul(modTime);

    material.positionNode = rotated.add(instancePosition).add(travelDir);

    // Sample DataArrayTexture: uv as vec2, layer as separate depth int
    const texSample = tslTexture(arrayTex, leafUV).depth(instanceSpriteIdx);
    material.colorNode = instanceColor.mul(texSample.rgb);
    material.opacityNode = texSample.a;

    const m = new THREE.Mesh(geometry, material);
    m.count = count;
    m.frustumCulled = false;
    return m;
  }, [
    count,
    colors,
    spriteUrls,
    arrayTex,
    leafSize,
    speed,
    effectiveTravel,
    tumble,
    curvature,
    windUniforms,
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

  return <primitive object={mesh} />;
}

// ------------------------------------------------------------------
// FallingLeaves — public export
// ------------------------------------------------------------------
function FallingLeaves({
  count = 300,
  colors = ['#d70654', '#ffd95f', '#b8d576'],
  sprites = LEAF_SPRITES,
  leafSize = 0.08,
  speed = 0.08,
  cycleTravel = 5,
  tumble = 20,
  curvature = 0.4,
  wind = 1,
  windDirX = 1,
  windDirZ = 0,
  flowMode = 'horizontal',
}) {
  return (
    <Suspense fallback={null}>
      <FallingLeavesInner
        count={count}
        colors={colors}
        sprites={sprites}
        leafSize={leafSize}
        speed={speed}
        cycleTravel={cycleTravel}
        tumble={tumble}
        curvature={curvature}
        wind={wind}
        windDirX={windDirX}
        windDirZ={windDirZ}
        flowMode={flowMode}
      />
    </Suspense>
  );
}

export default memo(FallingLeaves);
