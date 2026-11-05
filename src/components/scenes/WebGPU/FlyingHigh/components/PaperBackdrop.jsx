import { memo, useEffect, useLayoutEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import {
  float,
  mix,
  mx_noise_float as mxNoise,
  screenCoordinate,
  screenUV,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import useBakedTexture from '../hooks/useBakedTexture';

const TILE = 1024;

const noise = (p) => mxNoise(vec3(p, 0));

// Cold-press paper tooth with a few long fibres, mirrored so it tiles.
function createToothMaterial() {
  const p = uv();
  const tooth = noise(p.mul(300))
    .mul(0.5)
    .add(noise(p.mul(110)).mul(0.3))
    .add(noise(p.mul(vec2(30, 700))).mul(0.2));
  return new THREE.MeshBasicNodeMaterial({
    blending: THREE.NoBlending,
    colorNode: vec3(tooth),
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

// The scene's background as watercolour paper: the backdrop colour with a
// screen-space tooth and a faint warm-to-cool drift across the sheet.
function PaperBackdrop({ color, grain, warmth }) {
  const scene = useThree((state) => state.scene);
  const tooth = useMemo(createToothMaterial, []);
  useEffect(() => () => tooth.dispose(), [tooth]);
  const baked = useBakedTexture(
    tooth,
    [TILE, TILE],
    'paper',
    THREE.MirroredRepeatWrapping
  );
  const u = useMemo(
    () => ({
      color: uniform(new THREE.Color()),
      grain: uniform(0),
      warmth: uniform(0),
    }),
    []
  );
  const node = useMemo(() => {
    const grainAt = texture(baked, screenCoordinate.div(TILE)).r;
    const drift = smoothstep(0.1, 1.2, screenUV.sub(vec2(0.1, 0)).length());
    const tint = mix(vec3(1.03, 0.99, 0.96), vec3(0.98, 1, 1.02), drift);
    const paper = u.color
      .mul(mix(vec3(1), tint, u.warmth))
      .mul(float(1).add(grainAt.mul(u.grain)));
    return vec4(paper, 1);
  }, [baked, u]);

  u.color.value.set(color);
  u.grain.value = grain;
  u.warmth.value = warmth;

  useLayoutEffect(() => {
    scene.backgroundNode = node;
    return () => {
      scene.backgroundNode = null;
    };
  }, [node, scene]);

  return null;
}

export default memo(PaperBackdrop);
