import React, { memo, useEffect, useMemo } from 'react';

import { Fn, positionLocal, positionWorld, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { herdShadow } from '../utils/herdField';
import { blendToOne, fieldHeight, fieldNormal } from '../utils/noiseField';

const SEGMENTS = 125;

function Terrain({ config, dayNight, herd, travelUniform }) {
  const {
    terrainColor,
    terrainExtent,
    terrainLightWrap,
    terrainMaxHeight,
    terrainNoiseScale,
    terrainSeed,
  } = config;

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(
      terrainExtent * 0.8,
      terrainExtent * 0.8,
      SEGMENTS,
      SEGMENTS
    );
    plane.rotateX(-Math.PI / 2);

    return plane;
  }, [terrainExtent]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const { material, uniforms } = useMemo(() => {
    const values = {
      color: uniform(new THREE.Color(terrainColor)),
      lightWrap: uniform(terrainLightWrap),
      maxHeight: uniform(terrainMaxHeight),
      noiseScale: uniform(terrainNoiseScale),
      seed: uniform(terrainSeed),
    };

    // The plane's own uv is already the field uv the grass derives from world
    // space, so both surfaces ride the identical height field.
    const fieldUv = uv();

    const vertex = Fn(() => {
      const displaced = positionLocal.toVar();
      displaced.y.addAssign(
        fieldHeight(fieldUv, values.noiseScale, travelUniform, values.seed).mul(
          values.maxHeight
        )
      );

      return displaced;
    });

    const color = Fn(() => {
      const normal = fieldNormal(
        fieldUv,
        values.noiseScale,
        travelUniform,
        values.seed
      );
      const lambert = blendToOne(
        normal.dot(vec3(1.0).normalize()).max(0.0),
        values.lightWrap
      );

      return values.color
        .mul(lambert)
        .mul(dayNight.lightIntensity)
        .sub(herdShadow(positionWorld, herd));
    });

    const nodeMaterial = new THREE.MeshBasicNodeMaterial();
    nodeMaterial.positionNode = vertex();
    nodeMaterial.colorNode = color();

    return { material: nodeMaterial, uniforms: values };
  }, [dayNight, herd, travelUniform]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.color.value.set(terrainColor);
    uniforms.lightWrap.value = terrainLightWrap;
    uniforms.maxHeight.value = terrainMaxHeight;
    uniforms.noiseScale.value = terrainNoiseScale;
    uniforms.seed.value = terrainSeed;
  }, [
    terrainColor,
    terrainLightWrap,
    terrainMaxHeight,
    terrainNoiseScale,
    terrainSeed,
    uniforms,
  ]);

  return <mesh geometry={geometry} material={material} />;
}

export default memo(Terrain);
