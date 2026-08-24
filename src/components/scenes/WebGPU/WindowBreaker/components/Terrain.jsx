import React, { memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { HeightfieldCollider, RigidBody } from '@react-three/rapier';

import { NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three';
import {
  attribute,
  clamp,
  mix,
  mx_noise_float,
  normalMap,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

import {
  buildColliderHeights,
  groundHeightAt,
  mossMaskAt,
  toHeightConfig,
} from '../utils/heightField';
import {
  COLLIDER_SEGMENTS,
  GROUND_SIZE,
  TERRAIN_SEGMENTS,
} from '../utils/sceneLayout';

const SOIL_PREFIX = 'windowBreaker/Ground103_1K-JPG_';
const MOSS_PREFIX = 'windowBreaker/Moss002_1K-JPG_';

function configureTexture(tex, srgb) {
  const next = tex;
  next.wrapS = RepeatWrapping;
  next.wrapT = RepeatWrapping;
  next.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  next.anisotropy = 8;
  return next;
}

function Terrain({ terrain, colliderRef }) {
  const soil = useTexture({
    map: textureFile(`${SOIL_PREFIX}Color.jpg`),
    normal: textureFile(`${SOIL_PREFIX}NormalGL.jpg`),
    rough: textureFile(`${SOIL_PREFIX}Roughness.jpg`),
    ao: textureFile(`${SOIL_PREFIX}AmbientOcclusion.jpg`),
  });
  const moss = useTexture({
    map: textureFile(`${MOSS_PREFIX}Color.jpg`),
    normal: textureFile(`${MOSS_PREFIX}NormalGL.jpg`),
    rough: textureFile(`${MOSS_PREFIX}Roughness.jpg`),
    ao: textureFile(`${MOSS_PREFIX}AmbientOcclusion.jpg`),
  });

  const heightCfg = useMemo(() => toHeightConfig(terrain), [terrain]);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(
      GROUND_SIZE,
      GROUND_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    g.rotateX(-Math.PI / 2);

    const { position } = g.attributes;
    const mossMask = new Float32Array(position.count);
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      position.setY(i, groundHeightAt(x, z, heightCfg));
      mossMask[i] = mossMaskAt(x, z, heightCfg);
    }
    position.needsUpdate = true;
    g.setAttribute('aMoss', new THREE.BufferAttribute(mossMask, 1));
    g.computeVertexNormals();
    return g;
  }, [heightCfg]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const colliderHeights = useMemo(
    () => Array.from(buildColliderHeights(heightCfg)),
    [heightCfg]
  );

  const { material, u } = useMemo(() => {
    configureTexture(soil.map, true);
    configureTexture(soil.normal, false);
    configureTexture(soil.rough, false);
    configureTexture(soil.ao, false);
    configureTexture(moss.map, true);
    configureTexture(moss.normal, false);
    configureTexture(moss.rough, false);
    configureTexture(moss.ao, false);

    const uniforms = {
      soilScale: uniform(0.35),
      soilColor: uniform(new THREE.Color('#ffffff')),
      soilNormal: uniform(1),
      mossScale: uniform(0.35),
      mossColor: uniform(new THREE.Color('#ffffff')),
      mossRough: uniform(1),
      mossAo: uniform(1),
      varScale: uniform(0.08),
      varAmount: uniform(0.28),
      moisture: uniform(0),
      moistScale: uniform(0.18),
      moistEdge: uniform(0.12),
      wetDarken: uniform(0.5),
      wetRoughness: uniform(0.35),
    };

    const aMoss = attribute('aMoss', 'float');
    const worldUV = vec2(positionWorld.x, positionWorld.z);
    const soilUV = worldUV.mul(uniforms.soilScale);
    const mossUV = worldUV.mul(uniforms.mossScale);

    const tone = mx_noise_float(vec3(worldUV.mul(uniforms.varScale), 0.0))
      .mul(0.5)
      .add(0.5);
    const toneTint = mix(
      uniforms.varAmount.oneMinus(),
      uniforms.varAmount.add(1),
      tone
    );
    const wetN = mx_noise_float(vec3(worldUV.mul(uniforms.moistScale), 7.3))
      .mul(0.5)
      .add(0.5);
    const wetThreshold = mix(
      uniforms.moistEdge.add(1),
      uniforms.moistEdge.negate(),
      uniforms.moisture
    );
    const wet = smoothstep(
      wetThreshold.sub(uniforms.moistEdge),
      wetThreshold.add(uniforms.moistEdge),
      wetN
    );

    const soilAlbedo = texture(soil.map, soilUV)
      .rgb.mul(toneTint)
      .mul(mix(1.0, uniforms.wetDarken, wet))
      .mul(uniforms.soilColor);
    const mossAoTerm = mix(1.0, texture(moss.ao, mossUV).r, uniforms.mossAo);
    const mossAlbedo = texture(moss.map, mossUV)
      .rgb.mul(uniforms.mossColor)
      .mul(mossAoTerm);

    const soilRough = clamp(texture(soil.rough, soilUV).r, 0.04, 1.0);
    const wetted = mix(soilRough, uniforms.wetRoughness, wet);
    const mossRoughness = clamp(
      texture(moss.rough, mossUV).r.mul(uniforms.mossRough),
      0.04,
      1.0
    );

    const soilN = normalMap(texture(soil.normal, soilUV), uniforms.soilNormal);
    const mossN = normalMap(texture(moss.normal, mossUV));

    const m = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
    m.colorNode = mix(soilAlbedo, mossAlbedo, aMoss);
    m.roughnessNode = mix(wetted, mossRoughness, aMoss);
    m.normalNode = mix(soilN, mossN, aMoss);

    return { material: m, u: uniforms };
  }, [soil, moss]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    u.soilScale.value = terrain.soilTextureScale;
    u.soilColor.value.set(terrain.soilColor);
    u.soilNormal.value = terrain.soilNormalScale;
    u.mossScale.value = terrain.mossTextureScale;
    u.mossColor.value.set(terrain.mossColor);
    u.mossRough.value = terrain.mossRoughness;
    u.mossAo.value = terrain.mossAoStrength;
    u.varScale.value = terrain.varScale;
    u.varAmount.value = terrain.varAmount;
    u.moisture.value = terrain.moisture;
    u.moistScale.value = terrain.moistScale;
    u.moistEdge.value = terrain.moistEdge;
    u.wetDarken.value = terrain.wetDarken;
    u.wetRoughness.value = terrain.wetRoughness;
  }, [terrain, u]);

  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh
        ref={colliderRef}
        geometry={geometry}
        material={material}
        receiveShadow
        castShadow
      />
      <HeightfieldCollider
        args={[
          COLLIDER_SEGMENTS,
          COLLIDER_SEGMENTS,
          colliderHeights,
          { x: GROUND_SIZE, y: 1, z: GROUND_SIZE },
        ]}
        friction={1.1}
        restitution={0.05}
      />
    </RigidBody>
  );
}

export default memo(Terrain);
