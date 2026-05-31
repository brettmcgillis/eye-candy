import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { ENVIRONMENT_SPACE } from '../../presets/presets';
import createSingularityBlackHoleVolumeShader from '../../utils/createSingularityBlackHoleVolumeShader';

const SINGULARITY_DEFAULTS = {
  iterations: 128,
  stepSize: 0.0071,
  noiseFactor: 0.01,
  power: 0.3,
  originRadius: 0.13,
  bandWidth: 0.03,
  rampPos1: 0.05,
  rampPos2: 0.425,
  rampPos3: 1,
  rampColor1: '#f2b670',
  rampColor2: '#240d08',
  rampColor3: '#050505',
  emissionStrength: 2,
  emissionColor: '#242117',
};

const SINGULARITY_NOISE_TEXTURE_PATH =
  '/textures/blackhole/singularity-noise-deep.png';
const SINGULARITY_ENVIRONMENT_TEXTURE_PATH =
  '/textures/blackhole/singularity-nebula.png';

function createUniforms(config) {
  return {
    time: uniform(0),
    iterations: uniform(
      Math.max(
        24,
        Math.round(
          config.singularityIterations ?? SINGULARITY_DEFAULTS.iterations
        )
      ),
      'int'
    ),
    stepSize: uniform(
      config.singularityStepSize ?? SINGULARITY_DEFAULTS.stepSize
    ),
    noiseFactor: uniform(
      config.singularityNoiseFactor ?? SINGULARITY_DEFAULTS.noiseFactor
    ),
    power: uniform(config.singularityPower ?? SINGULARITY_DEFAULTS.power),
    originRadius: uniform(SINGULARITY_DEFAULTS.originRadius),
    bandWidth: uniform(
      config.singularityBandWidth ?? SINGULARITY_DEFAULTS.bandWidth
    ),
    emissionStrength: uniform(
      config.singularityEmissionStrength ??
        SINGULARITY_DEFAULTS.emissionStrength
    ),
    emissionColor: uniform(
      new THREE.Color(
        config.singularityEmissionColor ?? SINGULARITY_DEFAULTS.emissionColor
      )
    ),
    rampPos1: uniform(
      config.singularityRampPos1 ?? SINGULARITY_DEFAULTS.rampPos1
    ),
    rampPos2: uniform(
      config.singularityRampPos2 ?? SINGULARITY_DEFAULTS.rampPos2
    ),
    rampPos3: uniform(
      config.singularityRampPos3 ?? SINGULARITY_DEFAULTS.rampPos3
    ),
    rampColor1: uniform(
      new THREE.Color(
        config.singularityRampColor1 ?? SINGULARITY_DEFAULTS.rampColor1
      )
    ),
    rampColor2: uniform(
      new THREE.Color(
        config.singularityRampColor2 ?? SINGULARITY_DEFAULTS.rampColor2
      )
    ),
    rampColor3: uniform(
      new THREE.Color(
        config.singularityRampColor3 ?? SINGULARITY_DEFAULTS.rampColor3
      )
    ),
    backgroundIntensity: uniform(2),
    useBackground: uniform(0),
  };
}

const SingularityBlackHole = memo(function SingularityBlackHole({ config }) {
  const [noiseTexture, environmentTexture] = useTexture([
    SINGULARITY_NOISE_TEXTURE_PATH,
    SINGULARITY_ENVIRONMENT_TEXTURE_PATH,
  ]);
  const uniforms = useMemo(() => createUniforms(config), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 72, 48), []);
  const noiseTextureNode = useMemo(
    () => new THREE.TextureNode(noiseTexture),
    [noiseTexture]
  );
  const environmentTextureNode = useMemo(
    () => new THREE.TextureNode(environmentTexture),
    [environmentTexture]
  );

  useEffect(() => {
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;
    noiseTexture.needsUpdate = true;
    environmentTexture.colorSpace = THREE.SRGBColorSpace;
    environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
    environmentTexture.needsUpdate = true;
  }, [environmentTexture, noiseTexture]);

  const material = useMemo(() => {
    const colorNode = createSingularityBlackHoleVolumeShader(uniforms, {
      environmentTextureNode,
      noiseTextureNode,
    });
    const nodeMaterial = new THREE.MeshStandardNodeMaterial({
      side: THREE.DoubleSide,
    });
    nodeMaterial.colorNode = colorNode;
    nodeMaterial.emissiveNode = colorNode;
    return nodeMaterial;
  }, [environmentTextureNode, noiseTextureNode, uniforms]);

  const position = config.blackHolePosition ?? { x: 0, y: 0, z: 0 };
  const metricWorldScale = config.metricWorldScale ?? 1;
  const lensRadius = config.lensDiameter * metricWorldScale * 0.5;

  useEffect(() => {
    uniforms.iterations.value = Math.max(
      24,
      Math.round(
        config.singularityIterations ?? SINGULARITY_DEFAULTS.iterations
      )
    );
    uniforms.stepSize.value =
      config.singularityStepSize ?? SINGULARITY_DEFAULTS.stepSize;
    uniforms.noiseFactor.value =
      config.singularityNoiseFactor ?? SINGULARITY_DEFAULTS.noiseFactor;
    uniforms.power.value =
      config.singularityPower ?? SINGULARITY_DEFAULTS.power;
    uniforms.originRadius.value =
      config.singularityOriginRadius ?? SINGULARITY_DEFAULTS.originRadius;
    uniforms.bandWidth.value =
      config.singularityBandWidth ?? SINGULARITY_DEFAULTS.bandWidth;
    uniforms.emissionStrength.value =
      config.singularityEmissionStrength ??
      SINGULARITY_DEFAULTS.emissionStrength;
    uniforms.emissionColor.value.set(
      config.singularityEmissionColor ?? SINGULARITY_DEFAULTS.emissionColor
    );
    uniforms.rampPos1.value =
      config.singularityRampPos1 ?? SINGULARITY_DEFAULTS.rampPos1;
    uniforms.rampPos2.value =
      config.singularityRampPos2 ?? SINGULARITY_DEFAULTS.rampPos2;
    uniforms.rampPos3.value =
      config.singularityRampPos3 ?? SINGULARITY_DEFAULTS.rampPos3;
    uniforms.rampColor1.value.set(
      config.singularityRampColor1 ?? SINGULARITY_DEFAULTS.rampColor1
    );
    uniforms.rampColor2.value.set(
      config.singularityRampColor2 ?? SINGULARITY_DEFAULTS.rampColor2
    );
    uniforms.rampColor3.value.set(
      config.singularityRampColor3 ?? SINGULARITY_DEFAULTS.rampColor3
    );
    uniforms.backgroundIntensity.value = 2;
    uniforms.useBackground.value =
      config.environment === ENVIRONMENT_SPACE &&
      config.singularityUseBackground
        ? 1
        : 0;
  }, [config, uniforms]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    uniforms.time.value += delta;
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
