/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import ClothMesh from '../cloth/ClothMesh';
import { pinRing } from '../cloth/pinHelpers';
import { getAnimation } from './ghostAnimations';

const SPHERE_BASE_Y = -0.15;
const SPHERE_RADIUS = 0.15;

const CUTOUTS = [
  { u: 0.43, v: 0.4, radius: 0.06 },
  { u: 0.57, v: 0.4, radius: 0.06 },
];

// Ear/crown rest positions in world (cloth XZ plane, y=0).
const EAR_LEFT_WORLD_X = (CUTOUTS[0].u - 0.5) * 1.0;
const EAR_LEFT_WORLD_Z = (CUTOUTS[0].v - 0.5) * 1.0;
const EAR_RIGHT_WORLD_X = (CUTOUTS[1].u - 0.5) * 1.0;
const EAR_RIGHT_WORLD_Z = (CUTOUTS[1].v - 0.5) * 1.0;
const CROWN_WORLD_X = 0;
const CROWN_WORLD_Z = (CUTOUTS[0].v - 0.5) * 1.0;
// World Y of the crown pin, on the head-sphere surface at (CROWN_WORLD_X, CROWN_WORLD_Z).
// Pinning here keeps the cloth flush on the sphere instead of lifting a third nub.
const CROWN_WORLD_Y =
  SPHERE_BASE_Y +
  Math.sqrt(
    Math.max(
      0,
      SPHERE_RADIUS * SPHERE_RADIUS -
        CROWN_WORLD_X * CROWN_WORLD_X -
        CROWN_WORLD_Z * CROWN_WORLD_Z
    )
  );

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
    debugColliders = false,
    debugColor = '#ff4444',
    debugAnchors = false,
    debugAnchorColor = '#44ff44',
    debugWireframe = false,
    holeAmount = 0.2,
    edgeFade = 0.15,
    tatterEdge = 0,
    smoothEdges = false,
    alphaScale = 4,
    alphaSeed = 42,
    roughness = 0.8,
    metalness = 0,
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

  // Ear anchor positions — encoded in the original "head sphere" frame so the
  // debug-viz V points back from the head, matching legacy behavior. World
  // position is `position + (worldX - restX, -restY, worldZ - restZ)`.
  // With restX/Z = 0 and restY = SPHERE_BASE_Y this reduces to
  //   world = position + (EAR_*_WORLD_X, -SPHERE_BASE_Y, EAR_*_WORLD_Z)
  // so to lift / push back / spread an ear we shift `position` accordingly.
  const earLeftPos = useMemo(
    () => new THREE.Vector3(-earSpread, SPHERE_BASE_Y + earLiftY, -earPushBack),
    [earLiftY, earPushBack, earSpread]
  );
  const earRightPos = useMemo(
    () => new THREE.Vector3(earSpread, SPHERE_BASE_Y + earLiftY, -earPushBack),
    [earLiftY, earPushBack, earSpread]
  );

  // Actual world position of each ear — used by the sphere collider AND the
  // anchor pin (slot 8/9). When the collider is on we shift the anchor back
  // off the eye cutout so the pin grabs visible cloth that can actually be
  // lifted up to the bulb position.
  const earLeftWorld = useMemo(
    () =>
      new THREE.Vector3(
        EAR_LEFT_WORLD_X - earSpread,
        earLiftY,
        EAR_LEFT_WORLD_Z - earPushBack
      ),
    [earLiftY, earPushBack, earSpread]
  );
  const earRightWorld = useMemo(
    () =>
      new THREE.Vector3(
        EAR_RIGHT_WORLD_X + earSpread,
        earLiftY,
        EAR_RIGHT_WORLD_Z - earPushBack
      ),
    [earLiftY, earPushBack, earSpread]
  );

  const emissiveCenter = useMemo(
    () => [emissiveCenterU, emissiveCenterV],
    [emissiveCenterU, emissiveCenterV]
  );

  // Point the ground spotlight straight down
  useEffect(() => {
    if (groundSpotRef.current) {
      groundSpotRef.current.target.position.set(0, -2, 0);
      groundSpotRef.current.target.updateMatrixWorld();
    }
  }, []);

  const handLeftPos = useMemo(
    () => new THREE.Vector3(-handSpacing, -handHeight, 0),
    [] // eslint-disable-line -- initial position only
  );
  const handRightPos = useMemo(
    () => new THREE.Vector3(handSpacing, -handHeight, 0),
    [] // eslint-disable-line -- initial position only
  );

  const colliders = useMemo(() => {
    const list = [
      { position: spherePos, radius: SPHERE_RADIUS },
      { position: handLeftPos, radius: handSize },
      { position: handRightPos, radius: handSize },
    ];
    if (earColliderRadius > 0) {
      // Drop the collider one radius so its top is tangent to the anchor:
      // the pin sits at the +Y pole of the sphere, sphere body fully below.
      // Cloth pinned at the pole drapes down around the sphere, wrapping it.
      const drop = new THREE.Vector3(0, -earColliderRadius, 0);
      list.push(
        {
          position: earLeftWorld.clone().add(drop),
          radius: earColliderRadius,
        },
        {
          position: earRightWorld.clone().add(drop),
          radius: earColliderRadius,
        }
      );
    }
    return list;
  }, [
    spherePos,
    handLeftPos,
    handRightPos,
    handSize,
    earLeftWorld,
    earRightWorld,
    earColliderRadius,
  ]);

  // Dynamic anchors — vertices near each hand are pinned and move with it.
  // Slots 0-7: hands (Z/X equator poles first, Y top poles last).
  // Slots 8-9: ear rings (track head sphere with optional offset).
  // Slot 10: head crown — pin between the ears so the cloth stays seated
  //          on top of the head when the ears are spread/lifted.
  // Equator anchors are processed first so Y-pole overwrites overlapping
  // center vertices with the correct top-of-sphere offset.
  // worldX/Z = initial position on the cloth surface (grid lookup).
  // restX/Y/Z = anchor reference point for offset computation.
  // position = the THREE.Vector3 that gets mutated per frame.
  //
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
      // Slot 8: left ear — head-sphere-anchored. With no ear collider, a wide
      //         gridRadius=2 disc gives the legacy ghost its broad ear nub;
      //         with a collider, the pin is shifted backward off the eye
      //         cutout so it grabs visible cloth that can be lifted.
      {
        worldX: EAR_LEFT_WORLD_X,
        worldZ: EAR_LEFT_WORLD_Z,
        restX: 0,
        restY: SPHERE_BASE_Y,
        restZ: 0,
        gridRadius: earColliderRadius > 0 ? 1 : 2,
        position: earLeftPos,
      },
      // Slot 9: right ear — same encoding as slot 8.
      {
        worldX: EAR_RIGHT_WORLD_X,
        worldZ: EAR_RIGHT_WORLD_Z,
        restX: 0,
        restY: SPHERE_BASE_Y,
        restZ: 0,
        gridRadius: earColliderRadius > 0 ? 1 : 2,
        position: earRightPos,
      },
      // Slot 10: head crown — fixed pin between the ears, sitting on the
      //          head-sphere surface (not the cloth XZ plane) so it holds the
      //          cloth flush instead of lifting a third middle nub. Tight
      //          gridRadius=1 keeps the pinned region small.
      {
        worldX: CROWN_WORLD_X,
        worldZ: CROWN_WORLD_Z,
        restX: 0,
        restY: SPHERE_BASE_Y - CROWN_WORLD_Y,
        restZ: 0,
        gridRadius: 1,
        position: spherePos,
      },
    ],
    // eslint-disable-next-line -- static anchor config, position refs are stable
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
  const animState = useRef({
    time: 0,
    prevWindDirX: 0,
    prevWindDirZ: 0,
    bankX: 0,
    bankZ: 0,
    smoothTiltX: 0,
    smoothTiltZ: 0,
    smoothWindDirX: 0,
    smoothWindDirZ: 0,
    smoothWindStrength: 0,
    jumpTime: -1,
    // Action animation layer
    animClip: null,
    animName: null,
    animElapsed: 0,
    animBlend: 0,
    animStopping: false,
    animImperative: false,
  });

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
        const clip = getAnimation(name);
        if (!clip) return;
        const s = animState.current;
        s.animClip = clip;
        s.animName = name;
        s.animElapsed = 0;
        s.animBlend = 0;
        s.animStopping = false;
        s.animImperative = true;
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
    const state = animState.current;
    state.time += dt;

    // Read input from caller
    const input = animationInputRef?.current ?? {};
    const inputDirX = input.windDirX ?? 0;
    const inputDirZ = input.windDirZ ?? 0;
    const windStrength = input.windStrength ?? 0;
    const jumpTriggered = input.jumpTriggered ?? false;

    // ── Action animation state machine ──
    // Declarative path (input.animation) — skipped when imperative is active
    if (!state.animImperative) {
      const requestedAnim = input.animation ?? null;
      if (requestedAnim && requestedAnim !== state.animName) {
        const clip = getAnimation(requestedAnim);
        if (clip) {
          state.animClip = clip;
          state.animName = requestedAnim;
          state.animElapsed = 0;
          state.animBlend = 0;
          state.animStopping = false;
        }
      } else if (!requestedAnim && state.animClip && !state.animStopping) {
        state.animStopping = true;
      }
    }

    let animOverrides = null;
    if (state.animClip) {
      state.animElapsed += dt;
      if (state.animStopping) {
        state.animBlend = Math.max(
          0,
          state.animBlend - dt / state.animClip.blendOut
        );
        if (state.animBlend <= 0) {
          state.animClip = null;
          state.animName = null;
          state.animStopping = false;
          state.animElapsed = 0;
        }
      } else {
        state.animBlend = Math.min(
          1,
          state.animBlend + dt / state.animClip.blendIn
        );
      }
      if (state.animClip) {
        animOverrides = state.animClip.sample(state.animElapsed, {
          handSpacing,
          handHeight,
        });
      }
    }

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

    // Smooth wind input — prevents binary keyboard 0→1 snap
    const windSmooth = 1 - Math.exp(-8 * dt);
    state.smoothWindDirX += (inputDirX - state.smoothWindDirX) * windSmooth;
    state.smoothWindDirZ += (inputDirZ - state.smoothWindDirZ) * windSmooth;
    state.smoothWindStrength +=
      (windStrength - state.smoothWindStrength) * windSmooth;

    const effectiveWind = baseWind + state.smoothWindStrength * windBoostMul;

    // Turn bank — overshoot on direction change, spring-back decay
    const scaledDirX = wdx * windStrength;
    const scaledDirZ = wdz * windStrength;
    const dirChangeX = scaledDirX - state.prevWindDirX;
    const dirChangeZ = scaledDirZ - state.prevWindDirZ;
    state.bankX += dirChangeX * 0.8;
    state.bankZ += dirChangeZ * 0.8;
    state.bankX *= Math.exp(-6 * dt);
    state.bankZ *= Math.exp(-6 * dt);
    state.prevWindDirX = scaledDirX;
    state.prevWindDirZ = scaledDirZ;

    // Tilt — smooth exponential interpolation toward target
    const sw = state.smoothWindStrength;
    const sdx = state.smoothWindDirX;
    const sdz = state.smoothWindDirZ;
    const tiltTargetX = -sdz * sw * tiltIntensity;
    const tiltTargetZ = sdx * sw * tiltIntensity;
    const tiltSmooth = 1 - Math.exp(-5 * dt);
    state.smoothTiltX += (tiltTargetX - state.smoothTiltX) * tiltSmooth;
    state.smoothTiltZ += (tiltTargetZ - state.smoothTiltZ) * tiltSmooth;
    const tiltX = state.smoothTiltX + state.bankZ * 0.5 + swayX * 0.3;
    const tiltZ = state.smoothTiltZ + state.bankX * 0.5 + swayZ * 0.3;

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
    // Blend with action animation target
    if (animOverrides?.leftHandTarget && state.animBlend > 0) {
      const w = state.animBlend;
      const lt = animOverrides.leftHandTarget;
      sharedTrailTarget.x = sharedTrailTarget.x * (1 - w) + lt.x * w;
      sharedTrailTarget.y = sharedTrailTarget.y * (1 - w) + lt.y * w;
      sharedTrailTarget.z = sharedTrailTarget.z * (1 - w) + lt.z * w;
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
    // Blend with action animation target
    if (animOverrides?.rightHandTarget && state.animBlend > 0) {
      const w = state.animBlend;
      const rt = animOverrides.rightHandTarget;
      sharedTrailTarget.x = sharedTrailTarget.x * (1 - w) + rt.x * w;
      sharedTrailTarget.y = sharedTrailTarget.y * (1 - w) + rt.y * w;
      sharedTrailTarget.z = sharedTrailTarget.z * (1 - w) + rt.z * w;
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
        smoothEdges={smoothEdges}
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
        materialProps={{
          color,
          roughness,
          metalness,
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
                <lineBasicMaterial color={debugAnchorColor} depthTest={false} />
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
    </group>
  );
});

export default memo(GhostCharacter);
