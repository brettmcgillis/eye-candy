import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  CanvasTexture,
  Color,
  InstancedBufferAttribute,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from 'three';

import { makeRng } from '../../utils/paintStyle';
import particleMaterial from '../../utils/particleMaterial';
import Comparison from './Comparison';

function referenceStamp() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6d7e98';
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, Math.PI * 2);
  ctx.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function ParticleSample({ config, assets, mode, time }) {
  const mesh = useRef();
  const root = useRef();
  const webgpu = useThree((state) => state.gl.isWebGPURenderer === true);
  const data = useMemo(() => {
    const rng = makeRng(config.seed);
    const count = config.particleCount;
    const geometry = new PlaneGeometry(1, 1);
    geometry.setAttribute(
      'particleAlpha',
      new InstancedBufferAttribute(new Float32Array(count), 1)
    );
    geometry.setAttribute(
      'particleTint',
      new InstancedBufferAttribute(new Float32Array(count * 3), 3)
    );
    const reference = referenceStamp();
    const material = particleMaterial(
      mode === 'original'
        ? reference
        : assets.particleTexture || assets.spriteTexture,
      webgpu,
      config
    );
    return {
      geometry,
      material,
      reference,
      seeds: Array.from({ length: count }, () => [
        rng(),
        rng() * Math.PI * 2,
        rng(),
        rng(),
        rng(),
      ]),
      order: Array.from({ length: count }, (_, i) => i),
      positions: new Float32Array(count * 3),
      depths: new Float32Array(count),
      ages: new Float32Array(count),
      dummy: new Object3D(),
      point: new Vector3(),
      spin: new Quaternion(),
      axis: new Vector3(0, 0, 1),
      tint: new Color(),
    };
  }, [
    config.particleCount,
    config.particleDepth,
    config.particleOpacity,
    config.seed,
    assets,
    mode,
    webgpu,
  ]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.material.dispose();
      data.reference.dispose();
    },
    [data]
  );
  useFrame(({ camera }) => {
    if (!mesh.current) return;
    root.current.updateWorldMatrix(true, false);
    const t = time.current * 3;
    const leaf = config.particleKind === 'leaves';
    data.seeds.forEach(([phase, angle, radius, wobble], i) => {
      const age = (phase + t / config.particleLifetime) % 1;
      const spread =
        config.particleSpread * (0.3 + Math.sqrt(age) * (leaf ? 1.1 : 2));
      const x =
        Math.cos(angle) * radius * spread +
        config.particleWind * age * 2 +
        Math.sin(t + phase * 20) * 0.25;
      const y = leaf ? 2.5 - age * 5 : -2.5 + age * 5;
      const z =
        Math.sin(angle) * radius * spread +
        Math.sin(t * 0.5 + wobble * 20) * 0.4;
      data.positions[i * 3] = x;
      data.positions[i * 3 + 1] = y;
      data.positions[i * 3 + 2] = z;
      data.ages[i] = age;
      data.point
        .set(x, y, z)
        .applyMatrix4(root.current.matrixWorld)
        .applyMatrix4(camera.matrixWorldInverse);
      data.depths[i] = data.point.z;
    });
    if (config.particleSort)
      data.order.sort((a, b) => data.depths[a] - data.depths[b]);
    else for (let i = 0; i < data.order.length; i += 1) data.order[i] = i;
    data.order.forEach((index, slot) => {
      const age = data.ages[index];
      const seed = data.seeds[index];
      const { dummy } = data;
      dummy.position.fromArray(data.positions, index * 3);
      if (config.particleBillboard) dummy.quaternion.copy(camera.quaternion);
      else dummy.quaternion.identity();
      data.spin.setFromAxisAngle(
        data.axis,
        seed[1] + (leaf ? t * (seed[3] - 0.5) : 0)
      );
      dummy.quaternion.multiply(data.spin);
      const size =
        config.particleSize *
        (leaf ? 0.8 : 0.35 + age * 1.2) *
        (0.6 + seed[4] * 0.8);
      dummy.scale.set(size, size * (leaf ? 1.4 : 1), size);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(slot, dummy.matrix);
      data.geometry.attributes.particleAlpha.setX(
        slot,
        Math.sin(age * Math.PI) ** 0.65
      );
      data.tint.setRGB(
        0.8 + seed[2] * 0.2,
        0.8 + seed[3] * 0.2,
        0.85 + seed[4] * 0.15
      );
      data.geometry.attributes.particleTint.setXYZ(
        slot,
        data.tint.r,
        data.tint.g,
        data.tint.b
      );
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    data.geometry.attributes.particleAlpha.needsUpdate = true;
    data.geometry.attributes.particleTint.needsUpdate = true;
  });
  return (
    <group ref={root}>
      <instancedMesh
        ref={mesh}
        args={[data.geometry, data.material, config.particleCount]}
        frustumCulled={false}
      />
      {config.particleOccluder && (
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.85, 24, 16]} />
          <meshStandardMaterial
            color="#a79b90"
            roughness={0.75}
            colorWrite={mode !== 'treatment'}
          />
        </mesh>
      )}
    </group>
  );
}
const Sample = memo(ParticleSample);
function ParticleStudy({ config, ...props }) {
  return (
    <Comparison
      config={config}
      sourceLabel="Plain particle stamps"
      treatmentLabel={`p5.brush ${config.particleKind}`}
    >
      {(mode, time) => (
        <Sample config={config} {...props} mode={mode} time={time} />
      )}
    </Comparison>
  );
}
export default memo(ParticleStudy);
