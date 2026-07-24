import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import createSingularityBlackHoleVolumeShader from '../../utils/createSingularityBlackHoleVolumeShader';

function createUniforms(config) {
  return {
    time: uniform(0),
    cameraInside: uniform(0),
    iterations: uniform(
      Math.max(24, Math.round(config.singularityIterations ?? 112)),
      'int'
    ),
    stepSize: uniform(config.singularityStepSize ?? 0.011),
    power: uniform(config.singularityPower ?? 0.26),
    originRadius: uniform(0.11),
    bandWidth: uniform(config.singularityBandWidth ?? 0.058),
    fieldRadius: uniform(0.72),
    fieldScale: uniform(3.8),
    emissionStrength: uniform(config.singularityEmissionStrength ?? 1.9),
    rampPos1: uniform(0.05),
    rampPos2: uniform(0.425),
    rampPos3: uniform(1),
    rampColor1: uniform(
      new THREE.Color(config.singularityRampColor1 ?? '#f2b670')
    ),
    rampColor2: uniform(
      new THREE.Color(config.singularityRampColor2 ?? '#3d180a')
    ),
    rampColor3: uniform(
      new THREE.Color(config.singularityRampColor3 ?? '#050505')
    ),
    useBackground: uniform(0),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#03040a')
    ),
    starDensity: uniform(0.0065),
    starSize: uniform(1.35),
    starBrightness: uniform(0.8),
    nebula1Scale: uniform(2),
    nebula1Density: uniform(0.35),
    nebula1Brightness: uniform(0.08),
    nebula1Color: uniform(new THREE.Color('#10163b')),
    nebula2Scale: uniform(5.5),
    nebula2Density: uniform(0.15),
    nebula2Brightness: uniform(0.12),
    nebula2Color: uniform(new THREE.Color('#20070f')),
  };
}

const SingularityBlackHole = memo(function SingularityBlackHole({ config }) {
  const noiseTexture = useTexture(
    '/textures/blackhole/singularity-noise-deep.png'
  );
  const uniforms = useMemo(() => createUniforms(config), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 72, 48), []);

  const noiseTextureNode = useMemo(
    () => new THREE.TextureNode(noiseTexture),
    [noiseTexture]
  );

  useEffect(() => {
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;
    noiseTexture.needsUpdate = true;
  }, [noiseTexture]);

  const material = useMemo(() => {
    const shaderNode = createSingularityBlackHoleVolumeShader(uniforms, {
      noiseTextureNode,
    });
    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      depthTest: true,
      depthWrite: false,
      transparent: true,
      side: THREE.FrontSide,
      toneMapped: false,
    });
    const color = shaderNode.get('color');
    nodeMaterial.colorNode = color.rgb;
    nodeMaterial.opacityNode = color.a;
    nodeMaterial.depthNode = shaderNode.get('depth');
    return nodeMaterial;
  }, [noiseTextureNode, uniforms]);

  const position = config.blackHolePosition ?? { x: 0, y: 0, z: 0 };
  const metricWorldScale = config.metricWorldScale ?? 1;
  const lensDiameter = config.singularityLensDiameter ?? 1.55;
  const lensRadius = lensDiameter * metricWorldScale * 0.5;
  const wasInsideRef = useRef(null);

  useEffect(() => {
    const lensDiam = config.singularityLensDiameter ?? 1.55;
    const blackHoleDiam = 0.3048;
    const diskDiam = 1.08;
    const sharedCoreRadius = blackHoleDiam / Math.max(lensDiam, 0.0001);
    const sharedFieldRadius = diskDiam / Math.max(lensDiam, 0.0001);
    uniforms.iterations.value = Math.max(
      24,
      Math.round(config.singularityIterations ?? uniforms.iterations.value)
    );
    uniforms.stepSize.value =
      config.singularityStepSize ?? uniforms.stepSize.value;
    uniforms.power.value = config.singularityPower ?? uniforms.power.value;
    uniforms.originRadius.value = Math.min(
      0.7,
      Math.max(
        0.02,
        sharedCoreRadius * ((config.singularityOriginRadius ?? 0.11) / 0.11)
      )
    );
    uniforms.bandWidth.value =
      config.singularityBandWidth ?? uniforms.bandWidth.value;
    uniforms.fieldRadius.value = Math.min(
      0.95,
      Math.max(uniforms.originRadius.value * 1.6, sharedFieldRadius)
    );
    uniforms.emissionStrength.value =
      config.singularityEmissionStrength ?? uniforms.emissionStrength.value;
    uniforms.fieldScale.value =
      config.singularityFieldScale ?? uniforms.fieldScale.value;
    uniforms.rampColor1.value.set(config.singularityRampColor1 ?? '#f2b670');
    uniforms.rampColor2.value.set(config.singularityRampColor2 ?? '#3d180a');
    uniforms.rampColor3.value.set(config.singularityRampColor3 ?? '#050505');
    uniforms.useBackground.value = 0;
  }, [config, uniforms]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    uniforms.time.value += delta;
    const dx = state.camera.position.x - (position.x ?? 0);
    const dy = state.camera.position.y - (position.y ?? 0);
    const dz = state.camera.position.z - (position.z ?? 0);
    const isInside = dx * dx + dy * dy + dz * dz < lensRadius * lensRadius;
    uniforms.cameraInside.value = isInside ? 1 : 0;
    if (isInside !== wasInsideRef.current) {
      material.side = isInside ? THREE.BackSide : THREE.FrontSide;
      wasInsideRef.current = isInside;
    }
  });

  return (
    <group
      position={[position.x ?? 0, position.y ?? 0, position.z ?? 0]}
      scale={[lensRadius, lensRadius, lensRadius]}
    >
      <mesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        renderOrder={3}
      />
    </group>
  );
});

export default SingularityBlackHole;
