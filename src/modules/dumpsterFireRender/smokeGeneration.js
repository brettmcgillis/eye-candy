import * as THREE from 'three';

import {
  SCENE_ROOT_POSITION,
  bendSmokePoints,
  catmullRom,
  smokeVisibility,
} from '@modules/dumpsterFire';

import { cloneDumpsterFireAndSmokeSeeds } from './fireAndSmokeAuthoring';
import {
  cloneDumpsterParticleSmokeConfigs,
  cloneDumpsterParticleSmokeSplines,
} from './particleSmokeAuthoring';

const isPlume = (instance) => /smoke/i.test(instance.name ?? '');

const bent = (points, config, scale) => {
  const moved = bendSmokePoints(
    points.map((point) => point.position.toArray()),
    config,
    scale[0]
  );
  return points.map((point, i) => ({
    ...point,
    position: new THREE.Vector3(...moved[i]),
  }));
};

// The authored fire and smoke with a generation applied: the smoke system
// picks which smoke shows (and the particle system's type), and every path —
// fire, plume and particle stream — is redrawn by one field
// (@modules/dumpsterFire's bendSmokePoints), so they move together. Takes
// and returns the scene's smoke state.
export function applySmokeGeneration(
  { fireAndSmokeInstances, particleSmokeConfigs, particleSmokeSplines },
  config
) {
  const shown = smokeVisibility(config.smokeSystem);
  return {
    fireAndSmokeInstances: fireAndSmokeInstances.map((instance) => ({
      ...instance,
      controlPoints: bent(instance.controlPoints, config, instance.scale),
      visible:
        (instance.visible ?? true) && (!isPlume(instance) || shown.plume),
    })),
    particleSmokeConfigs: particleSmokeConfigs.map((smoke) => ({
      ...smoke,
      smokeType: shown.particles ?? smoke.smokeType,
      visible: (smoke.visible ?? true) && shown.particles !== null,
    })),
    particleSmokeSplines: particleSmokeSplines.map((spline) => ({
      ...spline,
      points: bent(spline.points, config, spline.scale),
    })),
  };
}

// The authored dumpster fire and smoke, as the scene starts.
export function authoredSmoke() {
  return {
    fireAndSmokeInstances: cloneDumpsterFireAndSmokeSeeds(),
    particleSmokeConfigs: cloneDumpsterParticleSmokeConfigs(),
    particleSmokeSplines: cloneDumpsterParticleSmokeSplines(),
  };
}

function pathOf({ closed, points, pos, scale, tension, type }, reach) {
  const local = catmullRom(
    points.map((point) => point.position.toArray()),
    { closed, tension, type }
  );
  const scales = points.map((point) => point.scale.x);
  const [gx, gy, gz] = scale;
  const curve = (t) => {
    const [x, y, z] = local(t);
    return [
      SCENE_ROOT_POSITION[0] + pos[0] + x * gx,
      SCENE_ROOT_POSITION[1] + pos[1] + y * gy,
      SCENE_ROOT_POSITION[2] + pos[2] + z * gz,
    ];
  };
  const radius = (t) => {
    const f = t * (scales.length - 1);
    const i = Math.min(Math.floor(f), scales.length - 2);
    const s = scales[i] + (scales[i + 1] - scales[i]) * (f - i);
    return reach * s * gx;
  };
  return { curve, radius };
}

// The visible smoke paths in world space, for framing and the plot's flow
// lines: `{ curve: t → [x, y, z], radius: t → metres }`.
export function smokePaths(smoke) {
  const paths = [];
  smoke.fireAndSmokeInstances
    .filter((instance) => isPlume(instance) && instance.visible !== false)
    .forEach((instance) =>
      paths.push(
        pathOf(
          {
            closed: instance.config.closed,
            points: instance.controlPoints,
            pos: instance.pos,
            scale: instance.scale,
            type: 'centripetal',
          },
          0.22
        )
      )
    );
  smoke.particleSmokeSplines.forEach((spline, i) => {
    const smokeConfig = smoke.particleSmokeConfigs[i] ?? {};
    if (smokeConfig.visible === false) return;
    paths.push(
      pathOf(
        {
          closed: smokeConfig.closed,
          points: spline.points,
          pos: spline.pos,
          scale: spline.scale,
          tension: smokeConfig.tension,
          type: 'catmullrom',
        },
        0.32
      )
    );
  });
  return paths;
}

// Each path cut back to where the smoke shows: `end` is the farthest point
// along it with burning smoke (`points`, world) within reach of the tube.
export function trimPaths(paths, points, samples = 80) {
  if (!points.length) return paths;
  return paths.map((path) => {
    let end = 0;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const [cx, cy, cz] = path.curve(t);
      const reach = (path.radius(t) + 0.6) ** 2;
      const near = points.some(
        ([x, y, z]) => (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 < reach
      );
      if (near) end = t;
    }
    return { ...path, end: Math.max(end, 0.1) };
  });
}

// Every smoke path sampled, for fitting a camera round the plume.
export const smokePoints = (paths, samples = 24) =>
  paths.flatMap(({ curve, radius }) =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const t = i / samples;
      const [x, y, z] = curve(t);
      const r = radius(t);
      return [
        [x - r, y - r, z - r],
        [x + r, y + r, z + r],
      ];
    }).flat()
  );
