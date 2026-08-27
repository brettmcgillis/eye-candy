import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  Fn,
  attribute,
  positionLocal,
  positionWorld,
  texture as tslTexture,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { mulberry32 } from '@utils/noise2d';

import useSceneTexture from '../hooks/useSceneTexture';

const CLOUD_TEXTURE = 'wildHorses/cloud.png';
const PLANE_SIZE = 20;

function rotate2(a, b, angle) {
  const s = angle.sin();
  const c = angle.cos();

  return [a.mul(c).sub(b.mul(s)), a.mul(s).add(b.mul(c))];
}

// Each cloud is a billboard pushed out to `distance` then swung into place by
// two rotations, so the whole set rides an invisible sphere around the camera
// and drifts by advancing the yaw over time.
function buildGeometry({ count, seed }) {
  const random = mulberry32(seed);
  const plane = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
  const geometry = new THREE.InstancedBufferGeometry();

  geometry.setAttribute('position', plane.attributes.position);
  geometry.setAttribute('uv', plane.attributes.uv);
  geometry.setIndex(plane.index);
  plane.dispose();

  const placement = new Float32Array(count * 3);
  const extras = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const scaleY = 1.0 + random() * 1.2;

    placement[i * 3 + 0] = -(0.2 + random() * 0.2);
    placement[i * 3 + 1] = random() * Math.PI * 2;
    placement[i * 3 + 2] = 30 + random() * 10;

    extras[i * 3 + 0] = scaleY * (random() > 0.5 ? 1 : -1);
    extras[i * 3 + 1] = scaleY;
    extras[i * 3 + 2] = 0.5 + random();
  }

  geometry.setAttribute(
    'placement',
    new THREE.InstancedBufferAttribute(placement, 3)
  );
  geometry.setAttribute('extra', new THREE.InstancedBufferAttribute(extras, 3));
  geometry.instanceCount = count;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);

  return geometry;
}

function Clouds({ config, dayNight }) {
  const { cloudCount, cloudDrift, cloudOpacity, cloudSeed } = config;
  const map = useSceneTexture(CLOUD_TEXTURE);
  const timeRef = useRef(0);

  const geometry = useMemo(
    () => buildGeometry({ count: cloudCount, seed: cloudSeed }),
    [cloudCount, cloudSeed]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  const { material, uniforms } = useMemo(() => {
    const values = {
      opacity: uniform(cloudOpacity),
      time: uniform(0),
    };

    const placement = attribute('placement', 'vec3');
    const extra = attribute('extra', 'vec3');

    const vertex = Fn(() => {
      const scaled = vec3(
        positionLocal.x.mul(extra.x),
        positionLocal.y.mul(extra.y),
        positionLocal.z.sub(placement.z)
      );

      const [y, z] = rotate2(scaled.y, scaled.z, placement.x);
      const [x, z2] = rotate2(
        scaled.x,
        z,
        placement.y.add(values.time.mul(extra.z))
      );

      return vec3(x, y, z2);
    });

    // wolf2 draws clouds with the depth test off, but it orders every pass by
    // hand. Three sorts transparents into a bucket that runs after all opaques,
    // so an untested cloud paints straight over the horse — the depth test is
    // what keeps them behind it. depthWrite stays off so they don't occlude
    // each other.
    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });
    nodeMaterial.positionNode = vertex();
    nodeMaterial.colorNode = tslTexture(map).rgb;
    nodeMaterial.opacityNode = tslTexture(map)
      .a.mul(values.opacity)
      .mul(dayNight.dayAmount)
      .mul(positionWorld.y.smoothstep(3.0, 7.0));

    return { material: nodeMaterial, uniforms: values };
  }, [dayNight, map]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.opacity.value = cloudOpacity;
  }, [cloudOpacity, uniforms]);

  useFrame((_, delta) => {
    timeRef.current += delta * cloudDrift;
    uniforms.time.value = timeRef.current;
  });

  return (
    <mesh
      frustumCulled={false}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  );
}

export default memo(Clouds);
