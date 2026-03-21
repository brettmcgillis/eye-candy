import { button, useControls } from 'leva';
import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Html, PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRapier,
} from '@react-three/rapier';

import Bret from '../../../../elements/bret/Bret';
import Reversal from '../../../../elements/reversal/Reversal';
import { GridMaterial } from '../../../../materials/gridMaterial';

const ROOM_SIZE = 2.2;
const WALL_THICKNESS = 0.08;
const BALL_RADIUS = 0.16;
const G = 9.81;
const ROOM_POSITION = [0, 0, -1];

function isSecureContextAvailable() {
  if (typeof window === 'undefined') return false;
  // localhost is treated as “potentially trustworthy” by browsers.
  if (window.location.hostname === 'localhost') return true;
  return window.isSecureContext;
}

function needsIOSMotionPermission() {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function'
  );
}

function supportsMotionSensors() {
  if (typeof window === 'undefined') return false;
  return (
    typeof window.DeviceMotionEvent !== 'undefined' ||
    typeof window.DeviceOrientationEvent !== 'undefined'
  );
}

function prefersPointerControls() {
  if (typeof window === 'undefined') return false;
  const hasFinePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(any-pointer: fine)').matches;
  const hasTouch = (navigator?.maxTouchPoints ?? 0) > 0;
  return hasFinePointer && !hasTouch;
}

function getScreenAngleRad() {
  if (typeof window === 'undefined') return 0;

  const orientationType = window.screen?.orientation?.type;
  if (typeof orientationType === 'string') {
    // Normalize to a portrait-based basis so iPad + iPhone map consistently.
    if (orientationType === 'portrait-primary') return 0;
    if (orientationType === 'portrait-secondary') return Math.PI;
    if (orientationType === 'landscape-primary') return -Math.PI / 2;
    if (orientationType === 'landscape-secondary') return Math.PI / 2;
  }

  let angle = 0;
  if (
    window.screen?.orientation &&
    typeof window.screen.orientation.angle === 'number'
  ) {
    angle = window.screen.orientation.angle;
  } else if (typeof window.orientation === 'number') {
    angle = window.orientation;
  }
  return THREE.MathUtils.degToRad(angle);
}

function MotionPermissionOverlay({ onEnable, onDecline, showDecline = false }) {
  return (
    <Html center style={{ pointerEvents: 'auto' }}>
      <div
        style={{
          width: 280,
          padding: 14,
          borderRadius: 10,
          background: 'rgba(0,0,0,0.78)',
          color: 'white',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          lineHeight: 1.2,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Motion controls available
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 12 }}>
          Enable tilt controls, or continue with click-to-set gravity. You can
          always use click controls if you prefer.
        </div>
        <button
          type="button"
          onClick={onEnable}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.10)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Enable tilt controls
        </button>
        {showDecline && (
          <button
            type="button"
            onClick={onDecline}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.04)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Use click controls
          </button>
        )}
      </div>
    </Html>
  );
}

