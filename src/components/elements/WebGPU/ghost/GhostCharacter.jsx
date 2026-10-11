/* eslint-disable react/no-array-index-key */
import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useLoader } from '@react-three/fiber';

import * as THREE from 'three';

import Outline from '@postprocessing/WebGPU/outline/Outline';

import ClothMesh from '../cloth/ClothMesh';
import {
  CUTOUTS,
  SPHERE_BASE_Y,
  createGhostRigState,
  earAnchorPositions,
  ghostAnchors,
  ghostColliders,
  ghostPins,
  handRest,
  headCentre,
  startGhostAnimation,
  stepGhostRig,
} from './ghostRig';

const GhostCharacter = forwardRef(function GhostCharacter(
  {
    // Animation config
    bobAmplitude = 0.03,
    bobSpeed = 0.5,
    swayAmplitude = 0.02,
    tiltIntensity = 0.3,
    baseWind = 0.3,
    windBoostMul = 2,
    squashIntensity = 0.3,
    // Animation input — caller supplies per-frame input via this ref
    animationInputRef,
    // Cloth & material
    color = '#f5f0e8',
    innerColor = null,
    // Cloth emissive glow — independent of eye/ground lights
    outerEmissiveColor = null,
    outerEmissiveIntensity = 0,
    innerEmissiveColor = null,
    innerEmissiveIntensity = 0,
    emissiveFalloff = 2.5,
    emissiveCenterU = 0.5,
    emissiveCenterV = 0.4,
    // Eye pointLights (through the cutouts)
    eyeColor = '#88ccff',
    eyeIntensity = 3,
    stiffness = 0.15,
    dampening = 0.99,
    handSize = 0.04,
    handHeight = 0.12,
    handSpacing = 0.18,
    handSpring = 8,
    handTrail = 0.15,
    cursorCollider = true,
    cursorRadius = 0.12,
    collisionMargin = 0.02,
    earLiftY = 0,
    earPushBack = 0,
    earSpread = 0,
    earColliderRadius = 0,
    gravity = 0.00012,
    windAmplitude = 0.0004,
    maxVelocity = 0.01,
    segmentsX = 28,
    segmentsY = 28,
    clothWidth = 1.0,
    clothHeight = 1.0,
    debugColliders = false,
    debugColor = '#ff4444',
    debugAnchors = false,
    debugAnchorColor = '#44ff44',
    debugWireframe = false,
    debugLights = false,
    holeAmount = 0.2,
    edgeFade = 0.15,
    tatterEdge = 0,
    smoothEdges = false,
    smoothOutline = false,
    outlineFade = 0.04,
    alphaScale = 4,
    alphaSeed = 42,
    roughness = 0.8,
    metalness = 0,
    envMapIntensity = 1,
    sheen = 0,
    sheenRoughness = 1,
    sheenColor = '#ffffff',
    clearcoat = 0,
    clearcoatRoughness = 0,
    innerRoughness = null,
    innerMetalness = null,
    textureUrl = null,
    outerTextureUrl = null,
    innerTextureUrl = null,
    preloadTextures = [],
    textureScaleX = 1,
    textureScaleY = 1,
    textureRotation = 0,
    textureBlend = 1,
    textureTile = true,
    textureProjection = 'uv',
    textureSide = 'both',
    outlineEnabled = false,
    outlineMode = 'outline',
    outlineColor = '#ffffff',
    outlineHiddenColor = '#000000',
    outlineHiddenStrength = 0,
    outlineStrength = 3,
    outlineGlow = 0.35,
    outlineThickness = 1,
    outlineInside = false,
    outlineDownSampleRatio = 1,
    outlinePatternScale = 1,
    outlinePatternOctaves = 3,
    outlinePatternLacunarity = 2,
    outlineRingStride = 15,
    outlineHalftoneScale = 14,
    opacity = 1,
    paused = false,
    cutoutRimColor = '#000000',
    cutoutRimWidth = 0,
    cutoutRimOffset = 0,
    // Ground light
    groundLightColor = '#88ccff',
    groundLightIntensity = 0,
    groundLightAngle = 0.8,
    groundLightDistance = 3,
  },
  ref
) {
  const clothRef = useRef();
  const groupRef = useRef();
  const lightLeftRef = useRef();
  const lightRightRef = useRef();
  const groundSpotRef = useRef();
  const anchorDbgRefs = useRef([]);

  // Centre pins only — recomputed when segments change.
  const pins = useMemo(
    () => ghostPins(segmentsX, segmentsY),
    [segmentsX, segmentsY]
  );

  const spherePos = useMemo(() => {
    const { x, y, z } = headCentre();
    return new THREE.Vector3(x, y, z);
  }, []);

  const earLeftPos = useMemo(() => {
    const { x, y, z } = earAnchorPositions({
      earLiftY,
      earPushBack,
      earSpread,
    }).left;
    return new THREE.Vector3(x, y, z);
  }, [earLiftY, earPushBack, earSpread]);
  const earRightPos = useMemo(() => {
    const { x, y, z } = earAnchorPositions({
      earLiftY,
      earPushBack,
      earSpread,
    }).right;
    return new THREE.Vector3(x, y, z);
  }, [earLiftY, earPushBack, earSpread]);

  const emissiveCenter = useMemo(
    () => [emissiveCenterU, emissiveCenterV],
    [emissiveCenterU, emissiveCenterV]
  );

  // Load ghost textures at the character level so ClothMesh can stay purely
  // render/sim focused and avoid touching loader state.
  const preloadTextureKey = useMemo(
    () =>
      (Array.isArray(preloadTextures) ? preloadTextures : [])
        .filter((url) => Boolean(url) && url !== 'None')
        .join('|'),
    [preloadTextures]
  );

  const textureUrls = useMemo(() => {
    const urls = new Set(
      preloadTextureKey ? preloadTextureKey.split('|').filter(Boolean) : []
    );
    if (textureUrl && textureUrl !== 'None') urls.add(textureUrl);
    if (outerTextureUrl && outerTextureUrl !== 'None') {
      urls.add(outerTextureUrl);
    }
    if (innerTextureUrl && innerTextureUrl !== 'None') {
      urls.add(innerTextureUrl);
    }
    return Array.from(urls);
  }, [preloadTextureKey, textureUrl, outerTextureUrl, innerTextureUrl]);

  const loadedTextures = useLoader(THREE.TextureLoader, textureUrls);

  const loadedTextureMap = useMemo(() => {
    const map = new Map();
    textureUrls.forEach((url, i) => {
      map.set(url, loadedTextures[i]);
    });
    return map;
  }, [textureUrls, loadedTextures]);

  const resolvedTexture = textureUrl
    ? loadedTextureMap.get(textureUrl) || null
    : null;
  const resolvedOuterTexture = outerTextureUrl
    ? loadedTextureMap.get(outerTextureUrl) || null
    : null;
  const resolvedInnerTexture = innerTextureUrl
    ? loadedTextureMap.get(innerTextureUrl) || null
    : null;

  // Point the ground spotlight straight down
  useEffect(() => {
    if (groundSpotRef.current) {
      groundSpotRef.current.target.position.set(0, -2, 0);
      groundSpotRef.current.target.updateMatrixWorld();
    }
  }, []);

  const handLeftPos = useMemo(
    () => {
      const { x, y, z } = handRest({ handHeight, handSpacing }).left;
      return new THREE.Vector3(x, y, z);
    },
    [] // eslint-disable-line -- initial position only
  );
  const handRightPos = useMemo(
    () => {
      const { x, y, z } = handRest({ handHeight, handSpacing }).right;
      return new THREE.Vector3(x, y, z);
    },
    [] // eslint-disable-line -- initial position only
  );

  const colliders = useMemo(
    () =>
      ghostColliders(
        { earColliderRadius, earLiftY, earPushBack, earSpread, handSize },
        { handLeft: handLeftPos, handRight: handRightPos, head: spherePos }
      ),
    [
      spherePos,
      handLeftPos,
      handRightPos,
      handSize,
      earLiftY,
      earPushBack,
      earSpread,
      earColliderRadius,
    ]
  );

  // Dynamic anchors — vertices near each hand are pinned and move with it.
  // worldX/Z = initial position on the cloth surface (grid lookup).
  // restX/Y/Z = anchor reference point for offset computation.
  // position = the THREE.Vector3 that gets mutated per frame.
  const anchors = useMemo(
    () =>
      ghostAnchors(
        { earColliderRadius, handSize, handSpacing },
        {
          earLeft: earLeftPos,
          earRight: earRightPos,
          handLeft: handLeftPos,
          handRight: handRightPos,
          head: spherePos,
        }
      ),
    [
      handSpacing,
      handSize,
      handLeftPos,
      handRightPos,
      earLeftPos,
      earRightPos,
      spherePos,
      earColliderRadius,
    ]
  );

  // Animation state (owned by the character)
  const animState = useRef(createGhostRigState());

  useImperativeHandle(
    ref,
    () => ({
      get sim() {
        return clothRef.current?.sim;
      },
      resetSim() {
        clothRef.current?.resetSim();
      },
      playAnimation(name) {
        startGhostAnimation(animState.current, name, true);
      },
      stopAnimation() {
        const s = animState.current;
        if (s.animClip) {
          s.animStopping = true;
          s.animImperative = false;
        }
      },
      get activeAnimation() {
        return animState.current.animName;
      },
    }),
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const frame = stepGhostRig(
      animState.current,
      dt,
      animationInputRef?.current ?? {},
      {
        baseWind,
        bobAmplitude,
        bobSpeed,
        handHeight,
        handSize,
        handSpacing,
        handSpring,
        handTrail,
        squashIntensity,
        swayAmplitude,
        tiltIntensity,
        windBoostMul,
      },
      { left: handLeftPos, right: handRightPos }
    );

    const group = groupRef.current;
    if (group) {
      group.position.y = frame.bob;
      group.rotation.x = frame.rotationX;
      group.rotation.z = frame.rotationZ;
      group.scale.set(1, frame.squash, 1);
    }

    const sim = clothRef.current?.sim;
    if (sim) {
      sim.gravityU.value = gravity * frame.gravityScale;
      sim.windU.value = frame.windStrength;
      if (frame.windDir) sim.windDirU.value.set(...frame.windDir);
    }

    // Sync debug anchor markers with live positions
    const dbgArr = anchorDbgRefs.current;
    for (let a = 0; a < dbgArr.length; a += 1) {
      const dbg = dbgArr[a];
      const anch = anchors[a];
      if (dbg && anch) {
        dbg.position.set(
          anch.position.x + (anch.worldX - anch.restX),
          anch.position.y - anch.restY,
          anch.position.z + (anch.worldZ - (anch.restZ || 0))
        );
      }
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <ClothMesh
          key={`cloth-${segmentsX}-${segmentsY}-${clothWidth}-${clothHeight}`}
          ref={clothRef}
          width={clothWidth}
          height={clothHeight}
          segmentsX={segmentsX}
          segmentsY={segmentsY}
          pins={pins}
          centered
          orientation="horizontal"
          shape="circle"
          gravity={gravity}
          windAmplitude={windAmplitude}
          stepsPerSecond={360}
          maxVelocity={maxVelocity}
          windManaged
          gravityManaged
          stiffness={stiffness}
          dampening={dampening}
          cursorCollider={cursorCollider}
          cursorRadius={cursorRadius}
          collisionMargin={collisionMargin}
          colliders={colliders}
          anchors={anchors}
          debugColliders={debugColliders}
          debugColor={debugColor}
          alphaSeed={alphaSeed}
          alphaScale={alphaScale}
          edgeFade={edgeFade}
          holeAmount={holeAmount}
          tatterEdge={tatterEdge}
          smoothEdges={smoothEdges}
          smoothOutline={smoothOutline}
          outlineFade={outlineFade}
          cutouts={CUTOUTS}
          cutoutRimColor={cutoutRimColor}
          cutoutRimWidth={cutoutRimWidth}
          cutoutRimOffset={cutoutRimOffset}
          paused={paused}
          innerColor={innerColor}
          outerEmissiveColor={outerEmissiveColor}
          outerEmissiveIntensity={outerEmissiveIntensity}
          innerEmissiveColor={innerEmissiveColor}
          innerEmissiveIntensity={innerEmissiveIntensity}
          emissiveFalloff={emissiveFalloff}
          emissiveCenter={emissiveCenter}
          innerRoughness={innerRoughness}
          innerMetalness={innerMetalness}
          textureUrl={textureUrl}
          texture={resolvedTexture}
          outerTextureUrl={outerTextureUrl}
          outerTexture={resolvedOuterTexture}
          innerTextureUrl={innerTextureUrl}
          innerTexture={resolvedInnerTexture}
          textureScaleX={textureScaleX}
          textureScaleY={textureScaleY}
          textureRotation={textureRotation}
          textureBlend={textureBlend}
          textureTile={textureTile}
          textureProjection={textureProjection}
          textureSide={textureSide}
          materialProps={{
            color,
            roughness,
            metalness,
            envMapIntensity,
            sheen,
            sheenRoughness,
            sheenColor,
            clearcoat,
            clearcoatRoughness,
            opacity,
            wireframe: debugWireframe,
          }}
        />

        {debugAnchors &&
          anchors.map((anch, i) => {
            const dx = anch.worldX - anch.restX;
            const dz = anch.worldZ - (anch.restZ || 0);
            let dirX;
            let dirY;
            let dirZ;
            if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001) {
              dirX = 0;
              dirY = 1;
              dirZ = 0;
            } else {
              const len = Math.sqrt(dx * dx + dz * dz);
              dirX = dx / len;
              dirY = 0;
              dirZ = dz / len;
            }
            const lineLen = 0.12;
            const startOffset = 0.02;
            const sx = dirX * startOffset;
            const sy = dirY * startOffset;
            const sz = dirZ * startOffset;
            // eslint-disable-next-line react/no-array-index-key
            return (
              <group
                key={`anchor-dbg-${i}`}
                ref={(el) => {
                  anchorDbgRefs.current[i] = el;
                }}
                position={[
                  anch.position.x + dx,
                  anch.position.y - anch.restY,
                  anch.position.z + dz,
                ]}
              >
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      array={
                        new Float32Array([
                          sx,
                          sy,
                          sz,
                          dirX * lineLen,
                          dirY * lineLen,
                          dirZ * lineLen,
                        ])
                      }
                      count={2}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={debugAnchorColor}
                    depthTest={false}
                  />
                </line>
              </group>
            );
          })}

        {/* Head center pin marker */}
        {debugAnchors && (
          <group position={[0, 0, 0]}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([0, 0, 0, 0, 0.12, 0])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={debugAnchorColor} depthTest={false} />
            </line>
          </group>
        )}

        {/* Inner eye lights — illuminate back face through cutout holes */}
        <pointLight
          ref={lightLeftRef}
          position={[-0.05, SPHERE_BASE_Y, 0]}
          color={eyeColor}
          intensity={eyeIntensity * 0.3}
          distance={0.5}
          decay={2}
        />
        <pointLight
          ref={lightRightRef}
          position={[0.05, SPHERE_BASE_Y, 0]}
          color={eyeColor}
          intensity={eyeIntensity * 0.3}
          distance={0.5}
          decay={2}
        />
        {/* Downward spotlight — independently colored ground glow */}
        <spotLight
          ref={groundSpotRef}
          position={[0, SPHERE_BASE_Y, 0]}
          color={groundLightColor}
          intensity={groundLightIntensity}
          distance={groundLightDistance}
          angle={groundLightAngle}
          penumbra={1}
          decay={2}
        />

        {debugLights && (
          <>
            <mesh position={[-0.05, SPHERE_BASE_Y, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color={eyeColor} depthTest={false} />
            </mesh>
            <mesh position={[0.05, SPHERE_BASE_Y, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color={eyeColor} depthTest={false} />
            </mesh>
            <mesh position={[0, SPHERE_BASE_Y, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial
                color={groundLightColor}
                depthTest={false}
                wireframe
              />
            </mesh>
          </>
        )}
      </group>
      <Outline
        enabled={outlineEnabled}
        targetRef={clothRef}
        mode={outlineMode}
        color={outlineColor}
        hiddenColor={outlineHiddenColor}
        hiddenStrength={outlineHiddenStrength}
        strength={outlineStrength}
        glow={outlineGlow}
        thickness={outlineThickness}
        inside={outlineInside}
        downSampleRatio={outlineDownSampleRatio}
        patternScale={outlinePatternScale}
        patternOctaves={outlinePatternOctaves}
        patternLacunarity={outlinePatternLacunarity}
        ringStride={outlineRingStride}
        halftoneScale={outlineHalftoneScale}
      />
    </>
  );
});

export default memo(GhostCharacter);
