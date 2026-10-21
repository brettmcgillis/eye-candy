import React, { useCallback, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import GhostCharacter, {
  decayFromControls,
  fabricFromControls,
  ghostCrown,
} from '@elements/WebGPU/ghost/GhostCharacter';
import { SPHERE_BASE_Y } from '@elements/WebGPU/ghost/ghostRig';
import RainCloud, {
  RAIN_CLOUD_KEYS,
  RAIN_SHADOW_LAYER,
} from '@elements/WebGPU/rainCloud/RainCloud';
import { GridMaterial } from '@materials/WebGPU/gridMaterial';
import { animated, stillTime } from '@modules/ghostBuster';
import { Backdrop, StudioEnvironment } from '@modules/renderStage';

import { resolveSkin } from './skins';

const DEG = Math.PI / 180;

function gustNoise(t) {
  return (
    0.5 * Math.sin(t * 1.3 + 0.4) +
    0.3 * Math.sin(t * 3.7 + 2.1) +
    0.2 * Math.sin(t * 9.1 + 4.6)
  );
}

export const hasStorm = (skin) =>
  Boolean(skin.cloudVisible || skin.rainVisible || skin.lightningVisible);

export const stormProps = (skin) =>
  Object.fromEntries(RAIN_CLOUD_KEYS.map((key) => [key, skin[key]]));

export function backdropColor(config, skin) {
  if (config.backdrop === 'transparent') return null;
  return config.backdrop === 'skin' ? skin.bgColor : config.backgroundColor;
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
    decay: decayFromControls(skin),
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
// strength }, GhostBuster's WASD wind) overrides the config's wind while held;
// setting `jumpRef.current = true` jumps the ghost on the next frame;
// `stormRef` reaches a storm skin's RainCloud.
export default function GhostStudio({
  config,
  cursorCollider = false,
  ghostRef,
  gustRef = null,
  jumpRef = null,
  paused = false,
  stormRef = null,
}) {
  const skin = useMemo(() => resolveSkin(config.skin), [config.skin]);
  const props = useMemo(() => ghostProps(skin), [skin]);
  const storm = useMemo(
    () => (hasStorm(skin) ? stormProps(skin) : null),
    [skin]
  );
  const followGhost = useCallback(
    (out) => {
      ghostRef.current?.mesh?.layers.enable(RAIN_SHADOW_LAYER);
      return ghostCrown(ghostRef.current, out);
    },
    [ghostRef]
  );
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
    input.jumpTriggered = jumpRef?.current === true;
    input.animation =
      animated(config) && state.clock.elapsedTime >= config.settle
        ? config.animation
        : null;
    // eslint-disable-next-line no-param-reassign
    if (jumpRef) jumpRef.current = false;
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

      {storm ? (
        <RainCloud
          {...storm}
          floorVisible={config.floor}
          follow={followGhost}
          forcedStrike={config.strike ? stillTime(config) : null}
          ref={stormRef}
          seed={config.stormSeed}
        />
      ) : null}

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
