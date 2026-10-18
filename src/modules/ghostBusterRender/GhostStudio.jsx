import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import GhostCharacter, {
  fabricFromControls,
} from '@elements/WebGPU/ghost/GhostCharacter';
import { SPHERE_BASE_Y } from '@elements/WebGPU/ghost/ghostRig';
import { GridMaterial } from '@materials/WebGPU/gridMaterial';

import { resolveSkin } from './skins';

const DEG = Math.PI / 180;

// GhostBuster's studio, as data: the skins were tuned under these drei
// Lightformer panels (rects facing the origin, colour scaled by intensity).
const LIGHTFORMERS = [
  { intensity: 6, position: [0, 5, 0], scale: [2, 2, 1] },
  { intensity: 5, position: [-2.5, 1, 5], scale: [0.4, 5, 1] },
  { intensity: 5, position: [2.5, 1, 5], scale: [0.4, 5, 1] },
  { intensity: 3, position: [-5, 1, 0], scale: [0.3, 5, 5] },
  { intensity: 3, position: [5, 1, 0], scale: [0.3, 5, 5] },
  { intensity: 3, position: [-2.5, 1, -5], scale: [0.4, 5, 1] },
  { intensity: 3, position: [2.5, 1, -5], scale: [0.4, 5, 1] },
  { intensity: 0.8, position: [0, -3, 0], scale: [3, 3, 1] },
];

function gustNoise(t) {
  return (
    0.5 * Math.sin(t * 1.3 + 0.4) +
    0.3 * Math.sin(t * 3.7 + 2.1) +
    0.2 * Math.sin(t * 9.1 + 4.6)
  );
}

export function backdropColor(config, skin) {
  if (config.backdrop === 'transparent') return null;
  return config.backdrop === 'skin' ? skin.bgColor : config.backgroundColor;
}

function Backdrop({ color }) {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    scene.background = color ? new THREE.Color(color) : null;
    gl.setClearColor(color ?? '#000000', color ? 1 : 0);
  }, [color, gl, scene]);
  return null;
}

// drei's <Environment frames={1}> with GhostBuster's Lightformers, built
// directly: drei's bundle pulls CommonJS dependencies the headless renderer
// cannot load, and this is the whole of what the studio used from it.
function StudioEnvironment({ intensity, rotationY }) {
  const { gl, scene } = useThree();
  const studio = useMemo(() => {
    const panels = new THREE.Scene();
    const plane = new THREE.PlaneGeometry(1, 1);
    LIGHTFORMERS.forEach((panel) => {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      material.color.setScalar(panel.intensity);
      const mesh = new THREE.Mesh(plane, material);
      mesh.position.set(...panel.position);
      mesh.scale.set(...panel.scale);
      mesh.lookAt(0, 0, 0);
      panels.add(mesh);
    });
    const target = new THREE.CubeRenderTarget(256);
    target.texture.type = THREE.HalfFloatType;
    const camera = new THREE.CubeCamera(0.1, 1000, target);
    return { camera, panels, plane, target };
  }, []);

  useEffect(
    () => () => {
      studio.panels.children.forEach((mesh) => mesh.material.dispose());
      studio.plane.dispose();
      studio.target.dispose();
    },
    [studio]
  );

  useLayoutEffect(() => {
    const { autoClear } = gl;
    gl.autoClear = true;
    studio.camera.update(gl, studio.panels);
    gl.autoClear = autoClear;
    scene.environment = studio.target.texture;
    scene.environmentIntensity = intensity;
    scene.environmentRotation.set(0, rotationY, 0);
    return () => {
      scene.environment = null;
    };
  }, [gl, intensity, rotationY, scene, studio]);

  return null;
}

function OrbitLight({ skin }) {
  const ref = useRef(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * skin.orbitLightSpeed;
    const midY = (skin.orbitLightMinY + skin.orbitLightMaxY) * 0.5;
    const ampY = (skin.orbitLightMaxY - skin.orbitLightMinY) * 0.5;
    ref.current?.position.set(
      Math.cos(t) * skin.orbitLightRadius,
      midY + Math.sin(t * 0.7) * ampY,
      Math.sin(t) * skin.orbitLightRadius
    );
  });
  return (
    <pointLight
      ref={ref}
      color={skin.orbitLightColor}
      decay={2}
      intensity={skin.orbitLightIntensity}
    />
  );
}

