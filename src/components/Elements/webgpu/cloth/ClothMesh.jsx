import * as THREE from 'three/webgpu';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import createClothSimulation from './createClothSimulation';

// Module-level shared objects — avoid per-frame allocation.
// Safe because R3F useFrame callbacks execute sequentially.
const sharedRaycaster = new THREE.Raycaster();
const sharedPlane = new THREE.Plane();
const sharedIntersect = new THREE.Vector3();
const sharedCameraDir = new THREE.Vector3();

// Color-type properties on MeshPhysicalNodeMaterial that need .set()
const COLOR_KEYS = new Set([
  'color',
  'sheenColor',
  'attenuationColor',
  'specularColor',
  'emissive',
]);

export default function ClothMesh({
  // Cloth shape (static — used at creation only)
  width = 1.0,
  height = 0.7,
  segmentsX = 30,
  segmentsY = 21,
  pinEdge = 'left',
  origin = [0, 0, 0],
  gravity = 0.00005,
  windFrequency = 1,
  windAmplitude = 0.0001,
  stepsPerSecond = 360,
  // Initial material config (static — constructor only)
  initialMaterial = {},
  // Runtime simulation controls
  wind = 1.0,
  windDirX = 1,
  windDirZ = 0,
  stiffness = 0.2,
  dampening = 0.99,
  // Sphere interaction
  sphereEnabled = true,
  sphereRadius = 0.12,
  sphereWireframe = false,
  // Material properties applied each frame (optional)
  materialProps,
}) {
  const simState = useRef({
    timeSinceLastStep: 0,
    lastPointerX: 0,
    lastPointerY: 0,
  });
  const sphereRef = useRef();

  const { sim, interactionCenter } = useMemo(() => {
    const mat = new THREE.MeshPhysicalNodeMaterial({
      side: THREE.DoubleSide,
      ...initialMaterial,
    });
    const s = createClothSimulation({
      width,
      height,
      segmentsX,
      segmentsY,
      pinEdge,
      origin,
      gravity,
      windFrequency,
      windAmplitude,
      material: mat,
    });
    const cx = pinEdge === 'top' ? origin[0] : origin[0] + width / 2;
    const cy = origin[1] - height / 2;
    return {
      sim: s,
      interactionCenter: new THREE.Vector3(cx, cy, origin[2]),
    };
  }, []); // GPU buffers built once — intentionally static

  const timePerStep = 1 / stepsPerSecond;

  useFrame(({ gl, pointer, camera }, delta) => {
    const s = simState.current;

    // Push control values into GPU uniforms
    sim.windU.value = wind;
    sim.windDirU.value.set(windDirX, 0, windDirZ).normalize();
    sim.stiffnessU.value = stiffness;
    sim.dampeningU.value = dampening;
    sim.sphereRadiusU.value = sphereRadius;

    // Apply dynamic material properties
    if (materialProps) {
      Object.entries(materialProps).forEach(([key, val]) => {
        if (COLOR_KEYS.has(key) && sim.material[key]?.isColor) {
          sim.material[key].set(val);
        } else {
          // eslint-disable-next-line no-param-reassign
          sim.material[key] = val;
        }
        if (key === 'opacity') {
          // eslint-disable-next-line no-param-reassign
          sim.material.transparent = val < 1;
        }
      });
    }

    // Cursor → sphere interaction
    const pointerActive =
      pointer.x !== s.lastPointerX || pointer.y !== s.lastPointerY;
    if (
      pointerActive &&
      (pointer.x !== 0 || pointer.y !== 0) &&
      sphereEnabled
    ) {
      camera.getWorldDirection(sharedCameraDir);
      sharedPlane.setFromNormalAndCoplanarPoint(
        sharedCameraDir,
        interactionCenter
      );
      sharedRaycaster.setFromCamera(pointer, camera);
      if (sharedRaycaster.ray.intersectPlane(sharedPlane, sharedIntersect)) {
        sim.spherePosU.value.copy(sharedIntersect);
        if (sphereRef.current) {
          sphereRef.current.position.copy(sharedIntersect);
        }
      }
      sim.sphereU.value = 1.0;
    } else if (!sphereEnabled) {
      sim.sphereU.value = 0.0;
    }
    s.lastPointerX = pointer.x;
    s.lastPointerY = pointer.y;

    // Fixed-timestep simulation
    s.timeSinceLastStep += Math.min(delta, 1 / 60);

    while (s.timeSinceLastStep >= timePerStep) {
      s.timeSinceLastStep -= timePerStep;
      gl.compute(sim.computeSprings);
      gl.compute(sim.computeVertices);
    }
  });

  return (
    <group>
      <mesh
        geometry={sim.geometry}
        material={sim.material}
        frustumCulled={false}
      />
      {sphereWireframe && (
        <mesh ref={sphereRef} frustumCulled={false}>
          <icosahedronGeometry args={[sphereRadius, 3]} />
          <meshBasicMaterial
            wireframe
            color="#00ffff"
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}
