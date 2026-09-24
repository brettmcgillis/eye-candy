import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createTubeGeometry } from '@modules/gpuTubes';

import useSkullGraph from '../hooks/useSkullGraph';
import createGrowthMaterial, {
  createGrowthUniforms,
  syncGrowthUniforms,
} from '../utils/growth/growthMaterial';

// Frames of the growth kept for rewinding, spread over the grow phase.
const RECORDS = 90;
const PLATEAU_WINDOW = 4;
const PLATEAU_GROWTH = 0.01;

const engineSettings = (config) => ({
  growthStep: config.dgGrowthStep,
  maxVertices: config.dgMaxVertices,
  repulsion: config.dgRepulsion,
  shapeRetention: config.dgShapeRetention,
  sideBias: config.dgSideBias,
  smoothing: config.dgSmoothing,
  splitThreshold: config.dgSplitThreshold,
  targetEdgeLength: config.dgEdgeLength,
});

// DifferentialLayers' growth engine running on the skull's outer surface: one
// closed loop starts at the jaw and grows, buckles and folds until it covers
// the skull, drawn as a single lit tube. At the end of the loop the recorded
// timeline plays back to the seed, and a new loop grows.
function DifferentialGrowth({ config, restartRef }) {
  const surface = useSkullGraph(config);

  const outer = useMemo(() => {
    const { graph, reach } = surface;
    const triangles = [];
    for (let t = 0; t < graph.triangles.length; t += 3) {
      const [a, b, c] = graph.triangles.subarray(t, t + 3);
      if (surface.outer[a] && surface.outer[b] && surface.outer[c]) {
        triangles.push(a, b, c);
      }
    }
    let origin = 0;
    let lowest = Infinity;
    for (let v = 0; v < graph.count; v += 1) {
      if (surface.outer[v] && Number.isFinite(reach[v]) && reach[v] < lowest) {
        lowest = reach[v];
        origin = v;
      }
    }
    return {
      normal: Array.from(graph.normals.subarray(origin * 3, origin * 3 + 3)),
      origin: Array.from(graph.positions.subarray(origin * 3, origin * 3 + 3)),
      surface: {
        normals: graph.normals,
        positions: graph.positions,
        triangles: new Int32Array(triangles),
      },
    };
  }, [surface]);

  const buffers = useMemo(
    () => ({
      normals: new THREE.StorageBufferAttribute(
        new Float32Array(config.dgMaxVertices * 4),
        4
      ),
      points: new THREE.StorageBufferAttribute(
        new Float32Array(config.dgMaxVertices * 4),
        4
      ),
    }),
    [config.dgMaxVertices]
  );

  const uniforms = useMemo(createGrowthUniforms, []);
  const tubularSegments = config.dgMaxVertices * 2;
  const geometry = useMemo(
    () =>
      createTubeGeometry({
        instanceCount: 1,
        radialSegments: config.radialSegments,
        tubularSegments,
      }),
    [config.radialSegments, tubularSegments]
  );
  const material = useMemo(
    () =>
      createGrowthMaterial({
        frameMode: 'fixed',
        normals: buffers.normals,
        points: buffers.points,
        tubularSegments,
        uniforms,
      }),
    [buffers, tubularSegments, uniforms]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const workerRef = useRef(null);
  const cycleRef = useRef(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const worker = new Worker(
      new URL('../utils/growth/growth.worker.js', import.meta.url),
      { type: 'module' }
    );
    worker.postMessage({
      surface: {
        ...outer.surface,
        spacing: configRef.current.skullHeight * 0.008,
      },
      type: 'surface',
    });

    let cycleCount = 0;
    const start = () => {
      const c = configRef.current;
      cycleCount += 1;
      worker.postMessage({
        gradientBlur: c.dgGradientBlur,
        normal: outer.normal,
        origin: outer.origin,
        seed: c.dgSeed + cycleCount,
        settings: engineSettings(c),
        type: 'start',
      });
      uniforms.count.value = 0;
      cycleRef.current = {
        busy: false,
        clock: 0,
        recorded: 0,
        shown: -1,
        stage: 'grow',
      };
    };

    worker.onmessage = ({ data }) => {
      const cycle = cycleRef.current;
      if (data.id !== cycle.request) return;
      cycle.busy = false;
      const { count, normals, points } = data.frame;
      buffers.points.array.set(points);
      buffers.normals.array.set(normals);
      buffers.points.needsUpdate = true;
      buffers.normals.needsUpdate = true;
      uniforms.count.value = count;
    };
    worker.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.error(`[GrayMatter] growth worker failed: ${event.message}`);
    };

    workerRef.current = { start, worker };
    start();
    // eslint-disable-next-line no-param-reassign
    restartRef.current = start;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [buffers, outer, restartRef, uniforms]);

  useEffect(() => {
    workerRef.current?.worker.postMessage({
      gradientBlur: config.dgGradientBlur,
      settings: engineSettings(config),
      type: 'settings',
    });
  }, [config]);

  useFrame((_, delta) => {
    const cycle = cycleRef.current;
    const handle = workerRef.current;
    if (!cycle || !handle) return;
    syncGrowthUniforms(uniforms, config);
    const dt = Math.min(delta, 1 / 20) * config.growthSpeed;
    cycle.clock += dt;
    const { growDuration, holdDuration, restDuration, witherDuration } = config;
    const send = (message) => {
      cycle.busy = true;
      cycle.request = (cycle.request ?? 0) + 1;
      handle.worker.postMessage({ ...message, id: cycle.request });
    };

    if (cycle.stage === 'grow') {
      if (!cycle.busy) {
        const record =
          cycle.clock >= (cycle.recorded / RECORDS) * growDuration &&
          cycle.recorded < RECORDS;
        if (record) cycle.recorded += 1;
        // At most one 60fps frame of simulation per step, even when a step
        // took longer: the reference's repulsion is stiff, and bigger steps
        // overshoot and buzz (measured: the average move per step drops 4x).
        // Late growth runs slower than real time instead.
        send({
          dt: Math.min(delta * config.growthSpeed, 1 / 60),
          growthSpeed: config.dgSimSpeed,
          record,
          seedInfluence: config.dgSeedInfluence,
          type: 'step',
        });
      }
      // Past the vertex cap the curve can only compress, at its highest
      // per-step cost, so growth ends there even if the grow phase has not.
      const full = uniforms.count.value >= config.dgMaxVertices;
      // Growth ends once the curve has covered the skull and stopped adding
      // points, however long that took; Grow (s) is only the upper bound.
      if (cycle.clock - (cycle.checkedAt ?? 0) >= PLATEAU_WINDOW) {
        const count = uniforms.count.value;
        cycle.settled =
          cycle.clock > PLATEAU_WINDOW * 2 &&
          count < (cycle.checkedCount ?? 0) * (1 + PLATEAU_GROWTH);
        cycle.checkedAt = cycle.clock;
        cycle.checkedCount = count;
      }
      if (cycle.clock >= growDuration || full || cycle.settled) {
        cycle.stage = config.growthLoop ? 'hold' : 'done';
        cycle.clock = 0;
      }
    } else if (cycle.stage === 'hold' && cycle.clock >= holdDuration) {
      cycle.stage = 'rewind';
      cycle.clock = 0;
    } else if (cycle.stage === 'rewind') {
      const t = Math.min(cycle.clock / witherDuration, 1);
      const index = Math.round((1 - t) * (cycle.recorded - 1));
      if (!cycle.busy && index !== cycle.shown) {
        cycle.shown = index;
        send({ index, type: 'frame' });
      }
      if (t >= 1) {
        cycle.stage = 'rest';
        cycle.clock = 0;
        uniforms.count.value = 0;
      }
    } else if (cycle.stage === 'rest' && cycle.clock >= restDuration) {
      handle.start();
    }
  });

  return (
    <mesh
      castShadow
      frustumCulled={false}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
}

export default memo(DifferentialGrowth);