// Every GhostCharacter prop a skin sets, the way GhostBuster passes them.
export function ghostProps(skin) {
  return {
    alphaScale: skin.alphaScale,
    alphaSeed: skin.alphaSeed,
    baseWind: skin.baseWind,
    bobAmplitude: skin.bobAmplitude,
    bobSpeed: skin.bobSpeed,
    clearcoat: skin.clearcoat,
    clearcoatRoughness: skin.clearcoatRoughness,
    clothHeight: skin.clothHeight,
    clothWidth: skin.clothWidth,
    collisionMargin: skin.collisionMargin,
    color: skin.color,
    cursorRadius: skin.cursorRadius,
    cutoutRimColor: skin.cutoutRimColor,
    cutoutRimOffset: skin.cutoutRimOffset,
    cutoutRimWidth: skin.cutoutRimWidth,
    dampening: skin.dampening,
    debugWireframe: skin.debugWireframe,
    earColliderRadius: skin.earColliderRadius,
    earLiftY: skin.earLiftY,
    earPushBack: skin.earPushBack,
    earSpread: skin.earSpread,
    edgeFade: skin.edgeFade,
    emissiveCenterU: skin.emissiveCenterU,
    emissiveCenterV: skin.emissiveCenterV,
    emissiveFalloff: skin.emissiveFalloff,
    envMapIntensity: skin.envMapIntensity,
    eyeColor: skin.eyeColor,
    eyeIntensity: skin.eyeIntensity,
    fabric: fabricFromControls(skin),
    gravity: skin.gravity,
    groundLightAngle: skin.groundLightAngle,
    groundLightColor: skin.groundLightColor,
    groundLightDistance: skin.groundLightDistance,
    groundLightIntensity: skin.groundLightIntensity,
    handHeight: skin.handHeight,
    handSize: skin.handSize,
    handSpacing: skin.handSpacing,
    handSpring: skin.handSpring,
    handTrail: skin.handTrail,
    holeAmount: skin.holeAmount,
    innerColor: skin.innerColor || null,
    innerEmissiveColor: skin.innerEmissiveColor,
    innerEmissiveIntensity: skin.innerEmissiveIntensity,
    innerMetalness: skin.innerMetalness ?? null,
    innerRoughness: skin.innerRoughness ?? null,
    innerTextureUrl: skin.innerTextureUrl || null,
    maxVelocity: skin.maxVelocity,
    metalness: skin.metalness,
    opacity: skin.opacity,
    outerEmissiveColor: skin.outerEmissiveColor,
    outerEmissiveIntensity: skin.outerEmissiveIntensity,
    outerTextureUrl: skin.outerTextureUrl || null,
    outlineColor: skin.outlineColor,
    outlineDownSampleRatio: skin.outlineDownSampleRatio,
    outlineEnabled: skin.outlineEnabled,
    outlineFade: skin.outlineFade,
    outlineGlow: skin.outlineGlow,
    outlineHalftoneScale: skin.outlineHalftoneScale,
    outlineHiddenColor: skin.outlineHiddenColor,
    outlineHiddenStrength: skin.outlineHiddenStrength,
    outlineInside: skin.outlineInside,
    outlineMode: skin.outlineMode,
    outlinePatternLacunarity: skin.outlinePatternLacunarity,
    outlinePatternOctaves: skin.outlinePatternOctaves,
    outlinePatternScale: skin.outlinePatternScale,
    outlineRingStride: skin.outlineRingStride,
    outlineStrength: skin.outlineStrength,
    outlineThickness: skin.outlineThickness,
    roughness: skin.roughness,
    segmentsX: skin.clothSegments,
    segmentsY: skin.clothSegments,
    sheen: skin.sheen,
    sheenColor: skin.sheenColor,
    sheenRoughness: skin.sheenRoughness,
    smoothEdges: skin.smoothEdges,
    smoothOutline: skin.smoothOutline,
    squashIntensity: skin.squashIntensity,
    stiffness: skin.stiffness,
    swayAmplitude: skin.swayAmplitude,
    tatterEdge: skin.tatterEdge,
    textureBlend: skin.textureBlend,
    textureProjection: skin.textureProjection,
    textureRotation: skin.textureRotation,
    textureScaleX: skin.textureScaleX,
    textureScaleY: skin.textureScaleY,
    textureSide: skin.textureSide,
    textureTile: skin.textureTile,
    tiltIntensity: skin.tiltIntensity,
    windAmplitude: skin.windAmplitude,
    windBoostMul: skin.windBoostMul,
  };
}

