import * as THREE from 'three';

import {
  sampleNurbsWaterSurfaceHeight,
  sampleNurbsWaterSurfaceNormal,
} from './waterInteraction';

function getLiveWaveConfig({
  waveChoppiness,
  waveChoppinessRef,
  waveHeight,
  waveHeightRef,
  waveSpeed,
  waveSpeedRef,
}) {
  return {
    waveChoppiness: waveChoppinessRef?.current ?? waveChoppiness,
    waveHeight: waveHeightRef?.current ?? waveHeight,
    waveSpeed: waveSpeedRef?.current ?? waveSpeed,
  };
}

export default function createNurbsWaterLightningTargetAdapter({
  depth,
  groupRef,
  height,
  interactionRuntime = null,
  waveChoppiness,
  waveChoppinessRef = null,
  waveHeight,
  waveHeightRef = null,
  waveSpeed,
  waveSpeedRef = null,
  width,
}) {
  const localNormal = new THREE.Vector3();
  const worldNormal = new THREE.Vector3();

  return ({ intersection }) => {
    const group = groupRef.current;

    if (!group) {
      return null;
    }

    const point = group.worldToLocal(intersection.point.clone());
    const clampedX = THREE.MathUtils.clamp(point.x, -width / 2, width / 2);
    const clampedZ = THREE.MathUtils.clamp(point.z, -depth / 2, depth / 2);

    const sampleHeight = () => {
      const liveWaveConfig = getLiveWaveConfig({
        waveChoppiness,
        waveChoppinessRef,
        waveHeight,
        waveHeightRef,
        waveSpeed,
        waveSpeedRef,
      });

      if (interactionRuntime?.sampleHeight) {
        return interactionRuntime.sampleHeight(
          clampedX,
          clampedZ,
          liveWaveConfig.waveHeight,
          liveWaveConfig.waveChoppiness,
          liveWaveConfig.waveSpeed
        );
      }

      return sampleNurbsWaterSurfaceHeight({
        depth,
        interactionState:
          interactionRuntime?.interactionStateRef.current ?? null,
        waveChoppiness: liveWaveConfig.waveChoppiness,
        waveHeight: liveWaveConfig.waveHeight,
        waveSpeed: liveWaveConfig.waveSpeed,
        width,
        x: clampedX,
        z: clampedZ,
      });
    };

    const sampleNormal = () => {
      const liveWaveConfig = getLiveWaveConfig({
        waveChoppiness,
        waveChoppinessRef,
        waveHeight,
        waveHeightRef,
        waveSpeed,
        waveSpeedRef,
      });

      if (interactionRuntime?.sampleNormal) {
        return interactionRuntime.sampleNormal(
          clampedX,
          clampedZ,
          liveWaveConfig.waveHeight,
          liveWaveConfig.waveChoppiness,
          liveWaveConfig.waveSpeed,
          localNormal
        );
      }

      return sampleNurbsWaterSurfaceNormal({
        depth,
        interactionState:
          interactionRuntime?.interactionStateRef.current ?? null,
        target: localNormal,
        waveChoppiness: liveWaveConfig.waveChoppiness,
        waveHeight: liveWaveConfig.waveHeight,
        waveSpeed: liveWaveConfig.waveSpeed,
        width,
        x: clampedX,
        z: clampedZ,
      });
    };

    return {
      follow: true,
      normalResolver: () =>
        worldNormal.copy(sampleNormal()).transformDirection(group.matrixWorld),
      surfaceType: 'water',
      targetResolver: () => {
        const localPoint = new THREE.Vector3(
          clampedX,
          height / 2 + sampleHeight(),
          clampedZ
        );

        return group.localToWorld(localPoint);
      },
    };
  };
}
