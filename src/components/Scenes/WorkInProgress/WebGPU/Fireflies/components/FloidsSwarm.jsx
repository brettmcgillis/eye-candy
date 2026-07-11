import { ClusteredLighting } from 'three/addons/lighting/ClusteredLighting.js';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createFloidsSimulation from '../utils/createFloidsSimulation';
import { VOLUME_LAYER } from './VolumetricAtmosphere';

const LIGHT_POWER = 45;
const HUNTER_CENTER = new THREE.Vector3(0, 3.5, 0);
const hunterOffset = new THREE.Vector3();

function flashIntensity(clock, cycle) {
  const phase = Math.abs(clock / cycle - 0.5);
  return THREE.MathUtils.smoothstep(0.18, 0.015, phase);
}

const FloidsSwarm = memo(function FloidsSwarm({ config }) {
  const { camera, gl: renderer, pointer, raycaster } = useThree();
  const bodiesRef = useRef(null);
  const hunterRef = useRef(null);
  const lightsRef = useRef([]);
  const volumeLightsRef = useRef([]);
  const simulationRef = useRef(null);
  const hunterVelocity = useRef(new THREE.Vector3(0.12, 0, 0.08));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const pointerPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -3.5),
    []
  );
  const pointerPosition = useMemo(() => new THREE.Vector3(), []);
  const indices = useMemo(
    () => Array.from({ length: config.fireflyCount }, (_, index) => index),
    [config.fireflyCount]
  );

  useEffect(() => {
    const previousLighting = renderer.lighting;
    renderer.lighting = new ClusteredLighting(
      config.fireflyCount + 2,
      48,
      16,
      32
    );
    const simulation = createFloidsSimulation(config.fireflyCount, config);
    simulationRef.current = simulation;

    return () => {
      renderer.lighting = previousLighting;
      simulationRef.current = null;
    };
  }, [config.fireflyCount, renderer]);

  useFrame((_, rawDelta) => {
    const simulation = simulationRef.current;
    const bodies = bodiesRef.current;
    const hunter = hunterRef.current;
    if (!simulation || !bodies || !hunter) return;

    const delta = Math.min(rawDelta, 1 / 30);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(pointerPlane, pointerPosition);

    let preyX = 0;
    let preyY = 0;
    let preyZ = 0;
    let preyCount = 0;
    for (let index = 0; index < config.fireflyCount; index += 1) {
      const offset = index * 3;
      const dx = simulation.positions[offset] - hunter.position.x;
      const dy = simulation.positions[offset + 1] - hunter.position.y;
      const dz = simulation.positions[offset + 2] - hunter.position.z;
      const distanceSq = dx * dx + dy * dy + dz * dz;
      if (distanceSq < 25) {
        const weight = 1 / Math.max(distanceSq, 0.025);
        preyX += dx * weight;
        preyY += dy * weight;
        preyZ += dz * weight;
        preyCount += 1;
      }
    }
    if (preyCount) {
      hunterVelocity.current.x += (preyX / preyCount) * delta * 0.8;
      hunterVelocity.current.y += (preyY / preyCount) * delta * 0.8;
      hunterVelocity.current.z += (preyZ / preyCount) * delta * 0.8;
    }
    hunterOffset.copy(hunter.position).sub(HUNTER_CENTER);
    if (hunterOffset.lengthSq() > 6.5 ** 2) {
      hunterVelocity.current.addScaledVector(hunterOffset, -0.5 * delta);
    }
    hunterVelocity.current.setLength(config.hunterSpeed * 0.0016);
    hunter.position.addScaledVector(hunterVelocity.current, delta);

    simulation.step(delta, config, hunter.position, {
      mode: config.cursorMode,
      position: pointerPosition,
      radius: config.cursorRadius * 0.02,
    });

    let brightestIndex = -1;
    let secondBrightestIndex = -1;
    let brightestFlash = -1;
    let secondBrightestFlash = -1;

    for (let index = 0; index < config.fireflyCount; index += 1) {
      const offset = index * 3;
      const flash = flashIntensity(simulation.clocks[index], config.fireCycle);
      dummy.position.fromArray(simulation.positions, offset);
      dummy.scale.setScalar(config.fireflySize * 0.025 * (0.7 + flash * 0.5));
      dummy.updateMatrix();
      bodies.setMatrixAt(index, dummy.matrix);
      color.setHSL(index / config.fireflyCount, 1, 0.5);
      bodies.setColorAt(index, color);

      const light = lightsRef.current[index];
      if (light) {
        light.position.copy(dummy.position);
        light.power = LIGHT_POWER * config.lightIntensity * flash;
      }

      if (flash > brightestFlash) {
        secondBrightestIndex = brightestIndex;
        secondBrightestFlash = brightestFlash;
        brightestIndex = index;
        brightestFlash = flash;
      } else if (flash > secondBrightestFlash) {
        secondBrightestIndex = index;
        secondBrightestFlash = flash;
      }
    }
    bodies.instanceMatrix.needsUpdate = true;
    bodies.instanceColor.needsUpdate = true;

    const primaryVolumeLight = volumeLightsRef.current[0];
    if (primaryVolumeLight && brightestIndex >= 0) {
      const offset = brightestIndex * 3;
      primaryVolumeLight.position.fromArray(simulation.positions, offset);
      primaryVolumeLight.color.setHSL(
        brightestIndex / config.fireflyCount,
        1,
        0.5
      );
      primaryVolumeLight.power =
        LIGHT_POWER * config.lightIntensity * brightestFlash;
    }

    const secondaryVolumeLight = volumeLightsRef.current[1];
    if (secondaryVolumeLight && secondBrightestIndex >= 0) {
      const offset = secondBrightestIndex * 3;
      secondaryVolumeLight.position.fromArray(simulation.positions, offset);
      secondaryVolumeLight.color.setHSL(
        secondBrightestIndex / config.fireflyCount,
        1,
        0.5
      );
      secondaryVolumeLight.power =
        LIGHT_POWER * config.lightIntensity * secondBrightestFlash;
    }
  });

  return (
    <>
      <instancedMesh
        ref={bodiesRef}
        args={[undefined, undefined, config.fireflyCount]}
        castShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial metalness={0} roughness={0.85} vertexColors />
      </instancedMesh>
      {indices.map((index) => (
        <pointLight
          key={index}
          ref={(light) => {
            lightsRef.current[index] = light;
          }}
          color={new THREE.Color().setHSL(index / config.fireflyCount, 1, 0.5)}
          decay={2}
          distance={5.5}
        />
      ))}
      {[0, 1].map((index) => (
        <pointLight
          key={`volume-${index}`}
          ref={(light) => {
            volumeLightsRef.current[index] = light;
            if (light) {
              light.layers.disableAll();
              light.layers.enable(VOLUME_LAYER);
            }
          }}
          decay={2}
          distance={5.5}
        />
      ))}
      <mesh ref={hunterRef} castShadow position={[0, 3.5, 0]}>
        <sphereGeometry args={[config.hunterRadius * 0.055, 64, 32]} />
        <meshPhongMaterial color="#dddddd" shininess={80} />
      </mesh>
    </>
  );
});

export default FloidsSwarm;
