import {
  Fn,
  clamp,
  cos,
  dot,
  float,
  mix,
  normalLocal,
  normalize,
  positionLocal,
  sin,
  smoothstep,
  texture as tslTexture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { sampleWaterInteractionHeight } from './waterInteraction';
import {
  WAVES,
  buildAllSurfaces,
  buildGeometries,
  sampleWaveHeight,
  setWaveTime,
} from './waterUtils';

const EDGE_SEGS = 32;

const CORNER_OFFSETS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

const TOP_EDGE_PAIRS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

function buildEdgeData(hw, hd, topY, botY, edgeMat) {
  const group = new THREE.Group();

  const bottomPts = [
    new THREE.Vector3(-hw, botY, -hd),
    new THREE.Vector3(hw, botY, -hd),
    new THREE.Vector3(hw, botY, hd),
    new THREE.Vector3(-hw, botY, hd),
    new THREE.Vector3(-hw, botY, -hd),
  ];
  group.add(
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(bottomPts), edgeMat)
  );

  const corners = CORNER_OFFSETS.map(([sx, sz]) => {
    const cx = sx * hw;
    const cz = sz * hd;
    const positions = new Float32Array([cx, botY, cz, cx, topY, cz]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.attributes.position.usage = THREE.DynamicDrawUsage;
    group.add(new THREE.Line(geo, edgeMat));
    return { geo, cx, cz };
  });

  const cornerPositions = CORNER_OFFSETS.map(([sx, sz]) => ({
    x: sx * hw,
    z: sz * hd,
  }));

  const topEdges = TOP_EDGE_PAIRS.map(([ia, ib]) => {
    const a = cornerPositions[ia];
    const b = cornerPositions[ib];
    const count = EDGE_SEGS + 1;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const t = i / EDGE_SEGS;
      positions[i * 3] = a.x + (b.x - a.x) * t;
      positions[i * 3 + 1] = topY;
      positions[i * 3 + 2] = a.z + (b.z - a.z) * t;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.attributes.position.usage = THREE.DynamicDrawUsage;
    group.add(new THREE.Line(geo, edgeMat));

    return { geo, a, b };
  });

  return { corners, edgeMat, group, topEdges };
}

function createFallbackInteractionTexture() {
  const textureData = new Float32Array([0, 0, 0, 1]);
  const texture = new THREE.DataTexture(
    textureData,
    1,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  );

  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

export default function NurbsWaterColumnGPU({
  width = 3.6,
  depth = 3.6,
  height = 6.0,
  segments = 24,
  topColor = '#9edff0',
  bottomColor = '#246f98',
  opacity = 0.34,
  transmission = 0.5,
  roughness = 0.3,
  ior = 1.12,
  thickness = 0.35,
  waveHeight = 0.15,
  waveChoppiness = 0.5,
  waveSpeed = 0.6,
  waveHeightRef = null,
  waveChoppinessRef = null,
  waveSpeedRef = null,
  edgeColor = '#1f4455',
  edgeOpacity = 0.65,
  showEdges = true,
  interactionRuntime = null,
}) {
  const groupRef = useRef();
  const pointerPointRef = useRef(new THREE.Vector3());
  const timeRef = useRef(0);
  const fallbackInteractionTexture = useMemo(
    () => createFallbackInteractionTexture(),
    []
  );
  const interactionHeightmapNode = useMemo(
    () => new THREE.TextureNode(fallbackInteractionTexture),
    [fallbackInteractionTexture]
  );

  const u = useMemo(
    () => ({
      botColor: uniform(new THREE.Color(bottomColor)),
      colBot: uniform(-height / 2),
      colTop: uniform(height / 2),
      interactionBounds: uniform(new THREE.Vector2(width, depth)),
      interactionEnabled: uniform(0),
      interactionResolution: uniform(1),
      time: uniform(0),
      topColor: uniform(new THREE.Color(topColor)),
      waveChop: uniform(waveChoppiness),
      waveHeight: uniform(waveHeight),
      waveSpeed: uniform(waveSpeed),
    }),
    [
      bottomColor,
      depth,
      height,
      topColor,
      waveChoppiness,
      waveHeight,
      waveSpeed,
      width,
    ]
  );

  useEffect(
    () => () => fallbackInteractionTexture.dispose(),
    [fallbackInteractionTexture]
  );

  const material = useMemo(() => {
    const interactionUv = Fn(() => {
      const safeWidth = u.interactionBounds.x.max(float(0.0001));
      const safeDepth = u.interactionBounds.y.max(float(0.0001));

      return vec2(
        positionLocal.x.div(safeWidth).add(0.5),
        float(0.5).sub(positionLocal.z.div(safeDepth))
      );
    });

    const sampleInteractionHeightNode = Fn(() => {
      return tslTexture(interactionHeightmapNode, interactionUv()).x.mul(
        u.interactionEnabled
      );
    });

    const sampleInteractionNormalNode = Fn(() => {
      const uvCoord = interactionUv();
      const safeResolution = u.interactionResolution.max(float(1.0));
      const texel = float(1.0).div(safeResolution);
      const worldTexelX = u.interactionBounds.x
        .div(safeResolution)
        .max(float(0.0001));
      const worldTexelY = u.interactionBounds.y
        .div(safeResolution)
        .max(float(0.0001));
      const left = tslTexture(
        interactionHeightmapNode,
        uvCoord.add(vec2(texel.negate(), 0.0))
      ).x.mul(u.interactionEnabled);
      const right = tslTexture(
        interactionHeightmapNode,
        uvCoord.add(vec2(texel, 0.0))
      ).x.mul(u.interactionEnabled);
      const back = tslTexture(
        interactionHeightmapNode,
        uvCoord.add(vec2(0.0, texel.negate()))
      ).x.mul(u.interactionEnabled);
      const front = tslTexture(
        interactionHeightmapNode,
        uvCoord.add(vec2(0.0, texel))
      ).x.mul(u.interactionEnabled);

      return normalize(
        vec3(
          left.sub(right).div(worldTexelX.mul(2.0)),
          1.0,
          back.sub(front).div(worldTexelY.mul(2.0))
        )
      );
    });

    const sampleBaseWaveHeightNode = Fn(() => {
      const d = float(0).toVar();

      WAVES.forEach(({ dx, dz, freq, amp }) => {
        const theta = dot(vec2(dx, dz), positionLocal.xz)
          .mul(freq)
          .add(u.time.mul(u.waveSpeed).mul(freq));
        d.addAssign(float(amp).mul(u.waveHeight).mul(cos(theta)));
      });

      return d;
    });

    const displacementY = Fn(() => {
      const normY = clamp(
        positionLocal.y.sub(u.colBot).div(u.colTop.sub(u.colBot)),
        0.0,
        1.0
      );
      const blend = smoothstep(0.5, 1.0, normY);

      return sampleBaseWaveHeightNode()
        .add(sampleInteractionHeightNode())
        .mul(blend);
    });

    const baseWaveNormal = Fn(() => {
      const nx = float(0).toVar();
      const ny = float(1).toVar();
      const nz = float(0).toVar();

      WAVES.forEach(({ dx, dz, freq, amp }) => {
        const Q = u.waveChop.div(freq * amp * 4.0);
        const WA = float(freq * amp).mul(u.waveHeight);
        const theta = dot(vec2(dx, dz), positionLocal.xz)
          .mul(freq)
          .add(u.time.mul(u.waveSpeed).mul(freq));
        nx.subAssign(float(dx).mul(WA).mul(sin(theta)));
        nz.subAssign(float(dz).mul(WA).mul(sin(theta)));
        ny.subAssign(Q.mul(WA).mul(cos(theta)));
      });

      return normalize(vec3(nx, ny, nz));
    });

    const combinedWaveNormal = Fn(() => {
      const normY = clamp(
        positionLocal.y.sub(u.colBot).div(u.colTop.sub(u.colBot)),
        0.0,
        1.0
      );
      const normalBlend = normalLocal.y
        .greaterThan(0.5)
        .select(smoothstep(0.8, 1.0, normY), float(0));
      const baseNormal = baseWaveNormal();
      const interactionNormal = sampleInteractionNormalNode();
      const safeBaseY = baseNormal.y.abs().max(float(0.0001));
      const safeInteractionY = interactionNormal.y.abs().max(float(0.0001));
      const baseSlope = baseNormal.xz.negate().div(safeBaseY);
      const interactionSlope = interactionNormal.xz
        .negate()
        .div(safeInteractionY);
      const combined = normalize(
        vec3(
          baseSlope.x.add(interactionSlope.x).negate(),
          1.0,
          baseSlope.y.add(interactionSlope.y).negate()
        )
      );

      return mix(normalLocal, combined, normalBlend);
    });

    const gradientColor = Fn(() => {
      const surfaceY = positionLocal.y.add(displacementY());
      const normalizedHeight = clamp(
        surfaceY.sub(u.colBot).div(u.colTop.sub(u.colBot)),
        0.0,
        1.0
      );

      return mix(u.botColor, u.topColor, normalizedHeight);
    });

    const nextMaterial = new THREE.MeshPhysicalNodeMaterial({
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    nextMaterial.color.set(topColor);
    nextMaterial.attenuationColor.set(bottomColor);
    nextMaterial.opacity = opacity;
    // WebGPU transmission currently samples back as black in this water path,
    // which wipes out the gradient tint. Keep the tinted surface shading and
    // skip the transmission code path until the backdrop sampling is reliable.
    nextMaterial.transmission = transmission * 0;
    nextMaterial.roughness = roughness;
    nextMaterial.metalness = 0;
    nextMaterial.ior = ior;
    nextMaterial.thickness = thickness;

    nextMaterial.positionNode = positionLocal.add(
      vec3(0.0, displacementY(), 0.0)
    );
    nextMaterial.normalNode = combinedWaveNormal();
    nextMaterial.colorNode = gradientColor();

    return nextMaterial;
  }, [
    bottomColor,
    ior,
    interactionHeightmapNode,
    opacity,
    roughness,
    thickness,
    transmission,
    topColor,
    u,
  ]);

  const geometries = useMemo(() => {
    const surfaces = buildAllSurfaces({ width, depth, height });
    return buildGeometries(surfaces, segments, height, Math.max(width, depth));
  }, [depth, height, segments, width]);

  const edgeData = useMemo(() => {
    if (!showEdges) {
      return null;
    }

    const edgeMat = new THREE.LineBasicNodeMaterial({
      color: new THREE.Color(edgeColor),
      opacity: edgeOpacity,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    });

    return buildEdgeData(
      width / 2,
      depth / 2,
      height / 2,
      -height / 2,
      edgeMat
    );
  }, [depth, edgeColor, edgeOpacity, height, showEdges, width]);

  const interactionHitGeometry = useMemo(
    () => new THREE.PlaneGeometry(width, depth, 1, 1),
    [depth, width]
  );
  const interactionHitY = useMemo(
    () => height / 2 + Math.max(waveHeight * 1.5 + 0.048, 0.02),
    [height, waveHeight]
  );

  const clearPointerTarget = useCallback(() => {
    interactionRuntime?.clearPointerTarget();
  }, [interactionRuntime]);

  const handlePointerMove = useCallback(
    (event) => {
      if (!groupRef.current || !interactionRuntime) {
        return;
      }

      event.stopPropagation();

      const point = groupRef.current.worldToLocal(
        pointerPointRef.current.copy(event.point)
      );

      interactionRuntime.setPointerTarget(
        THREE.MathUtils.clamp(point.x, -width / 2, width / 2),
        THREE.MathUtils.clamp(point.z, -depth / 2, depth / 2)
      );
    },
    [depth, interactionRuntime, width]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const liveWaveHeight = waveHeightRef?.current ?? waveHeight;
    const liveWaveSpeed = waveSpeedRef?.current ?? waveSpeed;
    const liveWaveChoppiness = waveChoppinessRef?.current ?? waveChoppiness;
    const interactionState = interactionRuntime?.interactionStateRef.current;
    const interactionEnabled = interactionRuntime?.configRef.current.enabled;

    setWaveTime(t);
    interactionRuntime?.advance(delta);

    u.time.value = t;
    u.waveHeight.value = liveWaveHeight;
    u.waveSpeed.value = liveWaveSpeed;
    u.waveChop.value = liveWaveChoppiness;
    u.colTop.value = height / 2;
    u.colBot.value = -height / 2;
    u.topColor.value.set(topColor);
    u.botColor.value.set(bottomColor);
    u.interactionBounds.value.set(width, depth);
    u.interactionEnabled.value = interactionEnabled ? 1 : 0;
    interactionHeightmapNode.value =
      interactionState?.texture ?? fallbackInteractionTexture;
    u.interactionResolution.value = interactionState?.size ?? 1;

    if (!showEdges || !edgeData) {
      return;
    }

    edgeData.edgeMat.color.set(edgeColor);
    edgeData.edgeMat.opacity = edgeOpacity;

    const topY = height / 2;

    edgeData.corners.forEach(({ geo, cx, cz }) => {
      const wY = sampleWaveHeight(
        cx,
        cz,
        liveWaveHeight,
        liveWaveChoppiness,
        liveWaveSpeed
      );
      const interactionY = interactionEnabled
        ? sampleWaterInteractionHeight(cx, cz, width, depth, interactionState)
        : 0;
      const positionAttribute = geo.attributes.position;
      const positions = positionAttribute.array;
      positions[4] = topY + wY + interactionY;
      positionAttribute.needsUpdate = true;
    });

    edgeData.topEdges.forEach(({ geo, a, b }) => {
      const positionAttribute = geo.attributes.position;
      const positions = positionAttribute.array;
      const count = EDGE_SEGS + 1;

      for (let i = 0; i < count; i += 1) {
        const tValue = i / EDGE_SEGS;
        const px = a.x + (b.x - a.x) * tValue;
        const pz = a.z + (b.z - a.z) * tValue;
        const wY = sampleWaveHeight(
          px,
          pz,
          liveWaveHeight,
          liveWaveChoppiness,
          liveWaveSpeed
        );
        const interactionY = interactionEnabled
          ? sampleWaterInteractionHeight(px, pz, width, depth, interactionState)
          : 0;
        positions[i * 3 + 1] = topY + wY + interactionY;
      }

      positionAttribute.needsUpdate = true;
    });
  });

  return (
    <group ref={groupRef}>
      {geometries.map((geo, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <mesh key={idx} geometry={geo} material={material} />
      ))}

      {interactionRuntime && (
        <mesh
          geometry={interactionHitGeometry}
          onPointerMove={handlePointerMove}
          onPointerOut={clearPointerTarget}
          onPointerOver={handlePointerMove}
          position={[0, interactionHitY, 0]}
          rotation-x={-Math.PI / 2}
        >
          <meshBasicMaterial depthWrite={false} opacity={0} transparent />
        </mesh>
      )}

      {showEdges && edgeData && <primitive object={edgeData.group} />}
    </group>
  );
}
