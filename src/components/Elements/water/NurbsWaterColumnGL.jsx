import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { extend, useFrame } from '@react-three/fiber';

import { sampleWaterInteractionHeight } from './waterInteraction';
import {
  buildAllSurfaces,
  buildGeometries,
  sampleWaveHeight,
  setWaveTime,
} from './waterUtils';

extend({ Line2 });

// ── GLSL: Gerstner wave displacement + normal ───────────────────────

const WAVE_PREAMBLE = /* glsl */ `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;
  uniform float uColumnTop;
  uniform float uColumnBottom;
  uniform float uInteractionEnabled;
  uniform float uInteractionResolution;
  uniform sampler2D uInteractionHeightmap;
  uniform vec2 uInteractionBounds;

  varying float vNormHeight;

  vec2 interactionUvFromXZ(vec2 xz) {
    return vec2(
      xz.x / max(uInteractionBounds.x, 0.0001) + 0.5,
      0.5 - xz.y / max(uInteractionBounds.y, 0.0001)
    );
  }

  float sampleInteractionHeight(vec2 xz) {
    vec2 uv = clamp(interactionUvFromXZ(xz), vec2(0.0), vec2(1.0));
    return texture2D(uInteractionHeightmap, uv).x * uInteractionEnabled;
  }

  vec3 sampleInteractionNormal(vec2 xz) {
    vec2 uv = clamp(interactionUvFromXZ(xz), vec2(0.0), vec2(1.0));
    float resolution = max(uInteractionResolution, 1.0);
    vec2 texel = vec2(1.0 / resolution);
    vec2 worldTexel = max(uInteractionBounds / resolution, vec2(0.0001));
    float left = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(-texel.x, 0.0), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;
    float right = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(texel.x, 0.0), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;
    float back = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(0.0, -texel.y), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;
    float front = texture2D(
      uInteractionHeightmap,
      clamp(uv + vec2(0.0, texel.y), vec2(0.0), vec2(1.0))
    ).x * uInteractionEnabled;

    return normalize(
      vec3(
        (left - right) / (worldTexel.x * 2.0),
        1.0,
        (back - front) / (worldTexel.y * 2.0)
      )
    );
  }

  vec3 combineSurfaceNormals(vec3 baseNormal, vec3 detailNormal) {
    float safeBaseY = max(abs(baseNormal.y), 0.0001);
    float safeDetailY = max(abs(detailNormal.y), 0.0001);
    vec2 baseSlope = -baseNormal.xz / safeBaseY;
    vec2 detailSlope = -detailNormal.xz / safeDetailY;
    return normalize(
      vec3(-(baseSlope.x + detailSlope.x), 1.0, -(baseSlope.y + detailSlope.y))
    );
  }

  float sampleBaseWaveHeight(vec2 xz) {
    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    float heightDisp = 0.0;
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], xz) * freqs[i] + uTime * phase;
      heightDisp += amp * cos(theta);
    }

    return heightDisp;
  }

  // Y-only wave displacement — walls stay vertical, only top undulates
  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
    // Only vertices near the top move (sides lerp from 0 at bottom to full at top)
    float blend = smoothstep(0.5, 1.0, normY);
    float heightDisp =
      sampleBaseWaveHeight(pos.xz) + sampleInteractionHeight(pos.xz);

    // Only displace in Y — no horizontal shift keeps walls flush
    return vec3(0.0, heightDisp * blend, 0.0);
  }

  vec3 nurbsWaveNormal(vec3 pos) {
    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float Q = uWaveChoppiness / (freqs[i] * amp * 4.0);
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freqs[i] * amp;
      n.x -= dirs[i].x * WA * s;
      n.z -= dirs[i].y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`;

// ── Shader chunk replacements ───────────────────────────────────────

const VERTEX_COMMON_REPLACE = /* glsl */ `
  #include <common>
  ${WAVE_PREAMBLE}
`;

