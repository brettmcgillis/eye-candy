import { memo, useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

const WIDTH = 128;
const HEIGHT = 64;

const scratch = new THREE.Color();
const sunDir = new THREE.Vector3();
const texelDir = new THREE.Vector3();

function linear(hex) {
  scratch.set(hex);
  return [scratch.r, scratch.g, scratch.b];
}

// Equirectangular layout that matches three's own mapping: v runs from -Y at
// row 0 to +Y at the last row, u from atan2(z, -x). Exported so the layout can
// be checked without a GPU — a flipped gradient lights the scene from below.
export function buildGradient({
  skyColor,
  horizonColor,
  groundColor,
  horizonSoftness,
  sunColor,
  sunIntensity,
  sunSize,
  sunDirection,
}) {
  const sky = linear(skyColor);
  const horizon = linear(horizonColor);
  const ground = linear(groundColor);
  const sun = linear(sunColor);

  sunDir.set(...sunDirection);
  if (sunDir.lengthSq() < 1e-6) sunDir.set(0, 1, 0);
  sunDir.normalize();

  const softness = Math.max(horizonSoftness, 0.01);
  const sharpness = 2 ** (10 * (1 - Math.min(Math.max(sunSize, 0), 1)));
  const data = new Float32Array(WIDTH * HEIGHT * 4);

  for (let y = 0; y < HEIGHT; y += 1) {
    const v = (y + 0.5) / HEIGHT;
    const elevation = (v - 0.5) * Math.PI;
    const sinElev = Math.sin(elevation);
    const cosElev = Math.cos(elevation);

    const t = Math.min(Math.abs(sinElev) / softness, 1) ** 0.7;
    const band = sinElev >= 0 ? sky : ground;

    for (let x = 0; x < WIDTH; x += 1) {
      const phi = ((x + 0.5) / WIDTH - 0.5) * Math.PI * 2;
      texelDir.set(-Math.cos(phi) * cosElev, sinElev, Math.sin(phi) * cosElev);
      const glow =
        Math.max(texelDir.dot(sunDir), 0) ** sharpness * sunIntensity;

      const i = (y * WIDTH + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        data[i + c] = horizon[c] + (band[c] - horizon[c]) * t + sun[c] * glow;
      }
      data[i + 3] = 1;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    WIDTH,
    HEIGHT,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// A prefiltered sky/ground gradient standing in for an HDRI. Without one, a
// standard material has nothing to reflect: metals go flat grey and every
// shadowed surface falls to whatever the ambient term happens to be.
function GradientEnvironment({
  skyColor = '#9fb4c8',
  horizonColor = '#c8cfc0',
  groundColor = '#4a4436',
  horizonSoftness = 0.45,
  sunColor = '#fff4e0',
  sunIntensity = 0,
  sunSize = 0.35,
  sunDirection = [0, 1, 0],
  intensity = 1,
}) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  const [sunX, sunY, sunZ] = sunDirection;

  useEffect(() => {
    if (!renderer) return undefined;

    const equirect = buildGradient({
      skyColor,
      horizonColor,
      groundColor,
      horizonSoftness,
      sunColor,
      sunIntensity,
      sunSize,
      sunDirection: [sunX, sunY, sunZ],
    });

    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = pmrem.fromEquirectangular(equirect);
    const previous = scene.environment;
    scene.environment = target.texture;

    equirect.dispose();
    pmrem.dispose();

    return () => {
      if (scene.environment === target.texture) scene.environment = previous;
      target.dispose();
    };
  }, [
    groundColor,
    horizonColor,
    horizonSoftness,
    renderer,
    scene,
    skyColor,
    sunColor,
    sunIntensity,
    sunSize,
    sunX,
    sunY,
    sunZ,
  ]);

  useEffect(() => {
    scene.environmentIntensity = intensity;
    return () => {
      scene.environmentIntensity = 1;
    };
  }, [intensity, scene]);

  return null;
}

export default memo(GradientEnvironment);
