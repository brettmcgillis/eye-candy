import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  color,
  float,
  instanceIndex,
  mix,
  uniformArray,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  Grass,
  createGrassUniforms,
  scatterRejection,
  setGrassUniforms,
} from '@elements/Grass';
import { createPaintState } from '@modules/paintedRender';

import grazeSites from './grazeSites';

const MUZZLE_BONE = 'Nose_011';
const BLADES_PER_MOUND = 110;
const SITES = {
  boneName: 'Nose_end_049',
  merge: 0.02,
  minSamples: 8,
  reach: 0.045,
  step: 1 / 30,
};

const start = new THREE.Vector3();
const end = new THREE.Vector3();

// The muzzle as one capsule, in the grass mesh's own frame, for the blades
// to lean away from while he eats.
function createMuzzlePress(probe, capsules) {
  const { radius, tip } = capsules.find((c) => c.bone === MUZZLE_BONE);
  const points = [new THREE.Vector4(0, -100, 0, 0), new THREE.Vector4()];
  return {
    bone: probe.liveMesh.skeleton.getBoneByName(MUZZLE_BONE),
    count: 1,
    node: uniformArray(points, 'vec4'),
    points,
    radius,
    tip,
  };
}

function GrazeGrass({
  capsules,
  paintConfig,
  floorY,
  handles = null,
  height,
  probe,
  push,
  rootColor,
  tipColor,
  wind,
}) {
  const sites = useMemo(
    () => grazeSites(probe, { ...SITES, floorY }),
    [floorY, probe]
  );
  const center = useMemo(
    () => ({
      x: sites.reduce((sum, s) => sum + s.x, 0) / sites.length,
      z: sites.reduce((sum, s) => sum + s.z, 0) / sites.length,
    }),
    [sites]
  );
  const count = sites.length * BLADES_PER_MOUND;

  const pressers = useMemo(
    () => createMuzzlePress(probe, capsules),
    [capsules, probe]
  );
  const painting = useMemo(createPaintState, []);
  useEffect(() => {
    painting.apply(paintConfig);
  }, [painting, paintConfig]);
  useEffect(() => () => painting.dispose(), [painting]);
  const material = useMemo(
    () => ({
      blade: 'straight',
      pressers,
      materialTransform(nodeMaterial, frame) {
        const active = painting.u.style.greaterThan(0.5);
        const seed = frame.data.x.mul(19.1).sin().mul(743).fract();
        const point = vec2(
          frame.worldX.mul(8).add(uv().x),
          frame.t.mul(2).add(frame.worldZ.mul(8))
        );
        const wash = painting.treat(
          painting.colorFor(nodeMaterial.colorNode, 0),
          point,
          {
            seed: instanceIndex.toVarying().add(2000000),
            edge: float(0),
          }
        );
        const line = seed.greaterThan(0.55);
        const ink = mix(
          mix(
            color('#385044'),
            painting.inkFor(painting.colorFor(nodeMaterial.colorNode, 0)),
            painting.u.followPalette
          ),
          wash,
          0.3
        );
        const colorNode = active.select(
          line.select(ink, wash),
          nodeMaterial.colorNode
        );
        Object.assign(nodeMaterial, {
          colorNode,
          emissiveNode: colorNode.mul(active.select(0.6, 0)),
          maskNode: active
            .and(line)
            .select(uv().x.sub(0.5).abs().lessThan(0.16), true),
        });
        return nodeMaterial;
      },
    }),
    [painting, pressers]
  );

  useFrame(() => {
    const { bone, points, radius, tip } = pressers;
    bone.getWorldPosition(start);
    bone.localToWorld(end.copy(tip));
    points[0].set(
      start.x - center.x,
      start.y - floorY,
      start.z - center.z,
      radius
    );
    points[1].set(end.x - center.x, end.y - floorY, end.z - center.z, 0);
  });

  const uniforms = useMemo(() => createGrassUniforms({ windScale: 6 }), []);
  useEffect(() => {
    setGrassUniforms(uniforms, {
      bladeHeight: height,
      bladeWidth: height * 0.09,
      pressReach: push,
      rootColor,
      tipColor,
      windStrength: wind,
    });
  }, [height, push, rootColor, tipColor, uniforms, wind]);

  const scatter = useCallback(
    (store) =>
      scatterRejection(store, {
        clumpPull: 0.15,
        clumpSize: 0.012,
        count,
        half: Math.max(
          ...sites.map(
            (s) =>
              Math.max(Math.abs(s.x - center.x), Math.abs(s.z - center.z)) +
              s.radius
          )
        ),
        sample: (x, z) => {
          const wx = x + center.x;
          const wz = z + center.z;
          const site = sites.find(
            (s) => Math.hypot(wx - s.x, wz - s.z) < s.radius
          );
          if (!site) return null;
          const t = Math.hypot(wx - site.x, wz - site.z) / site.radius;
          return { height: 0, scale: (1 - t * t) ** 0.6 };
        },
        seed: 29,
      }),
    [center, count, sites]
  );

  const meshRef = useCallback(
    (mesh) => {
      if (!handles) return;
      // eslint-disable-next-line no-param-reassign
      handles.grass = mesh ? { mesh, pressers, uniforms } : null;
    },
    [handles, pressers, uniforms]
  );

  return (
    <Grass
      material={material}
      maxCount={count}
      position={[center.x, floorY, center.z]}
      receiveShadow
      ref={meshRef}
      scatter={scatter}
      uniforms={uniforms}
    />
  );
}

export default memo(GrazeGrass);
