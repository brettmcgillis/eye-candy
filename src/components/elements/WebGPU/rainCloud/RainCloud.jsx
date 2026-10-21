import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import StylizedCloud2 from '@elements/StylizedCloud2/StylizedCloud2';

import {
  RAIN_CLOUD_DEFAULTS,
  RAIN_SHADOW_LAYER,
  boltPaths,
  cloudScale,
  rainFall,
  rainFootprint,
  shadowHalf,
  strikeAt,
  strikeEnvelope,
} from './rainCloudRig';
import { buildRainGeometry, createRainMaterials } from './rainMaterial';
import createRainShadow from './rainShadow';

export const RAIN_CLOUD_KEYS = Object.keys(RAIN_CLOUD_DEFAULTS);

const FLOOR_Y = -0.9;

function boltMesh(points, radius, material) {
  const path = new THREE.CurvePath();
  for (let i = 1; i < points.length; i += 1) {
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(...points[i - 1]),
        new THREE.Vector3(...points[i])
      )
    );
  }
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(path, points.length * 2, radius, 5, false),
    material
  );
  mesh.frustumCulled = false;
  return mesh;
}

// Rains onto whatever is on RAIN_SHADOW_LAYER; `follow(out)` writes the
// point it hangs over and strikes, and returns false until there is one.
const RainCloud = forwardRef(function RainCloud(
  { floorVisible = true, follow, forcedStrike = null, seed = 1, ...props },
  ref
) {
  const params = useMemo(
    () =>
      Object.fromEntries(
        RAIN_CLOUD_KEYS.map((key) => [
          key,
          props[key] ?? RAIN_CLOUD_DEFAULTS[key],
        ])
      ),
    RAIN_CLOUD_KEYS.map((key) => props[key])
  );
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const cloudRef = useRef(null);
  const puffsRef = useRef(null);
  const boltGroupRef = useRef(null);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  const timeRef = useRef(0);
  const strikeRef = useRef(null);

  const shadow = useMemo(() => createRainShadow(), []);
  useEffect(() => () => shadow.dispose(), [shadow]);

  const rain = useMemo(
    () => createRainMaterials(shadow.heights.texture),
    [shadow]
  );
  useEffect(
    () => () => {
      rain.streaks.dispose();
      rain.splashes.dispose();
    },
    [rain]
  );

  const geometry = useMemo(
    () => buildRainGeometry(params.rainCount, seed),
    [params.rainCount, seed]
  );
  useEffect(
    () => () => {
      geometry.streaks.dispose();
      geometry.splashes.dispose();
    },
    [geometry]
  );

  const cloudMaterial = useMemo(
    () => new THREE.MeshStandardNodeMaterial({ metalness: 0 }),
    []
  );
  const boltMaterials = useMemo(
    () => ({
      core: new THREE.MeshBasicNodeMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        transparent: true,
      }),
      glow: new THREE.MeshBasicNodeMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        transparent: true,
      }),
    }),
    []
  );
  useEffect(
    () => () => {
      cloudMaterial.dispose();
      boltMaterials.core.dispose();
      boltMaterials.glow.dispose();
    },
    [boltMaterials, cloudMaterial]
  );

  useEffect(() => {
    cloudMaterial.color.set(params.cloudColor);
    cloudMaterial.roughness = params.cloudRoughness;
    cloudMaterial.emissive.set(params.lightningGlowColor);
    boltMaterials.core.color.set(params.lightningColor);
    boltMaterials.glow.color.set(params.lightningGlowColor);
    const u = rain.uniforms;
    u.color.value.set(params.rainColor);
    u.opacity.value = params.rainOpacity;
    u.length.value = params.rainLength;
    u.width.value = params.rainWidth;
    u.speed.value = params.rainSpeed;
    u.splash.value = params.rainSplash;
    u.fall.value = rainFall(params);
    const { radiusX, radiusZ } = rainFootprint(params);
    u.radius.value.set(radiusX, radiusZ);
    u.floorY.value = FLOOR_Y;
    u.floorVisible.value = floorVisible ? 1 : 0;
    strikeRef.current = null;
  }, [boltMaterials, cloudMaterial, floorVisible, params, rain]);

  // Rebuilt per strike as fresh meshes: WebGPU never redraws a mesh whose
  // geometry was swapped after its first draw.
  const showStrike = (index) => {
    const group = boltGroupRef.current;
    if (!group) return;
    group.children.slice().forEach((child) => {
      group.remove(child);
      child.geometry.dispose();
    });
    if (index === null) return;
    const p = paramsRef.current;
    boltPaths(p, seed, index).forEach(({ level, points }) => {
      const radius = p.lightningWidth * (level === 0 ? 1 : 0.55);
      group.add(boltMesh(points, radius * 3.5, boltMaterials.glow));
      group.add(boltMesh(points, radius, boltMaterials.core));
    });
  };

  // After the rig (priority 0) moves what this follows, before Outline (1)
  // renders the frame.
  useFrame((state) => {
    const p = paramsRef.current;
    const time = state.clock.elapsedTime;
    timeRef.current = time;
    if (!follow?.(anchor)) return;
    base.set(anchor.x, anchor.y + p.cloudHeight, anchor.z);
    cloudRef.current?.position.copy(base);

    const strike = p.lightningVisible
      ? strikeAt(time, p, seed, forcedStrike)
      : null;
    const index = strike ? strike.index : null;
    if (index !== strikeRef.current) {
      strikeRef.current = index;
      showStrike(index);
    }
    const envelope = strike ? strikeEnvelope(strike.age) : 0;
    boltMaterials.core.opacity = envelope;
    boltMaterials.glow.opacity = envelope * 0.35;
    cloudMaterial.emissiveIntensity = envelope * p.cloudFlash;

    const u = rain.uniforms;
    u.time.value = time;
    u.base.value.copy(base);
    u.flash.value = envelope;
    if (p.rainVisible) {
      const half = shadowHalf(p);
      u.shadowCenter.value.set(base.x, base.z);
      u.shadowHalf.value = half;
      shadow.render(state.gl, state.scene, {
        centerX: base.x,
        centerZ: base.z,
        floorY: FLOOR_Y,
        half,
        topY: base.y,
      });
    }
  }, 0.5);

  useImperativeHandle(
    ref,
    () => ({
      extent: () => ({ base: { x: base.x, y: base.y, z: base.z }, params }),
      get cloud() {
        return params.cloudVisible ? puffsRef.current : null;
      },
      async snapshot(renderer) {
        return {
          base: { x: base.x, y: base.y, z: base.z },
          floorVisible,
          floorY: FLOOR_Y,
          forcedAt: forcedStrike,
          params,
          seed,
          shadow: params.rainVisible ? await shadow.read(renderer) : null,
          time: timeRef.current,
        };
      },
    }),
    [base, floorVisible, forcedStrike, params, seed, shadow]
  );

  const scale = cloudScale(params);
  return (
    <>
      <group ref={cloudRef}>
        <group ref={puffsRef}>
          {params.cloudVisible ? (
            <StylizedCloud2 material={cloudMaterial} scale={scale} />
          ) : null}
        </group>
        <group ref={boltGroupRef} />
      </group>
      {params.rainVisible ? (
        <>
          <mesh
            frustumCulled={false}
            geometry={geometry.streaks}
            material={rain.streaks}
          />
          <mesh
            frustumCulled={false}
            geometry={geometry.splashes}
            material={rain.splashes}
          />
        </>
      ) : null}
    </>
  );
});

export { RAIN_SHADOW_LAYER };
export default memo(RainCloud);
