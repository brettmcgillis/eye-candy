import { pinRing } from '../cloth/pinHelpers';
import { getAnimation } from './ghostAnimations';

// The ghost's rig as plain data and maths: GhostCharacter drives it every
// frame, and PrintShop settles it headlessly through the CPU cloth mirror.
// Positions are anything with x/y/z, so a THREE.Vector3 works and stays live.

export const SPHERE_BASE_Y = -0.15;
export const SPHERE_RADIUS = 0.15;

export const CUTOUTS = [
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

const point = (x, y, z) => ({ x, y, z });

export const ghostPins = (segmentsX, segmentsY) =>
  pinRing(
    Math.round(segmentsX / 2),
    Math.round(segmentsY / 2),
    2,
    segmentsX,
    segmentsY
  );

export const headCentre = () => point(0, SPHERE_BASE_Y, 0);

export const handRest = ({ handSpacing, handHeight }) => ({
  left: point(-handSpacing, -handHeight, 0),
  right: point(handSpacing, -handHeight, 0),
});

// Ear anchors are encoded in the head-sphere frame: world position is
// `position + (worldX - restX, -restY, worldZ - restZ)`, so lifting, pushing
// back or spreading an ear shifts `position`.
export const earAnchorPositions = ({ earLiftY, earPushBack, earSpread }) => ({
  left: point(-earSpread, SPHERE_BASE_Y + earLiftY, -earPushBack),
  right: point(earSpread, SPHERE_BASE_Y + earLiftY, -earPushBack),
});

const earWorld = ({ earLiftY, earPushBack, earSpread }) => ({
  left: point(
    EAR_LEFT_WORLD_X - earSpread,
    earLiftY,
    EAR_LEFT_WORLD_Z - earPushBack
  ),
  right: point(
    EAR_RIGHT_WORLD_X + earSpread,
    earLiftY,
    EAR_RIGHT_WORLD_Z - earPushBack
  ),
});

export function ghostColliders(params, { handLeft, handRight, head }) {
  const { earColliderRadius, handSize } = params;
  const list = [
    { position: head, radius: SPHERE_RADIUS },
    { position: handLeft, radius: handSize },
    { position: handRight, radius: handSize },
  ];
  if (earColliderRadius > 0) {
    // Dropped one radius so the anchor sits at the collider's +Y pole and the
    // cloth pinned there drapes around it.
    const ears = earWorld(params);
    [ears.left, ears.right].forEach((ear) => {
      list.push({
        position: point(ear.x, ear.y - earColliderRadius, ear.z),
        radius: earColliderRadius,
      });
    });
  }
  return list;
}

// Slots 0-7: hands (Z/X equator poles first, Y top poles last so they
// overwrite overlapping centre vertices). Slots 8-9: ears. Slot 10: crown.
export function ghostAnchors(
  { earColliderRadius, handSize, handSpacing },
  { earLeft, earRight, handLeft, handRight, head }
) {
  const hand = (sign, position) =>
    [
      { dx: 0, dz: handSize },
      { dx: 0, dz: -handSize },
    ].map(({ dx, dz }) => ({
      worldX: sign * handSpacing + dx,
      worldZ: dz,
      restX: sign * handSpacing,
      restY: 0,
      restZ: 0,
      gridRadius: 1,
      position,
    }));
  const pole = (sign, position) => ({
    worldX: sign * (handSpacing + handSize),
    worldZ: 0,
    restX: sign * handSpacing,
    restY: 0,
    restZ: 0,
    gridRadius: 1,
    position,
  });
  const top = (sign, position) => ({
    worldX: sign * handSpacing,
    worldZ: 0,
    restX: sign * handSpacing,
    restY: -handSize,
    restZ: 0,
    gridRadius: 2,
    position,
  });
  const ear = (worldX, worldZ, position) => ({
    worldX,
    worldZ,
    restX: 0,
    restY: SPHERE_BASE_Y,
    restZ: 0,
    gridRadius: earColliderRadius > 0 ? 1 : 2,
    position,
  });
  return [
    ...hand(-1, handLeft),
    ...hand(1, handRight),
    pole(-1, handLeft),
    pole(1, handRight),
    top(-1, handLeft),
    top(1, handRight),
    ear(EAR_LEFT_WORLD_X, EAR_LEFT_WORLD_Z, earLeft),
    ear(EAR_RIGHT_WORLD_X, EAR_RIGHT_WORLD_Z, earRight),
    {
      worldX: CROWN_WORLD_X,
      worldZ: CROWN_WORLD_Z,
      restX: 0,
      restY: SPHERE_BASE_Y - CROWN_WORLD_Y,
      restZ: 0,
      gridRadius: 1,
      position: head,
    },
  ];
}

export function createGhostRigState() {
  return {
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
    animClip: null,
    animName: null,
    animElapsed: 0,
    animBlend: 0,
    animStopping: false,
    animImperative: false,
  };
}

export function startGhostAnimation(state, name, imperative) {
  const clip = getAnimation(name);
  if (!clip) return;
  Object.assign(state, {
    animClip: clip,
    animName: name,
    animElapsed: 0,
    animBlend: 0,
    animStopping: false,
    animImperative: imperative,
  });
}

const trailTarget = point(0, 0, 0);

function trailHand(hand, x, z, override, blend, springT, params) {
  const { handHeight, handSize, handSpacing } = params;
  // Min keeps hands out of the head; max keeps them close to the body.
  const minDist = SPHERE_RADIUS + handSize;
  const maxDist = handSpacing + handSize;
  trailTarget.x = x;
  trailTarget.y = -handHeight;
  trailTarget.z = z;
  const d = Math.sqrt(
    trailTarget.x * trailTarget.x + trailTarget.z * trailTarget.z
  );
  if (d > 0.0001) {
    const clamped = Math.max(minDist, Math.min(maxDist, d));
    if (clamped !== d) {
      const s = clamped / d;
      trailTarget.x *= s;
      trailTarget.z *= s;
    }
  }
  if (override && blend > 0) {
    trailTarget.x = trailTarget.x * (1 - blend) + override.x * blend;
    trailTarget.y = trailTarget.y * (1 - blend) + override.y * blend;
    trailTarget.z = trailTarget.z * (1 - blend) + override.z * blend;
  }
  // eslint-disable-next-line no-param-reassign
  hand.x += (trailTarget.x - hand.x) * springT;
  // eslint-disable-next-line no-param-reassign
  hand.y += (trailTarget.y - hand.y) * springT;
  // eslint-disable-next-line no-param-reassign
  hand.z += (trailTarget.z - hand.z) * springT;
}

// One frame of GhostCharacter's motion: advances `state`, eases the hands
// toward their trail targets, and returns the group transform plus what the
// cloth sim needs (gravity scale, wind strength and direction).
export function stepGhostRig(state, dt, input, params, hands) {
  const {
    baseWind,
    bobAmplitude,
    bobSpeed,
    handHeight,
    handSpacing,
    handSpring,
    handTrail,
    squashIntensity,
    swayAmplitude,
    tiltIntensity,
    windBoostMul,
  } = params;
  const s = state;
  s.time += dt;

  const inputDirX = input.windDirX ?? 0;
  const inputDirZ = input.windDirZ ?? 0;
  const windStrength = input.windStrength ?? 0;
  const jumpTriggered = input.jumpTriggered ?? false;

  // Declarative path (input.animation) — skipped when imperative is active
  if (!s.animImperative) {
    const requestedAnim = input.animation ?? null;
    if (requestedAnim && requestedAnim !== s.animName) {
      if (getAnimation(requestedAnim)) {
        startGhostAnimation(s, requestedAnim, false);
      }
    } else if (!requestedAnim && s.animClip && !s.animStopping) {
      s.animStopping = true;
    }
  }

  let animOverrides = null;
  if (s.animClip) {
    s.animElapsed += dt;
    if (s.animStopping) {
      s.animBlend = Math.max(0, s.animBlend - dt / s.animClip.blendOut);
      if (s.animBlend <= 0) {
        s.animClip = null;
        s.animName = null;
        s.animStopping = false;
        s.animElapsed = 0;
      }
    } else {
      s.animBlend = Math.min(1, s.animBlend + dt / s.animClip.blendIn);
    }
    if (s.animClip) {
      animOverrides = s.animClip.sample(s.animElapsed, {
        handSpacing,
        handHeight,
      });
    }
  }

  const bob = Math.sin(s.time * bobSpeed * Math.PI * 2) * bobAmplitude;
  const swayX = Math.sin(s.time * bobSpeed * 0.7 * Math.PI * 2) * swayAmplitude;
  const swayZ =
    Math.sin(s.time * bobSpeed * 0.5 * Math.PI * 2 + 1.3) * swayAmplitude;

  let wdx = inputDirX;
  let wdz = inputDirZ;
  if (windStrength < 0.001) {
    wdx = 1;
    wdz = 0;
  }

  // Smooth wind input — prevents binary keyboard 0→1 snap
  const windSmooth = 1 - Math.exp(-8 * dt);
  s.smoothWindDirX += (inputDirX - s.smoothWindDirX) * windSmooth;
  s.smoothWindDirZ += (inputDirZ - s.smoothWindDirZ) * windSmooth;
  s.smoothWindStrength += (windStrength - s.smoothWindStrength) * windSmooth;

  const effectiveWind = baseWind + s.smoothWindStrength * windBoostMul;

  // Turn bank — overshoot on direction change, spring-back decay
  const scaledDirX = wdx * windStrength;
  const scaledDirZ = wdz * windStrength;
  s.bankX += (scaledDirX - s.prevWindDirX) * 0.8;
  s.bankZ += (scaledDirZ - s.prevWindDirZ) * 0.8;
  s.bankX *= Math.exp(-6 * dt);
  s.bankZ *= Math.exp(-6 * dt);
  s.prevWindDirX = scaledDirX;
  s.prevWindDirZ = scaledDirZ;

  const sw = s.smoothWindStrength;
  const tiltTargetX = -s.smoothWindDirZ * sw * tiltIntensity;
  const tiltTargetZ = s.smoothWindDirX * sw * tiltIntensity;
  const tiltSmooth = 1 - Math.exp(-5 * dt);
  s.smoothTiltX += (tiltTargetX - s.smoothTiltX) * tiltSmooth;
  s.smoothTiltZ += (tiltTargetZ - s.smoothTiltZ) * tiltSmooth;
  const tiltX = s.smoothTiltX + s.bankZ * 0.5 + swayX * 0.3;
  const tiltZ = s.smoothTiltZ + s.bankX * 0.5 + swayZ * 0.3;

  // Jump squash/stretch + gravity modulation
  if (jumpTriggered && s.jumpTime < 0) s.jumpTime = 0;
  let squash = 1;
  let gravityScale = 1;
  if (s.jumpTime >= 0) {
    const t = s.jumpTime;
    s.jumpTime += dt;
    if (t < 0.15) {
      // Squash/crouch: cloth drags down as body compresses
      const p = t / 0.15;
      squash = 1 - squashIntensity * Math.sin(p * Math.PI * 0.5);
      gravityScale = 1 + p * 0.5;
    } else if (t < 0.35) {
      // Stretch/ascent: gravity eases 1.5× → 0, cloth trails then floats
      const p = (t - 0.15) / 0.2;
      squash = 1 + squashIntensity * 0.8 * Math.sin(p * Math.PI);
      gravityScale = 1.5 * (1 - p);
    } else if (t < 0.65) {
      // Descent/settle: gravity dips slightly negative then eases back to 1×
      const p = (t - 0.35) / 0.3;
      squash = 1 + squashIntensity * 0.2 * Math.sin(p * Math.PI) * (1 - p);
      gravityScale = -0.8 * Math.sin(p * Math.PI) + p;
    } else {
      s.jumpTime = -1;
    }
  }

  // Both hands trail opposite the wind direction together
  const springT = 1 - Math.exp(-handSpring * dt);
  const trailScale = effectiveWind * handTrail;
  const trailX = -wdx * trailScale;
  const trailZ = -wdz * trailScale;
  trailHand(
    hands.left,
    -handSpacing + trailX,
    trailZ,
    animOverrides?.leftHandTarget,
    s.animBlend,
    springT,
    params
  );
  trailHand(
    hands.right,
    handSpacing + trailX,
    trailZ,
    animOverrides?.rightHandTarget,
    s.animBlend,
    springT,
    params
  );

  const len = Math.sqrt(wdx * wdx + wdz * wdz);
  return {
    bob,
    gravityScale,
    rotationX: 0.3 + tiltX,
    rotationZ: tiltZ,
    squash,
    windDir: len > 0.0001 ? [wdx / len, 0, wdz / len] : null,
    windStrength: effectiveWind,
  };
}
