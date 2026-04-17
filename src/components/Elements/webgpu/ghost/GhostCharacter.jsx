import * as THREE from 'three';

import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import ClothMesh from '../cloth/ClothMesh';
import { pinRing } from '../cloth/pinHelpers';

const SPHERE_BASE_Y = -0.15;
const SPHERE_RADIUS = 0.15;

const CUTOUTS = [
  { u: 0.43, v: 0.4, radius: 0.06 },
  { u: 0.57, v: 0.4, radius: 0.06 },
];

const sharedTrailTarget = new THREE.Vector3();

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
    gravity = 0.00012,
    windAmplitude = 0.0004,
    maxVelocity = 0.01,
    segmentsX = 28,
    segmentsY = 28,
    debugColliders = false,
    debugColor = '#ff4444',
    debugAnchors = false,
    debugAnchorColor = '#44ff44',
    holeAmount = 0.2,
    edgeFade = 0.15,
    tatterEdge = 0,
    alphaScale = 4,
    alphaSeed = 42,
    roughness = 0.8,
    metalness = 0,
    opacity = 1,
    paused = false,
    cutoutRimColor = '#000000',
    cutoutRimWidth = 0,
    cutoutRimOffset = 0,
  },
  ref
) {
  const clothRef = useRef();
  const groupRef = useRef();
  const lightLeftRef = useRef();
  const lightRightRef = useRef();
  const anchorDbgRefs = useRef([]);

  // Centre pins only — recomputed when segments change.
  const pins = useMemo(
    () =>
      pinRing(
        Math.round(segmentsX / 2),
        Math.round(segmentsY / 2),
        2,
        segmentsX,
        segmentsY
      ),
    [segmentsX, segmentsY]
  );

  const spherePos = useMemo(() => new THREE.Vector3(0, SPHERE_BASE_Y, 0), []);
  const handLeftPos = useMemo(
    () => new THREE.Vector3(-handSpacing, -handHeight, 0),
    [] // eslint-disable-line -- initial position only
  );
  const handRightPos = useMemo(
    () => new THREE.Vector3(handSpacing, -handHeight, 0),
    [] // eslint-disable-line -- initial position only
  );

  const colliders = useMemo(
    () => [
      { position: spherePos, radius: SPHERE_RADIUS },
      { position: handLeftPos, radius: handSize },
      { position: handRightPos, radius: handSize },
    ],
    [spherePos, handLeftPos, handRightPos, handSize]
  );

  // Dynamic anchors — vertices near each hand are pinned and move with it.
  // Slots 0-7: hands (Z/X equator poles first, Y top poles last).
  // Slots 8-9: ear rings (track head sphere).
  // Equator anchors are processed first so Y-pole overwrites overlapping
  // center vertices with the correct top-of-sphere offset.
  // worldX/Z = initial position on the cloth surface (grid lookup).
  // restX/Y/Z = anchor reference point for offset computation.
  // position = the THREE.Vector3 that gets mutated per frame.
  //
  // Ear cutout UVs → world: worldX = (u-0.5)*width, worldZ = (v-0.5)*height
  const earLeftWorldX = (CUTOUTS[0].u - 0.5) * 1.0;
  const earLeftWorldZ = (CUTOUTS[0].v - 0.5) * 1.0;
  const earRightWorldX = (CUTOUTS[1].u - 0.5) * 1.0;
  const earRightWorldZ = (CUTOUTS[1].v - 0.5) * 1.0;

  const anchors = useMemo(
    () => [
      // ── Equator anchors (Z/X poles) — processed first so Y-pole overwrites
      //    any overlapping center vertices with the correct top-of-sphere offset.

      // Slot 0: left hand — +Z-pole (front)
      {
        worldX: -handSpacing,
        worldZ: handSize,
        restX: -handSpacing,
        restY: 0,
        restZ: 0,
        gridRadius: 1,
        position: handLeftPos,
      },
      // Slot 1: left hand — -Z-pole (back)
      {
        worldX: -handSpacing,
        worldZ: -handSize,
        restX: -handSpacing,
        restY: 0,
        restZ: 0,
        gridRadius: 1,
        position: handLeftPos,
      },
      // Slot 2: right hand — +Z-pole (front)
      {
        worldX: handSpacing,
        worldZ: handSize,
        restX: handSpacing,
        restY: 0,
        restZ: 0,
        gridRadius: 1,
        position: handRightPos,
      },
      // Slot 3: right hand — -Z-pole (back)
      {
        worldX: handSpacing,
        worldZ: -handSize,
        restX: handSpacing,
        restY: 0,
        restZ: 0,
        gridRadius: 1,
        position: handRightPos,
      },
      // Slot 4: left hand — outer X-pole
      {
        worldX: -handSpacing - handSize,
        worldZ: 0,
        restX: -handSpacing,
        restY: 0,
        restZ: 0,
        gridRadius: 1,
        position: handLeftPos,
      },
      // Slot 5: right hand — outer X-pole
      {
        worldX: handSpacing + handSize,
        worldZ: 0,
        restX: handSpacing,
        restY: 0,
        restZ: 0,
        gridRadius: 1,
        position: handRightPos,
      },

      // ── Top anchors (Y-poles) — processed last, overwrite overlapping equator
      //    vertices so the center cloth still drapes over the top of the sphere.

      // Slot 6: left hand — Y-pole (top)
      {
        worldX: -handSpacing,
        worldZ: 0,
        restX: -handSpacing,
        restY: -handSize,
        restZ: 0,
        gridRadius: 2,
        position: handLeftPos,
      },
      // Slot 7: right hand — Y-pole (top)
      {
        worldX: handSpacing,
        worldZ: 0,
        restX: handSpacing,
        restY: -handSize,
        restZ: 0,
        gridRadius: 2,
        position: handRightPos,
      },
      // Slot 8: left ear — anchored to head sphere (static)
      {
        worldX: earLeftWorldX,
        worldZ: earLeftWorldZ,
        restX: 0,
        restY: SPHERE_BASE_Y,
        restZ: 0,
        gridRadius: 2,
        position: spherePos,
      },
      // Slot 9: right ear — anchored to head sphere (static)
      {
        worldX: earRightWorldX,
        worldZ: earRightWorldZ,
        restX: 0,
        restY: SPHERE_BASE_Y,
        restZ: 0,
        gridRadius: 2,
        position: spherePos,
      },
    ],
    // eslint-disable-next-line -- static anchor config, position refs are stable
    [handSpacing, handSize, handLeftPos, handRightPos, spherePos]
  );

  useImperativeHandle(
    ref,
    () => ({
      get sim() {
        return clothRef.current?.sim;
      },
      resetSim() {
        clothRef.current?.resetSim();
      },
    }),
    []
  );

  // Animation state (owned by the character)
  const animState = useRef({
    time: 0,
    prevWindDirX: 0,
    prevWindDirZ: 0,
    bankX: 0,
    bankZ: 0,
    jumpTime: -1,
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const state = animState.current;
    state.time += dt;

    // Read input from caller
    const input = animationInputRef?.current ?? {};
    const inputDirX = input.windDirX ?? 0;
    const inputDirZ = input.windDirZ ?? 0;
    const windStrength = input.windStrength ?? 0;
    const jumpTriggered = input.jumpTriggered ?? false;

    // Bob
    const bob = Math.sin(state.time * bobSpeed * Math.PI * 2) * bobAmplitude;

    // Sway
    const swayX =
      Math.sin(state.time * bobSpeed * 0.7 * Math.PI * 2) * swayAmplitude;
    const swayZ =
      Math.sin(state.time * bobSpeed * 0.5 * Math.PI * 2 + 1.3) * swayAmplitude;

    // Wind direction
    let wdx = inputDirX;
    let wdz = inputDirZ;
    if (windStrength < 0.001) {
      wdx = 1;
      wdz = 0;
    }
    const effectiveWind = baseWind + windStrength * windBoostMul;

    // Turn bank
    const dirChangeX = wdx * windStrength - state.prevWindDirX;
    const dirChangeZ = wdz * windStrength - state.prevWindDirZ;
    state.bankX += dirChangeX * 0.5;
    state.bankZ += dirChangeZ * 0.5;
    state.bankX *= Math.exp(-8 * dt);
    state.bankZ *= Math.exp(-8 * dt);
    state.prevWindDirX = wdx * windStrength;
    state.prevWindDirZ = wdz * windStrength;

    // Tilt
    const tiltInputX = inputDirX * windStrength;
    const tiltInputZ = inputDirZ * windStrength;
    const tiltX = -tiltInputZ * tiltIntensity + state.bankZ * 0.3 + swayX * 0.3;
    const tiltZ = tiltInputX * tiltIntensity + state.bankX * 0.3 + swayZ * 0.3;

    // Jump squash/stretch
    if (jumpTriggered && state.jumpTime < 0) {
      state.jumpTime = 0;
    }
    let squash = 1;
    let windDirY = 0;
    if (state.jumpTime >= 0) {
      const t = state.jumpTime;
      state.jumpTime += dt;
      if (t < 0.15) {
        squash = 1 - squashIntensity * Math.sin((t / 0.15) * Math.PI * 0.5);
        windDirY = 0.3;
      } else if (t < 0.35) {
        squash =
          1 + squashIntensity * 0.8 * Math.sin(((t - 0.15) / 0.2) * Math.PI);
        windDirY = -0.4;
      } else if (t < 0.65) {
        const p = (t - 0.35) / 0.3;
        squash = 1 + squashIntensity * 0.2 * Math.sin(p * Math.PI) * (1 - p);
        windDirY = 0.2 * (1 - p);
      } else {
        state.jumpTime = -1;
      }
    }

    // Apply transforms to own group
    const group = groupRef.current;
    if (group) {
      group.position.y = bob;
      group.rotation.x = 0.3 + tiltX;
      group.rotation.z = tiltZ;
      group.scale.set(1, squash, 1);
    }

    // Push wind to cloth sim
    const sim = clothRef.current?.sim;
    if (sim) {
      sim.windU.value = effectiveWind;
      const len = Math.sqrt(wdx * wdx + windDirY * windDirY + wdz * wdz);
      if (len > 0.0001) {
        sim.windDirU.value.set(wdx / len, windDirY / len, wdz / len);
      }
    }

    // Hand trailing — both hands trail opposite the wind direction together
    const springT = 1 - Math.exp(-handSpring * dt);
    const trailScale = effectiveWind * handTrail;
    const trailX = -wdx * trailScale;
    const trailZ = -wdz * trailScale;

    // Min/max distance from head center (XZ plane).
    // Min prevents hands entering the head; max keeps them close to body.
    const minDist = SPHERE_RADIUS + handSize;
    const maxDist = handSpacing + handSize;

    sharedTrailTarget.set(-handSpacing + trailX, -handHeight, trailZ);
    let dL = Math.sqrt(
      sharedTrailTarget.x * sharedTrailTarget.x +
        sharedTrailTarget.z * sharedTrailTarget.z
    );
    if (dL > 0.0001) {
      const clamped = Math.max(minDist, Math.min(maxDist, dL));
      if (clamped !== dL) {
        const sL = clamped / dL;
        sharedTrailTarget.x *= sL;
        sharedTrailTarget.z *= sL;
      }
    }
    handLeftPos.lerp(sharedTrailTarget, springT);

    sharedTrailTarget.set(handSpacing + trailX, -handHeight, trailZ);
    dL = Math.sqrt(
      sharedTrailTarget.x * sharedTrailTarget.x +
        sharedTrailTarget.z * sharedTrailTarget.z
    );
    if (dL > 0.0001) {
      const clamped = Math.max(minDist, Math.min(maxDist, dL));
      if (clamped !== dL) {
        const sR = clamped / dL;
        sharedTrailTarget.x *= sR;
        sharedTrailTarget.z *= sR;
      }
    }
    handRightPos.lerp(sharedTrailTarget, springT);

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
    <group ref={groupRef}>
      <ClothMesh
        key={`cloth-${segmentsX}-${segmentsY}`}
        ref={clothRef}
        width={1.0}
        height={1.0}
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
        cutouts={CUTOUTS}
        cutoutRimColor={cutoutRimColor}
        cutoutRimWidth={cutoutRimWidth}
        cutoutRimOffset={cutoutRimOffset}
        paused={paused}
        innerColor={innerColor}
        materialProps={{
          color,
          roughness,
          metalness,
          opacity,
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
              ref={(el) => { anchorDbgRefs.current[i] = el; }}
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
                        sx, sy, sz,
                        dirX * lineLen, dirY * lineLen, dirZ * lineLen,
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
            <lineBasicMaterial
              color={debugAnchorColor}
              depthTest={false}
            />
          </line>
        </group>
      )}

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
    </group>
  );
});

export default memo(GhostCharacter);