// The ghost on a blank backdrop under GhostBuster's studio: what
// GhostBusterCLI renders headlessly and its Live tab renders in the page.
// `config` is a generation (skin, pose, location); `ghostRef` reaches the
// GhostCharacter handle (its sim and mesh) for capture; `gustRef` ({ x, z,
// strength }, GhostBuster's WASD wind) overrides the config's wind while held.
export default function GhostStudio({
  config,
  cursorCollider = false,
  ghostRef,
  gustRef = null,
  paused = false,
}) {
  const skin = useMemo(() => resolveSkin(config.skin), [config.skin]);
  const props = useMemo(() => ghostProps(skin), [skin]);
  const inputRef = useRef({
    animation: null,
    expressionKey: 0,
    jumpTriggered: false,
    windDirX: 0,
    windDirZ: 0,
    windStrength: 0,
  });

  // Wind "from" an angle blows toward the opposite side of the ghost. It runs
  // ahead of every other frame callback: subscription order follows mount
  // order, which a suspended ghost changes, and a one-frame lag in the wind
  // reshapes the whole drape.
  useFrame((state) => {
    const heading = (config.windAngle + 180) * DEG;
    const gust = 1 + config.windGust * gustNoise(state.clock.elapsedTime);
    const input = inputRef.current;
    const held = gustRef?.current;
    if (held?.strength > 0) {
      input.windDirX = held.x;
      input.windDirZ = held.z;
      input.windStrength = held.strength;
      return;
    }
    input.windDirX = Math.sin(heading);
    input.windDirZ = Math.cos(heading);
    input.windStrength = Math.max(0, config.windStrength * gust);
  }, -1);

  return (
    <>
      <Backdrop color={backdropColor(config, skin)} />

      <StudioEnvironment
        intensity={skin.sceneEnvIntensity}
        rotationY={skin.envRotationY}
      />
      <ambientLight intensity={skin.ambientIntensity} />
      <spotLight
        angle={Math.PI * 0.3}
        decay={0}
        intensity={skin.spotIntensity}
        position={[0, skin.spotHeight, 2]}
      />
      {skin.orbitLightEnabled ? <OrbitLight skin={skin} /> : null}

      <group position-y={SPHERE_BASE_Y} rotation-x={-config.tiltBack * DEG}>
        <group position-y={-SPHERE_BASE_Y}>
          <GhostCharacter
            {...props}
            animationInputRef={inputRef}
            cursorCollider={cursorCollider}
            paused={paused}
            ref={ghostRef}
          />
        </group>
      </group>

      {config.floor ? (
        <mesh
          position={[0, -0.9, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ outlineOccluder: false }}
        >
          <planeGeometry args={[20, 20]} />
          <GridMaterial
            bgColor={new THREE.Color(skin.floorColor).toArray()}
            gridSize={skin.gridSize}
            key={`grid-${skin.gridSize}-${skin.gridLineWidth}-${skin.floorColor}-${skin.gridLineColor}`}
            lineColor={new THREE.Color(skin.gridLineColor).toArray()}
            lineWidth={skin.gridLineWidth}
            side={THREE.FrontSide}
          />
        </mesh>
      ) : null}
    </>
  );
}
