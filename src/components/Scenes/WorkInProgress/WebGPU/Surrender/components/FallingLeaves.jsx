import {
  color as tslColor,
  instancedBufferAttribute,
  mod,
  positionLocal,
  rotate,
  texture as tslTexture,
  time,
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

// Project camera ray to a z plane, return world-space x extent.
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

// Project camera ray to a z plane, return world-space y extent.
function getYExtentAtZ(camera, zPlane) {
  const vFovHalf = THREE.MathUtils.degToRad(camera.fov / 2);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const t = (zPlane - camera.position.z) / dir.z;
  const centerY = camera.position.y + dir.y * t;
  const halfHeight = Math.tan(vFovHalf) * Math.abs(camera.position.z - zPlane);
  return { topEdge: centerY + halfHeight, bottomEdge: centerY - halfHeight };
}

// ------------------------------------------------------------------
// LeafLayer — one instanced mesh per sprite/color combo
// ------------------------------------------------------------------
function LeafLayer({
  count, hexColor, sprite, leafSize, speed, cycleTravel, tumble, curvature,
  windUniforms, flowMode,
  spawnXMin, spawnXMax, spawnYMin, spawnYMax,
}) {
  const mesh = useMemo(() => {
    const positions = [];
    const rotations = [];
    const timeOffsets = [];

    for (let i = 0; i < count; i++) {
      const x = flowMode === 'vertical'
        ? THREE.MathUtils.randFloat(spawnXMin, spawnXMax)
        : THREE.MathUtils.randFloat(spawnXMin, spawnXMax);
      const y = flowMode === 'vertical'
        ? THREE.MathUtils.randFloat(spawnYMin, spawnYMax)
        : THREE.MathUtils.randFloat(-2, 4);
      positions.push(x, y, THREE.MathUtils.randFloat(-1, 1));
      rotations.push(Math.random(), Math.random(), Math.random());
      timeOffsets.push(i / count);
    }

    const posAttr = new THREE.InstancedBufferAttribute(new Float32Array(positions), 3);
    const rotAttr = new THREE.InstancedBufferAttribute(new Float32Array(rotations), 3);
    const timeAttr = new THREE.InstancedBufferAttribute(new Float32Array(timeOffsets), 1);

    const geometry = new THREE.PlaneGeometry(leafSize, leafSize, 8, 8);
    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      forceSinglePass: true,
      transparent: true,
    });

    const texNode = tslTexture(sprite);
    material.colorNode = tslColor(hexColor).mul(texNode.rgb);
    material.opacityNode = texNode.a;

    const instancePosition = instancedBufferAttribute(posAttr);
    const instanceRotation = instancedBufferAttribute(rotAttr);
    const instanceTime = instancedBufferAttribute(timeAttr);
    const { windDirXU, windDirZU } = windUniforms;

    const localTime = instanceTime.add(time.mul(speed));
    const modTime = mod(localTime, 1.0);

    // Paraboloid cup: displace z by (dx² + dy²) * scale, center stays flat, edges curve back.
    // Scale by leafSize so curvature=1 means full-depth cup regardless of sprite size.
    const leafUV = uv();
    const dx = leafUV.x.sub(0.5);
    const dy = leafUV.y.sub(0.5);
    const bendScale = curvature * leafSize * 2;
    const bent = positionLocal.add(vec3(0, 0, dx.mul(dx).add(dy.mul(dy)).mul(bendScale)));

    const rotated = rotate(bent, instanceRotation.mul(modTime.mul(tumble)));

    // Horizontal (leaves/blossoms): blow sideways with slight downward drift
    // Vertical (snow): fall downward with slight wind drift
    const travelDir = flowMode === 'vertical'
      ? vec3(windDirXU.mul(0.15), -1, windDirZU.mul(0.15)).normalize().mul(cycleTravel).mul(modTime)
      : vec3(windDirXU, -0.25, windDirZU).normalize().mul(cycleTravel).mul(modTime);

    material.positionNode = rotated.add(instancePosition).add(travelDir);

    const m = new THREE.Mesh(geometry, material);
    m.count = count;
    m.frustumCulled = false;
    return m;
  }, [count, hexColor, sprite, leafSize, speed, cycleTravel, tumble, curvature, windUniforms, flowMode, spawnXMin, spawnXMax, spawnYMin, spawnYMax]);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    };
  }, [mesh]);

  return <primitive object={mesh} />;
}

