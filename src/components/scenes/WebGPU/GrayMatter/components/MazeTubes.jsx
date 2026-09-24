import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createTubeGeometry } from '@modules/gpuTubes';
import { applySolverConfig } from '@modules/reactionDiffusion';

import useMazeWorker from '../hooks/useMazeWorker';
import useSkullField from '../hooks/useSkullField';
import createMazeTubeMaterial, {
  createMazeUniforms,
  syncMazeUniforms,
} from '../utils/mazeTubeMaterial';
import createFieldReader from '../utils/readFieldAtPoints';

const POINTS = 64;
// Iterations per frame while nothing is on screen, and while a cycle is
// showing and the next maze settles behind it.
const BURST = 32;
const BACKGROUND = 8;

const idle = () => ({ busy: false, iterations: 0 });

// Tubes of reaction diffusion. A maze settles on the skull's surface, its
// worms are traced into tubes, and the colony grows out through that network
// from one point at the skull's base, tube to touching tube. It holds, retracts
// the way it came, and the next maze (settled and traced while this one was
// showing) grows straight away.
function MazeTubes({ config, restartRef }) {
  const renderer = useThree((state) => state.gl);
  const { field, shell, surface } = useSkullField(config);
  const { positions, trace } = useMazeWorker({
    maxEdge: shell.voxelSize,
    surface,
  });
  const read = useMemo(
    () =>
      positions &&
      createFieldReader({
        field: field.fieldTexture,
        positions,
        volume: shell,
      }),
    [field, positions, shell]
  );

  const uniforms = useMemo(createMazeUniforms, []);
  const [tubes, setTubes] = useState(null);
  const nextRef = useRef({ ...idle(), ready: null });
  const clockRef = useRef(0);

  useEffect(() => {
    const restart = () => {
      field.reset(renderer);
      nextRef.current = { ...idle(), ready: null };
      clockRef.current = 0;
      setTubes(null);
    };
    restart();
    // eslint-disable-next-line no-param-reassign
    restartRef.current = restart;
  }, [
    config.diffusionScale,
    config.feedRate,
    config.killRate,
    config.mazeSpacing,
    config.ridgeFloor,
    field,
    read,
    renderer,
    restartRef,
  ]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20) * config.growthSpeed;
    syncMazeUniforms(uniforms, config);

    const next = nextRef.current;
    if (read && !next.ready && !next.busy) {
      if (next.iterations < config.settleIterations) {
        const step = tubes ? BACKGROUND : BURST;
        applySolverConfig(field.uniforms, config);
        field.uniforms.front.value = 1e6;
        field.uniforms.stepScale.value = step;
        field.update(renderer, dt);
        next.iterations += step;
      } else {
        next.busy = true;
        read(renderer)
          .then((strength) =>
            trace(strength, {
              claimRadius: config.mazeSpacing,
              floor: config.ridgeFloor,
              jump: config.mazeSpacing * 2,
              lift: config.bodyRadius,
              pointsPerStrand: POINTS,
            })
          )
          .then((result) => {
            if (nextRef.current === next) {
              next.busy = false;
              next.ready = result;
            }
          });
      }
    }

    const retractAt = config.growDuration + config.holdDuration;
    const end = retractAt + config.witherDuration + config.restDuration;
    if (
      next.ready &&
      (!tubes || (config.growthLoop && clockRef.current > end))
    ) {
      setTubes(next.ready);
      nextRef.current = { ...idle(), ready: null };
      clockRef.current = 0;
      field.reset(renderer);
      return;
    }

    if (!tubes) return;
    clockRef.current += dt;
    const clock = clockRef.current;
    const grown = Math.min(clock / config.growDuration, 1);
    const retract = config.growthLoop
      ? THREE.MathUtils.clamp((clock - retractAt) / config.witherDuration, 0, 1)
      : 0;
    uniforms.front.value = tubes.maxArrival * grown * (1 - retract);
  });

  const mesh = useMemo(() => {
    if (!tubes || tubes.count === 0) return null;
    const attribute = (array) => new THREE.StorageBufferAttribute(array, 4);
    return {
      geometry: createTubeGeometry({
        instanceCount: tubes.count,
        radialSegments: config.radialSegments,
        tubularSegments: POINTS,
      }),
      material: createMazeTubeMaterial({
        frameMode: 'fixed',
        normals: attribute(tubes.normals),
        points: attribute(tubes.points),
        pointsPerStrand: POINTS,
        tubularSegments: POINTS,
        uniforms,
      }),
    };
  }, [config.radialSegments, tubes, uniforms]);

  useEffect(
    () => () => {
      mesh?.geometry.dispose();
      mesh?.material.dispose();
    },
    [mesh]
  );

  if (!mesh) return null;
  return (
    <mesh
      castShadow
      frustumCulled={false}
      geometry={mesh.geometry}
      material={mesh.material}
      receiveShadow
    />
  );
}

export default memo(MazeTubes);
