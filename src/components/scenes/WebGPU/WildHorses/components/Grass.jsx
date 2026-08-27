import React, { memo, useEffect, useMemo } from 'react';

import {
  Fn,
  attribute,
  float,
  mod,
  positionLocal,
  positionWorld,
  texture as tslTexture,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { mulberry32 } from '@utils/noise2d';

import useSceneTexture from '../hooks/useSceneTexture';
import createGrassGeometry from '../utils/grassGeometry';
import { herdPush, herdShadow } from '../utils/herdField';
import {
  blendToOne,
  fieldHeight,
  fieldNormal,
  fieldWind,
  terrainUv,
} from '../utils/noiseField';

const GRASS_TEXTURE = 'wildHorses/grass.png';

function rotateXZ(position, angle) {
  const s = angle.sin();
  const c = angle.cos();

  return vec3(
    position.x.mul(c).sub(position.z.mul(s)),
    position.y,
    position.x.mul(s).add(position.z.mul(c))
  );
}

function Grass({ config, dayNight, herd, scrollUniform, travelUniform }) {
  const {
    grassBladeHeight,
    grassBladeWidth,
    grassColorTint,
    grassCount,
    grassEdgeFade,
    grassHeightJitter,
    grassLightWrap,
    grassMinDistance,
    grassSeed,
    grassWindStrength,
    terrainExtent,
    terrainMaxHeight,
    terrainNoiseScale,
    terrainSeed,
  } = config;

  const map = useSceneTexture(GRASS_TEXTURE);

  const geometry = useMemo(() => {
    return createGrassGeometry({
      bladeHeight: grassBladeHeight,
      bladeWidth: grassBladeWidth,
      count: grassCount,
      heightJitter: grassHeightJitter,
      minDistance: grassMinDistance,
      random: mulberry32(grassSeed),
      range: terrainExtent * 0.4,
    });
  }, [
    grassBladeHeight,
    grassBladeWidth,
    grassCount,
    grassHeightJitter,
    grassMinDistance,
    grassSeed,
    terrainExtent,
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const { material, uniforms } = useMemo(() => {
    const values = {
      bladeHeight: uniform(grassBladeHeight),
      edgeFade: uniform(grassEdgeFade),
      lightWrap: uniform(grassLightWrap),
      maxHeight: uniform(terrainMaxHeight),
      noiseScale: uniform(terrainNoiseScale),
      range: uniform(terrainExtent * 0.4),
      seed: uniform(terrainSeed),
      tint: uniform(new THREE.Color(grassColorTint)),
      windStrength: uniform(grassWindStrength),
    };
    const { range } = values;

    const posOffset = attribute('posOffset', 'vec3');
    const extra = attribute('extra', 'vec2');

    const vertex = Fn(() => {
      const scrolled = mod(
        posOffset.z.add(scrollUniform).add(range),
        range.mul(2.0)
      ).sub(range);

      const base = vec3(posOffset.x, float(-0.2), scrolled).toVar();
      const blade = rotateXZ(positionLocal, extra.y).mul(
        vec3(1.0, posOffset.y, 1.0)
      );
      const world = base.add(blade).toVar();

      const uv = terrainUv(world, range);
      world.y.addAssign(
        fieldHeight(uv, values.noiseScale, travelUniform, values.seed).mul(
          values.maxHeight
        )
      );

      const tip = positionLocal.y.div(values.bladeHeight).clamp(0, 1);
      world.xz.addAssign(
        fieldWind(uv, values.noiseScale, travelUniform)
          .mul(tip)
          .mul(values.windStrength)
      );
      world.addAssign(herdPush(base, tip, herd));

      return world;
    });

    const color = Fn(() => {
      const uv = terrainUv(positionWorld, range);
      const normal = fieldNormal(
        uv,
        values.noiseScale,
        travelUniform,
        values.seed
      );
      const lambert = blendToOne(
        normal.dot(vec3(1.0).normalize()).max(0.0),
        values.lightWrap
      );

      return tslTexture(map)
        .rgb.mul(values.tint)
        .mul(lambert)
        .mul(dayNight.lightIntensity)
        .sub(herdShadow(positionWorld, herd));
    });

    // The scrolling field wraps hard at +/- range; fading alpha over the last
    // few units hides the pop as a clump teleports to the far edge.
    const opacity = Fn(() => {
      return tslTexture(map).a.mul(
        positionWorld.z.abs().smoothstep(range, range.sub(values.edgeFade))
      );
    });

    // Alpha-tested, not blended: wolf2 discards below 0.75 rather than fading,
    // and keeping it opaque puts the grass in the opaque bucket where it depth-
    // sorts against the horse for free instead of being sorted as one object.
    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      alphaTest: 0.75,
      side: THREE.DoubleSide,
    });
    nodeMaterial.positionNode = vertex();
    nodeMaterial.colorNode = color();
    nodeMaterial.opacityNode = opacity();

    return { material: nodeMaterial, uniforms: values };
  }, [dayNight, herd, map, scrollUniform, travelUniform]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.bladeHeight.value = grassBladeHeight;
    uniforms.edgeFade.value = grassEdgeFade;
    uniforms.lightWrap.value = grassLightWrap;
    uniforms.maxHeight.value = terrainMaxHeight;
    uniforms.noiseScale.value = terrainNoiseScale;
    uniforms.range.value = terrainExtent * 0.4;
    uniforms.seed.value = terrainSeed;
    uniforms.tint.value.set(grassColorTint);
    uniforms.windStrength.value = grassWindStrength;
  }, [
    grassBladeHeight,
    grassColorTint,
    grassEdgeFade,
    grassLightWrap,
    grassWindStrength,
    terrainExtent,
    terrainMaxHeight,
    terrainNoiseScale,
    terrainSeed,
    uniforms,
  ]);

  return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}

export default memo(Grass);