function PointerHelpOverlay({ onDismiss }) {
  return (
    <Html center style={{ pointerEvents: 'auto' }}>
      <div
        style={{
          width: 280,
          padding: 14,
          borderRadius: 10,
          background: 'rgba(0,0,0,0.72)',
          color: 'white',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          lineHeight: 1.2,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Desktop controls</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          Click anywhere to set gravity direction.
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          OK
        </button>
      </div>
    </Html>
  );
}

function RoomVisual({
  dimensions = [ROOM_SIZE, ROOM_SIZE, ROOM_SIZE],
  position = ROOM_POSITION,
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={dimensions} />
        <GridMaterial side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function RoomBounds({
  dimensions = [ROOM_SIZE, ROOM_SIZE, ROOM_SIZE],
  thickness = WALL_THICKNESS,
  position = ROOM_POSITION,
}) {
  const [width, height, depth] = dimensions;
  const hx = width / 2;
  const hy = height / 2;
  const hz = depth / 2;
  const t = thickness;

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* Push collider centers outward so their *inner* faces align with the visual cube. */}
      <CuboidCollider args={[hx, t, hz]} position={[0, -(hy + t), 0]} />
      <CuboidCollider args={[hx, t, hz]} position={[0, hy + t, 0]} />
      <CuboidCollider args={[t, hy, hz]} position={[-(hx + t), 0, 0]} />
      <CuboidCollider args={[t, hy, hz]} position={[hx + t, 0, 0]} />
      <CuboidCollider args={[hx, hy, t]} position={[0, 0, -(hz + t)]} />
      <CuboidCollider args={[hx, hy, t]} position={[0, 0, hz + t]} />
    </RigidBody>
  );
}

function PhysicalReversal({ position }) {
  return (
    <RigidBody
      colliders="hull"
      scale={[0.8, 0.8, 0.8]}
      position={position}
      restitution={0.25}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      canSleep={false}
      ccd
    >
      <Reversal />
    </RigidBody>
  );
}

function PhysicalBret({ position }) {
  return (
    <RigidBody
      colliders="hull"
      position={position}
      restitution={0.25}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      scale={[0.5, 0.5, 0.5]}
      canSleep={false}
      ccd
    >
      <Bret />
    </RigidBody>
  );
}

function Ball({ position, color = '#FFFFFF' }) {
  return (
    <RigidBody
      colliders="ball"
      position={position}
      restitution={0.25}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      canSleep={false}
      ccd
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function GlassBallPair({ position, radius = 0.45 }) {
  return (
    <RigidBody
      colliders={false}
      position={position}
      restitution={0.25}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      canSleep={false}
      ccd
    >
      <BallCollider args={[radius]} />
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          transmission={0.95}
          roughness={0.05}
          metalness={0}
          thickness={0.3}
          ior={1.3}
        />
      </mesh>

      <group>
        <group scale={[0.2, 0.2, 0.2]} position={[-0.14, 0.06, 0]}>
          <Bret />
        </group>
        <group scale={[0.3, 0.3, 0.3]} position={[0.14, -0.04, 0]}>
          <Reversal />
        </group>
      </group>
    </RigidBody>
  );
}

function GlassBallBret({ position, radius = 0.4 }) {
  return (
    <RigidBody
      colliders={false}
      position={position}
      restitution={0.25}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      canSleep={false}
      ccd
    >
      <BallCollider args={[radius]} />
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          transmission={0.95}
          roughness={0.05}
          metalness={0}
          thickness={0.3}
          ior={1.3}
        />
      </mesh>

      <group scale={[0.22, 0.22, 0.22]} position={[0, 0, 0]}>
        <Bret />
      </group>
    </RigidBody>
  );
}

function GlassBallReversal({ position, radius = 0.4 }) {
  return (
    <RigidBody
      colliders={false}
      position={position}
      restitution={0.25}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      canSleep={false}
      ccd
    >
      <BallCollider args={[radius]} />
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          transmission={0.95}
          roughness={0.05}
          metalness={0}
          thickness={0.3}
          ior={1.3}
        />
      </mesh>

      <group scale={[0.3, 0.3, 0.3]} position={[0, 0, 0]}>
        <Reversal />
      </group>
    </RigidBody>
  );
}

function DeviceGravity({
  enabled,
  gravityOutRef,
  cameraRef,
  calibrateRequestRef,
  calibrationResetRequestRef,
}) {
  const { world } = useRapier();
  const calibrateRequest = calibrateRequestRef;
  const calibrationResetRequest = calibrationResetRequestRef;

  const rawDeviceAccelG = useRef(new THREE.Vector3(0, -G, 0));
  const lastMotionAtMs = useRef(0);
  const lastOrientationAtMs = useRef(0);
  const orientationRef = useRef({ beta: 0, gamma: 0 });
  const smoothedWorldG = useRef(new THREE.Vector3(0, -G, 0));
  const appliedWorldG = useRef(new THREE.Vector3(0, -G, 0));
  const calibrationQuatRef = useRef(new THREE.Quaternion());

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const calibFrom = useMemo(() => new THREE.Vector3(), []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);

  useEffect(() => {
    if (!enabled) return undefined;

    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const x = typeof a.x === 'number' ? a.x : 0;
      const y = typeof a.y === 'number' ? a.y : 0;
      const z = typeof a.z === 'number' ? a.z : 0;
      rawDeviceAccelG.current.set(x, y, z);
      lastMotionAtMs.current =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
    };

    const onOrientation = (e) => {
      const beta = typeof e.beta === 'number' ? e.beta : 0; // front/back tilt
      const gamma = typeof e.gamma === 'number' ? e.gamma : 0; // left/right tilt
      orientationRef.current = { beta, gamma };
      lastOrientationAtMs.current =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
    };

    window.addEventListener('devicemotion', onMotion, { passive: true });
    window.addEventListener('deviceorientation', onOrientation, {
      passive: true,
    });
    return () => {
      window.removeEventListener('devicemotion', onMotion);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [enabled]);

  useFrame((state, dt) => {
    if (!enabled) return;

    // Convert “acceleration including gravity” into a gravity vector (world space).
    // Most devices report accelIncludingGravity ≈ (-gravity) when stationary.
    const angleRad = getScreenAngleRad();
    const nowMs =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const motionFresh = nowMs - lastMotionAtMs.current < 750;
    const orientationFresh = nowMs - lastOrientationAtMs.current < 750;

    if (!motionFresh && orientationFresh) {
      // Fallback: approximate a gravity vector from DeviceOrientation angles.
      // This won’t be perfect across all devices, but gives usable “tilt board” behavior.
      const { beta, gamma } = orientationRef.current;
      const betaRad = THREE.MathUtils.degToRad(beta);
      const gammaRad = THREE.MathUtils.degToRad(gamma);

      const gx = Math.sin(gammaRad) * G;
      const gy = -Math.sin(betaRad) * G;
      const gz = -Math.sqrt(Math.max(G * G - gx * gx - gy * gy, 0));

      // rawDeviceAccelG stores “accelIncludingGravity”, which is typically ≈ (-gravity).
      rawDeviceAccelG.current.set(-gx, -gy, -gz);
    }

    const targetWorldG = tmp
      .copy(rawDeviceAccelG.current)
      .multiplyScalar(-1)
      // rotate device axes into the current screen orientation
      .applyAxisAngle(zAxis, -angleRad);

    // Keep magnitude sane (also prevents NaNs from tearing things up).
    if (!Number.isFinite(targetWorldG.x)) return;
    targetWorldG.clampLength(0, 3 * G);

    if (calibrationResetRequest?.current) {
      calibrationQuatRef.current.identity();
      calibrationResetRequest.current = false;
    }

    // Smooth a bit to reduce jitter.
    const lerpT = 1 - 0.001 ** dt; // ~consistent across fps
    smoothedWorldG.current.lerp(targetWorldG, lerpT * 0.22);

    // Write to rapier world.
    // Invert: current sensor basis feels flipped for this scene.
    appliedWorldG.current.copy(smoothedWorldG.current).multiplyScalar(-1);

    if (
      calibrateRequest?.current &&
      appliedWorldG.current.lengthSq() > 0.0001
    ) {
      calibFrom.copy(appliedWorldG.current).normalize();
      calibrationQuatRef.current.setFromUnitVectors(calibFrom, down);
      calibrateRequest.current = false;
    }

    appliedWorldG.current.applyQuaternion(calibrationQuatRef.current);
    const g = appliedWorldG.current;
    world.gravity = { x: g.x, y: g.y, z: g.z };

    if (gravityOutRef) gravityOutRef.current.copy(g);
    // Ensure any previous custom projection is reset to standard perspective.
    const cam = cameraRef?.current ?? state.camera;
    if (cam?.isPerspectiveCamera) cam.updateProjectionMatrix();
  });

  return null;
}

function PointerGravity({ enabled, gravityOutRef }) {
  const { world } = useRapier();
  const targetGravity = useRef(new THREE.Vector3(0, -G, 0));
  const appliedGravity = useRef(new THREE.Vector3(0, -G, 0));
  const centerDeadzone = 0.03;
  const centerResponseGamma = 0.65;

  const setFromPointer = useCallback(
    (ndcX, ndcY) => {
      const shapeAxis = (rawValue) => {
        const clamped = THREE.MathUtils.clamp(rawValue, -1, 1);
        const sign = Math.sign(clamped);
        const magnitude = Math.abs(clamped);
        if (magnitude <= centerDeadzone) return 0;

        const normalized = (magnitude - centerDeadzone) / (1 - centerDeadzone);
        return sign * normalized ** centerResponseGamma;
      };

      const gx = shapeAxis(ndcX) * G * 1.6;
      const gy = shapeAxis(ndcY) * G * 1.6;
      targetGravity.current.set(gx, gy, 0).clampLength(0, 3 * G);
    },
    [centerDeadzone, centerResponseGamma]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const onPointerDown = (event) => {
      if (typeof window === 'undefined') return;
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;

      const ndcX = (event.clientX / innerWidth) * 2 - 1;
      const ndcY = -((event.clientY / innerHeight) * 2 - 1);
      setFromPointer(ndcX, ndcY);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [enabled, setFromPointer]);

  useFrame((_, dt) => {
    if (!enabled) return;

    const lerpT = 1 - 0.001 ** dt;
    appliedGravity.current.lerp(targetGravity.current, lerpT * 0.28);
    const g = appliedGravity.current;
    world.gravity = { x: g.x, y: g.y, z: g.z };
    if (gravityOutRef) gravityOutRef.current.copy(g);
  });

  return null;
}

export default function MobilePhysicsTest() {
  const size = useThree((state) => state.size);
  const calibrateRequestRef = useRef(false);
  const calibrationResetRequestRef = useRef(false);
  const motionSupported = useMemo(() => supportsMotionSensors(), []);
  const pointerPreferred = useMemo(() => prefersPointerControls(), []);
  const [pointerHelpDismissed, setPointerHelpDismissed] = useState(false);
  const { debug } = useControls(
    'Mobile Physics Test',
    {
      debug: {
        label: 'Debug',
        value: false,
      },
      calibrate: button(() => {
        calibrateRequestRef.current = true;
      }),
      resetCalibration: button(() => {
        calibrationResetRequestRef.current = true;
      }),
    },
    { collapsed: true }
  );
  const cameraRef = useRef();
  const gravityRef = useRef(new THREE.Vector3(0, -G, 0));
  const roomDimensions = useMemo(() => {
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const cameraZ = cameraRef.current?.position?.z ?? 3.25;
    const cameraFov = cameraRef.current?.fov ?? 55;
    const distanceToRoom = Math.max(
      0.001,
      Math.abs(cameraZ - ROOM_POSITION[2])
    );
    const frustumHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(cameraFov) * 0.5) * distanceToRoom;
    const frustumWidth = frustumHeight * aspect;

    return [frustumWidth, frustumHeight, ROOM_SIZE];
  }, [size.height, size.width]);
  const [roomWidth, roomHeight] = roomDimensions;
  const xScale = roomWidth / ROOM_SIZE;
  const yScale = roomHeight / ROOM_SIZE;
  const scaleToRoom = useCallback(
    ([x, y, z]) => [x * xScale, y * yScale, z],
    [xScale, yScale]
  );

  const [motionEnabled, setMotionEnabled] = useState(() => {
    if (prefersPointerControls()) return false;
    if (!supportsMotionSensors()) return false;
    // If iOS permission is required, start disabled until user taps.
    if (needsIOSMotionPermission()) return false;
    // Otherwise try immediately (will still require HTTPS).
    return true;
  });
  const [motionDeclined, setMotionDeclined] = useState(false);

  const enableMotion = useCallback(async () => {
    if (!isSecureContextAvailable()) {
      // Sensors won’t work on insecure origins.
      setMotionEnabled(false);
      return;
    }

    if (needsIOSMotionPermission()) {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') return;
      } catch (e) {
        return;
      }
    }

    setMotionEnabled(true);
    setMotionDeclined(false);
  }, []);

  const declineMotion = useCallback(() => {
    setMotionEnabled(false);
    setMotionDeclined(true);
  }, []);

  const usePointerGravity = !motionSupported || !motionEnabled;
  const showPointerHelp =
    usePointerGravity && pointerPreferred && !pointerHelpDismissed;

  return (
    <>
      <color attach="background" args={['#000000']} />

      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 0, 3.25]}
        fov={55}
        near={0.08}
        far={30}
      />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3, 4, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Physics gravity={[0, -G, 0]} debug={debug}>
        <DeviceGravity
          enabled={motionEnabled}
          gravityOutRef={gravityRef}
          cameraRef={cameraRef}
          calibrateRequestRef={calibrateRequestRef}
          calibrationResetRequestRef={calibrationResetRequestRef}
        />
        <PointerGravity
          enabled={usePointerGravity}
          gravityOutRef={gravityRef}
        />
        <RoomVisual dimensions={roomDimensions} />
        <RoomBounds dimensions={roomDimensions} />
        <Ball
          color="#000000"
          position={scaleToRoom([0.1, -0.3, ROOM_POSITION[2]])}
        />
        <Ball
          color="#FFFFFF"
          position={scaleToRoom([0, 0.3, ROOM_POSITION[2]])}
        />
        <Ball
          color="#FF0000"
          position={scaleToRoom([-0.1, 0.2, ROOM_POSITION[2]])}
        />
        <PhysicalReversal position={scaleToRoom([-0.7, 0.9, -1])} />
        <PhysicalReversal position={scaleToRoom([0.5, -0.7, -1])} />
        <PhysicalBret position={scaleToRoom([0, 0, ROOM_POSITION[2]])} />
        <GlassBallBret
          position={scaleToRoom([-0.85, 0.45, ROOM_POSITION[2]])}
        />
        <GlassBallReversal
          position={scaleToRoom([-0.85, -0.45, ROOM_POSITION[2]])}
        />
        <GlassBallPair position={scaleToRoom([0.7, 0.05, ROOM_POSITION[2]])} />
      </Physics>

      {!pointerPreferred && !motionEnabled && !motionDeclined && (
        <MotionPermissionOverlay
          onEnable={enableMotion}
          onDecline={declineMotion}
          showDecline={needsIOSMotionPermission()}
        />
      )}
      {showPointerHelp && (
        <PointerHelpOverlay onDismiss={() => setPointerHelpDismissed(true)} />
      )}
    </>
  );
}
