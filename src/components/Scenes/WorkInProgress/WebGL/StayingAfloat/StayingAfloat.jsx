import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import STAYING_AFLOAT_SPLINES from '../../../../../presets/spline/stayingAfloatSplines';
import HammerHead from '../../../../elements/hammerHead/HammerHead';
import LifePreserver from '../../../../elements/lifePreserver/LifePreserver';
import TigerShark from '../../../../elements/tigerShark/TigerShark';

const COLUMN_SIZE = 3.6;
const COLUMN_HEIGHT = 6.0;

function WaterColumn() {
  const segments = useMemo(
    () => [
      { y: 1.8, height: 1.8, color: '#9edff0', opacity: 0.34 },
      { y: 0.0, height: 1.8, color: '#63bcd7', opacity: 0.3 },
      { y: -1.8, height: 2.4, color: '#246f98', opacity: 0.34 },
    ],
    []
  );

  const columnGeometry = useMemo(
    () => new THREE.BoxGeometry(COLUMN_SIZE, COLUMN_HEIGHT, COLUMN_SIZE),
    []
  );
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(columnGeometry),
    [columnGeometry]
  );

  return (
    <group>
      {segments.map((segment) => (
        <mesh key={segment.y} position={[0, segment.y, 0]}>
          <boxGeometry args={[COLUMN_SIZE, segment.height, COLUMN_SIZE]} />
          <meshPhysicalMaterial
            color={segment.color}
            transparent
            opacity={segment.opacity}
            roughness={0.3}
            metalness={0.0}
            transmission={0.5}
            ior={1.12}
            thickness={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[0, COLUMN_HEIGHT * 0.5, 0]}>
        <boxGeometry args={[COLUMN_SIZE * 0.98, 0.02, COLUMN_SIZE * 0.98]} />
        <meshStandardMaterial
          color="#c8f0ff"
          transparent
          opacity={0.65}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>

      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color="#1f4455"
          transparent
          opacity={0.65}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function FloatingPreserver() {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 3.03 + Math.sin(t * 1.4) * 0.04;
    ref.current.rotation.x = Math.sin(t * 0.9) * 0.08;
    ref.current.rotation.z = Math.cos(t * 1.1) * 0.08;
    ref.current.rotation.y = t * 0.2;
  });

  return (
    <group ref={ref} position={[0.1, 3.03, 0.15]} scale={0.52}>
      <LifePreserver />
    </group>
  );
}

function SplineShark({
  Shark,
  points,
  speed,
  scale,
  headingOffset = 0,
  clockwise = true,
}) {
  const ref = useRef();
  const curve = useMemo(() => {
    if (!points?.length) return null;
    const scenePoints = points.map((point) =>
      point.clone().multiplyScalar(0.01)
    );
    return new THREE.CatmullRomCurve3(scenePoints, true, 'centripetal', 0.5);
  }, [points]);

  useFrame((state) => {
    if (!ref.current || !curve) return;
    const t = (state.clock.elapsedTime * speed) % 1;
    const u = clockwise ? (1 - t + 1) % 1 : t;
    const aheadU = (u + 0.01) % 1;
    const p = curve.getPointAt(u);
    const pAhead = curve.getPointAt(aheadU);
    const dx = pAhead.x - p.x;
    const dz = pAhead.z - p.z;
    const heading = Math.atan2(dz, dx);

    ref.current.position.set(
      p.x,
      p.y + Math.sin(state.clock.elapsedTime * 1.7) * 0.05,
      p.z
    );
    ref.current.rotation.y = heading + headingOffset;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.0) * 0.08;
  });

  return (
    <group ref={ref} scale={scale}>
      <Shark />
    </group>
  );
}

export default function StayingAfloat() {
  const { hammerheadPath, tigerSharkPath } = useMemo(() => {
    const preset = STAYING_AFLOAT_SPLINES['Staying Afloat'];
    const splines = preset?.splines ?? [];
    return {
      hammerheadPath: splines.find(
        (spline) => spline.name === 'Hammerhead Path'
      ),
      tigerSharkPath: splines.find(
        (spline) => spline.name === 'Tiger Shark Path'
      ),
    };
  }, []);

  return (
    <>
      <color attach="background" args={['#ffffff']} />

      <PerspectiveCamera
        makeDefault
        position={[8.4, 7.4, 8.2]}
        fov={30}
        near={0.1}
        far={100}
        onUpdate={(self) => self.lookAt(0, 0.4, 0)}
      />

      <ambientLight intensity={0.85} color="#f7fbff" />
      <directionalLight
        position={[4, 10, 5]}
        intensity={1.15}
        color="#fff8ea"
        castShadow
      />
      <directionalLight
        position={[-5, 2, -6]}
        intensity={0.35}
        color="#d9f2ff"
      />

      <WaterColumn />
      <FloatingPreserver />

      <SplineShark
        Shark={HammerHead}
        points={hammerheadPath?.points?.map((p) => p.position) ?? []}
        speed={0.42}
        scale={0.28}
        headingOffset={Math.PI}
      />

      <SplineShark
        Shark={TigerShark}
        points={tigerSharkPath?.points?.map((p) => p.position) ?? []}
        speed={0.32}
        scale={0.018}
        headingOffset={Math.PI * 0.9}
      />
    </>
  );
}