const BEGINNORMAL_REPLACE = /* glsl */ `
  // Blend wave normals in for top-facing surfaces only
  float _isTopFacing = step(0.5, normal.y);
  float _normY = clamp(
    (position.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  float _normalBlend = _isTopFacing * smoothstep(0.8, 1.0, _normY);
  vec3 _waveNorm = nurbsWaveNormal(position);
  vec3 _interactionNorm = sampleInteractionNormal(position.xz);
  vec3 _combinedWaveNorm = combineSurfaceNormals(_waveNorm, _interactionNorm);
  vec3 objectNormal = mix(vec3(normal), _combinedWaveNorm, _normalBlend);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`;

const BEGIN_VERTEX_REPLACE = /* glsl */ `
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`;

const FRAGMENT_COMMON_INJECT = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`;

const COLOR_FRAGMENT_REPLACE = /* glsl */ `
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`;

// ── Edge line helpers ────────────────────────────────────────────────

const EDGE_SEGS = 32; // subdivisions per top edge for smooth wave following

function buildEdgeGeometries(hw, hd, topY, botY) {
  // Bottom rectangle (static, closed loop)
  const bottomGeo = new LineGeometry();
  bottomGeo.setPositions([
    -hw,
    botY,
    -hd,
    hw,
    botY,
    -hd,
    hw,
    botY,
    hd,
    -hw,
    botY,
    hd,
    -hw,
    botY,
    -hd,
  ]);

  // 4 vertical corner lines (bottom → top, updated each frame at top end)
  const corners = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  const vertGeos = corners.map(([cx, cz]) => {
    const geo = new LineGeometry();
    geo.setPositions([cx, botY, cz, cx, topY, cz]);
    return { geo, cx, cz };
  });

  // 4 top edges, each subdivided so they can follow the wave contour
  const topEdges = [
    { x0: -hw, z0: -hd, x1: hw, z1: -hd }, // back
    { x0: hw, z0: -hd, x1: hw, z1: hd }, // right
    { x0: hw, z0: hd, x1: -hw, z1: hd }, // front
    { x0: -hw, z0: hd, x1: -hw, z1: -hd }, // left
  ];
  const topGeos = topEdges.map((edge) => {
    const positions = [];
    for (let i = 0; i <= EDGE_SEGS; i += 1) {
      const t = i / EDGE_SEGS;
      positions.push(
        edge.x0 + (edge.x1 - edge.x0) * t,
        topY,
        edge.z0 + (edge.z1 - edge.z0) * t
      );
    }
    const geo = new LineGeometry();
    geo.setPositions(positions);
    return { geo, edge };
  });

  return { bottomGeo, vertGeos, topGeos };
}

// ── Component ───────────────────────────────────────────────────────

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

export default function NurbsWaterColumnGL({
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
  edgeLineWidth = 1,
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

  const uniforms = useMemo(
    () => ({
      uTime: { value: timeRef.current },
      uWaveHeight: { value: waveHeight },
      uWaveChoppiness: { value: waveChoppiness },
      uWaveSpeed: { value: waveSpeed },
      uColumnTop: { value: height / 2 },
      uColumnBottom: { value: -height / 2 },
      uInteractionBounds: { value: new THREE.Vector2(width, depth) },
      uInteractionEnabled: { value: 0 },
      uInteractionHeightmap: { value: fallbackInteractionTexture },
      uInteractionResolution: { value: 1 },
      uTopColor: { value: new THREE.Color(topColor) },
      uBottomColor: { value: new THREE.Color(bottomColor) },
    }),
    [fallbackInteractionTexture, topColor, bottomColor, depth, height, width]
  );

  const geometries = useMemo(() => {
    const surfaces = buildAllSurfaces({ width, depth, height });
    return buildGeometries(surfaces, segments, height, Math.max(width, depth));
  }, [width, depth, height, segments]);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity,
      transmission,
      roughness,
      metalness: 0.0,
      ior,
      thickness,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    // eslint-disable-next-line no-param-reassign
    mat.onBeforeCompile = (s) => {
      const sh = s;
      Object.entries(uniforms).forEach(([key, u]) => {
        sh.uniforms[key] = u;
      });

      sh.vertexShader = sh.vertexShader.replace(
        '#include <common>',
        VERTEX_COMMON_REPLACE
      );
      sh.vertexShader = sh.vertexShader.replace(
        '#include <beginnormal_vertex>',
        BEGINNORMAL_REPLACE
      );
      sh.vertexShader = sh.vertexShader.replace(
        '#include <begin_vertex>',
        BEGIN_VERTEX_REPLACE
      );
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <common>',
        `#include <common>\n${FRAGMENT_COMMON_INJECT}`
      );
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <color_fragment>',
        COLOR_FRAGMENT_REPLACE
      );
    };

    return mat;
  }, [uniforms, opacity, transmission, roughness, ior, thickness]);

  const edgeData = useMemo(() => {
    if (!showEdges) return null;
    const hw = width / 2;
    const hd = depth / 2;
    return buildEdgeGeometries(hw, hd, height / 2, -height / 2);
  }, [showEdges, width, height, depth]);

  const edgeMat = useMemo(
    () =>
      new LineMaterial({
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
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

  useEffect(
    () => () => fallbackInteractionTexture.dispose(),
    [fallbackInteractionTexture]
  );

  useFrame((state, delta) => {
    timeRef.current += delta;
    const liveWaveHeight = waveHeightRef?.current ?? waveHeight;
    const liveWaveSpeed = waveSpeedRef?.current ?? waveSpeed;
    const liveWaveChoppiness = waveChoppinessRef?.current ?? waveChoppiness;
    const interactionState = interactionRuntime?.interactionStateRef.current;
    const interactionEnabled = interactionRuntime?.configRef.current.enabled;

    uniforms.uTime.value = timeRef.current;
    uniforms.uWaveHeight.value = liveWaveHeight;
    uniforms.uWaveChoppiness.value = liveWaveChoppiness;
    uniforms.uWaveSpeed.value = liveWaveSpeed;
    setWaveTime(timeRef.current);

    interactionRuntime?.advance(delta);

    uniforms.uInteractionBounds.value.set(width, depth);
    uniforms.uInteractionEnabled.value = interactionEnabled ? 1 : 0;
    uniforms.uInteractionHeightmap.value =
      interactionState?.texture ?? fallbackInteractionTexture;
    uniforms.uInteractionResolution.value = interactionState?.size ?? 1;

    // Update edge material properties imperatively to avoid re-creating it
    if (showEdges && edgeMat) {
      edgeMat.color.set(edgeColor);
      edgeMat.opacity = edgeOpacity;
      edgeMat.linewidth = edgeLineWidth;
      edgeMat.resolution.set(state.size.width, state.size.height);
    }

    // Animate top edges + vertical corner tops to follow waves
    if (edgeData) {
      const topY = height / 2;
      const botY = -height / 2;
      // Update top edge subdivisions
      edgeData.topGeos.forEach(({ geo, edge }) => {
        const positions = [];
        for (let i = 0; i <= EDGE_SEGS; i += 1) {
          const t = i / EDGE_SEGS;
          const px = edge.x0 + (edge.x1 - edge.x0) * t;
          const pz = edge.z0 + (edge.z1 - edge.z0) * t;
          const wY = sampleWaveHeight(
            px,
            pz,
            liveWaveHeight,
            liveWaveChoppiness,
            liveWaveSpeed
          );
          const interactionY = interactionEnabled
            ? sampleWaterInteractionHeight(
                px,
                pz,
                width,
                depth,
                interactionState
              )
            : 0;
          positions.push(px, topY + wY + interactionY, pz);
        }
        geo.setPositions(positions);
      });
      // Update vertical corner top-end vertex
      edgeData.vertGeos.forEach(({ geo, cx, cz }) => {
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
        geo.setPositions([cx, botY, cz, cx, topY + wY + interactionY, cz]);
      });
    }
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

      {showEdges && edgeData && (
        <>
          {/* eslint-disable react/no-unknown-property */}
          <line2 geometry={edgeData.bottomGeo} material={edgeMat} />
          {edgeData.vertGeos.map(({ geo }, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <line2 key={`v${i}`} geometry={geo} material={edgeMat} />
          ))}
          {edgeData.topGeos.map(({ geo }, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <line2 key={`t${i}`} geometry={geo} material={edgeMat} />
          ))}
          {/* eslint-enable react/no-unknown-property */}
        </>
      )}
    </group>
  );
}
