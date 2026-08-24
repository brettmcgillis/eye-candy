import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

const FOV = 45;
const AZIMUTH_DEG = -30;
const ELEVATION_DEG = 30;
const DISTANCE_SCALE = 1.4;
const MIN_ASPECT = 0.3;

export default function useCameraLayout(config) {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);

  const stackCenterY = config.stackY + config.layerHeight * 0.5;
  const sceneRadius = Math.max(config.layerWidth / 2, config.chipsZ * 0.8);

  const halfVFov = THREE.MathUtils.degToRad(FOV / 2);
  const halfHFov = Math.atan(Math.tan(halfVFov) * Math.max(MIN_ASPECT, aspect));
  const minHalfFov = Math.min(halfVFov, halfHFov);
  const distance = (sceneRadius / Math.tan(minHalfFov)) * DISTANCE_SCALE;

  const azimuth = THREE.MathUtils.degToRad(AZIMUTH_DEG);
  const elevation = THREE.MathUtils.degToRad(ELEVATION_DEG);

  const cameraPos = [
    config.stackX + distance * Math.sin(azimuth) * Math.cos(elevation),
    stackCenterY + distance * Math.sin(elevation),
    config.stackZ + distance * Math.cos(azimuth) * Math.cos(elevation),
  ];

  const orbitTarget = [config.stackX, stackCenterY, config.stackZ];

  return { cameraPos, orbitTarget };
}