// ------------------------------------------------------------------
// FallingLeavesInner — loads all sprites, renders one layer per sprite
// ------------------------------------------------------------------
function FallingLeavesInner({
  count, colors, sprites: spriteUrls, leafSize, speed, cycleTravel, tumble, curvature,
  wind, windDirX, windDirZ, flowMode,
}) {
  const sprites = useTexture(spriteUrls);
  const { camera, size } = useThree();

  const { spawnXMin, spawnXMax, spawnYMin, spawnYMax, safeTravel } = useMemo(() => {
    const aspect = size.width / size.height;
    const margin = 1.5;

    if (flowMode === 'vertical') {
      // Snow: spawn above screen, fall downward. Use z=-1 for widest frustum.
      const { leftEdge, rightEdge } = getXExtentAtZ(camera, aspect, -1);
      const { topEdge, bottomEdge } = getYExtentAtZ(camera, -1);

      const spawnYMin = topEdge + margin * 0.5;
      const spawnYMax = topEdge + margin * 2;

      // Travel needed so spawnYMin reaches past bottomEdge - margin (downward, negative y)
      // travel_y = cycleTravel * normalize(windX*0.15, -1, windZ*0.15).y
      const windNorm = Math.sqrt((windDirX * 0.15) ** 2 + 1 + (windDirZ * 0.15) ** 2);
      const yComp = 1 / windNorm; // magnitude of -1 component after normalization
      const safeTravel = (spawnYMax - bottomEdge + margin) / yComp;

      return {
        spawnXMin: leftEdge - margin,
        spawnXMax: rightEdge + margin,
        spawnYMin,
        spawnYMax,
        safeTravel,
      };
    }

    // Horizontal (leaves/blossoms): spawn off-screen left, blow right.
    const { leftEdge, rightEdge } = getXExtentAtZ(camera, aspect, -1);
    const windNorm = Math.sqrt(windDirX ** 2 + 0.0625 + windDirZ ** 2);
    const windXComp = Math.max(windDirX / windNorm, 0.5);
    const spawnXMax = leftEdge - margin * 0.5;
    const spawnXMin = leftEdge - margin * 2;
    const safeTravel = (rightEdge - spawnXMax + margin) / windXComp;

    return { spawnXMin, spawnXMax, spawnYMin: -2, spawnYMax: 4, safeTravel };
  }, [camera, size, flowMode, windDirX, windDirZ]);

  const effectiveTravel = Math.max(cycleTravel, safeTravel);

  const windUniforms = useMemo(
    () => ({
      windU: uniform(wind),
      windDirXU: uniform(windDirX),
      windDirZU: uniform(windDirZ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(() => {
    windUniforms.windU.value = wind;
    windUniforms.windDirXU.value = windDirX;
    windUniforms.windDirZU.value = windDirZ;
  });

  const perLayer = Math.max(1, Math.floor(count / spriteUrls.length));

  return (
    <>
      {sprites.map((sprite, i) => (
        <LeafLayer
          key={i}
          count={perLayer}
          hexColor={colors[i % colors.length]}
          sprite={sprite}
          leafSize={leafSize}
          speed={speed}
          cycleTravel={effectiveTravel}
          tumble={tumble}
          curvature={curvature}
          windUniforms={windUniforms}
          flowMode={flowMode}
          spawnXMin={spawnXMin}
          spawnXMax={spawnXMax}
          spawnYMin={spawnYMin}
          spawnYMax={spawnYMax}
        />
      ))}
    </>
  );
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
