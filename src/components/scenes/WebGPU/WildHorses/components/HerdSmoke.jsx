import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import applySmokeConfig from '@elements/SimFire/applySmokeConfig';
import { MAX_PATHS, createCurlSmoke } from '@modules/curlSmoke';

// Where each stream leaves the horse, as a bone and its rest position in
// unscaled horse units (the path origin, so a bobbing horse bends the thread
// near the body instead of dragging the whole plume).
const SOURCES = {
  mane: { bone: 2, rest: [0, 1.34, -0.67] },
  tail: { bone: 1, rest: [0, 1.11, 0.93] },
};

const eye = new THREE.Vector3();
const at = new THREE.Vector3();
const FAR_AWAY = [0, -1e4, 0];
// A full bitonic sort is ~90 dispatches; the soft plume hides a few stale frames.
const SORT_EVERY = 4;

// Two horses get a mane and a tail stream each; past that the paths run out
// and each horse keeps its mane stream.
function streamsFor(count) {
  const kinds = count * 2 <= MAX_PATHS ? ['mane', 'tail'] : ['mane'];
  return Array.from({ length: Math.min(count, MAX_PATHS) }, (_, index) =>
    kinds.map((kind) => ({ index, kind }))
  )
    .flat()
    .slice(0, MAX_PATHS);
}

// One sorted curl-smoke stream per mane/tail, each path drawn every frame
// from its bone straight back along the run wind and climbing, so the smoke
// is left behind the herd the way the field is.
function HerdSmoke({
  bonesRef,
  dayNight,
  fire,
  members,
  scale,
  smoke,
  trailLength,
  trailLift,
  windSpeed,
}) {
  const gl = useThree((state) => state.gl);
  const frame = useRef(0);
  const instance = useMemo(
    () => createCurlSmoke({ count: smoke.count }),
    [smoke.count]
  );
  useEffect(() => () => instance.dispose(), [instance]);

  const streams = useMemo(() => streamsFor(members.length), [members.length]);
  const direction = Math.sign(windSpeed) || 1;

  applySmokeConfig(instance, {
    ...smoke,
    rise: Math.max(Math.abs(windSpeed), 0.3),
  });

  useFrame((state, delta) => {
    const u = instance.uniforms;
    const paths = [];
    const glow = [];

    streams.forEach(({ index, kind }) => {
      const bones = bonesRef.current[index];
      const member = members[index];
      if (!bones || !member) return;

      const s = scale * member.scale;
      const source = SOURCES[kind];
      const lift = kind === 'mane' ? fire.maneLift * s : 0;
      const origin = [
        member.position[0] + source.rest[0] * s,
        member.position[1] + source.rest[1] * s + lift,
        member.position[2] + source.rest[2] * s,
      ];
      const bone = bones[kind][source.bone];
      if (!bone) return;
      bone.getWorldPosition(at);
      const start = [
        at.x - origin[0],
        at.y + lift - origin[1],
        at.z - origin[2],
      ];
      const length = trailLength * direction;
      paths.push({
        origin,
        points: [
          start,
          [
            start[0],
            start[1] + trailLift * trailLength * 0.25,
            start[2] + length * 0.5,
          ],
          [start[0], start[1] + trailLift * trailLength, start[2] + length],
        ],
      });
      if (glow.length < 2) glow.push([at.x, at.y + lift, at.z]);
    });

    if (!paths.length) return;
    instance.setPaths(paths);
    u.flameTop.value.set(...(glow[0] ?? FAR_AWAY));
    u.flameBottom.value.set(...(glow[1] ?? FAR_AWAY));
    u.color.value
      .set(smoke.color)
      .multiplyScalar(dayNight.lightIntensity.value);

    instance.advance(gl, Math.min(delta, 1 / 15));
    frame.current += 1;
    if (frame.current % SORT_EVERY === 0) {
      instance.sort(gl, state.camera.getWorldPosition(eye));
    }
  });

  return <primitive object={instance.mesh} />;
}

export default memo(HerdSmoke);
