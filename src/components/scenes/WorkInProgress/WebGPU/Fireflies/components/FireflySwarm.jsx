import { instancedBufferAttribute } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const dummy = new THREE.Object3D();
const scratchColor = new THREE.Color();

// Reads simRef.current — mutated by Swarm's step(), which mounts (and so
// subscribes its useFrame) after this component per React's bottom-up
// layout-effect order, meaning this always renders one frame behind the
// simulation. Same tradeoff as AttractorDebug's debugRef: invisible at
// frame rate, far simpler than fighting useFrame subscription order.
//
// Material color is left white — mesh.instanceColor (setColorAt) alone
// carries the matte grey→glow lerp for diffuse; NodeMaterial multiplies
// colorNode by it automatically whenever object.instanceColor exists. There
// is no equivalent auto-wiring for emissive, and this three build's
// 'three/tsl' entry doesn't export the built-in instanceColor accessor node
// to reuse by hand (only instancedBufferAttribute et al. are exported) — so
// emissive gets its own explicit per-instance buffer instead, written
// alongside setColorAt each frame with glowIntensity already baked in.
function FireflySwarm({ config, simRef }) {
  const meshRef = useRef(null);
  const bodyColorRef = useRef(new THREE.Color(config.bodyColor));
  const glowColorRef = useRef(new THREE.Color(config.glowColor));
  bodyColorRef.current.set(config.bodyColor);
  glowColorRef.current.set(config.glowColor);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);

  const emissiveAttribute = useMemo(() => {
    const attr = new THREE.InstancedBufferAttribute(
      new Float32Array(config.fireflyCount * 3),
      3
    );
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }, [config.fireflyCount]);
  geometry.setAttribute('instanceEmissive', emissiveAttribute);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      roughness: 0.85,
      metalness: 0.05,
    });
    mat.emissiveNode = instancedBufferAttribute(emissiveAttribute);
    return mat;
  }, [emissiveAttribute]);

  useFrame(() => {
    const mesh = meshRef.current;
    const sim = simRef.current;
    if (!mesh || !sim) return;

    const { flockCount, flockFlash, flockPos } = sim;
    const bodyColor = bodyColorRef.current;
    const glowColor = glowColorRef.current;
    const { glowIntensity } = config;
    const emissive = emissiveAttribute.array;

    for (let i = 0; i < flockCount; i += 1) {
      const base = i * 3;
      const flash = flockFlash[i];

      dummy.position.set(
        flockPos[base],
        flockPos[base + 1],
        flockPos[base + 2]
      );
      dummy.scale.setScalar(
        config.bodySize * (1 + flash * config.glowSizeBoost)
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      scratchColor.copy(bodyColor).lerp(glowColor, flash);
      mesh.setColorAt(i, scratchColor);

      emissive[base] = scratchColor.r * glowIntensity;
      emissive[base + 1] = scratchColor.g * glowIntensity;
      emissive[base + 2] = scratchColor.b * glowIntensity;
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    emissiveAttribute.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={config.fireflyCount}
      ref={meshRef}
      args={[geometry, material, config.fireflyCount]}
      frustumCulled={false}
    />
  );
}

export default memo(FireflySwarm);
