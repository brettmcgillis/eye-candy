import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { createCubeRig, getPaletteStops } from '@modules/hyperCubesRender';

import createDriver from '../utils/createDriver';

const reseedFor = (c) =>
  c.structure === 'octree'
    ? { octreeSeed: Math.floor(Math.random() * 1000) }
    : { rectSeed: Number(Math.random().toFixed(4)) };

function Cubes({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const configRef = useRef(config);
  configRef.current = config;

  const rig = useMemo(createCubeRig, []);
  const driver = useMemo(createDriver, []);
  const stops = useMemo(
    () => getPaletteStops(config.paletteName),
    [config.paletteName]
  );

  useEffect(() => {
    rig.apply(config);
    rig.updateEnvironment(gl, scene, config);
  }, [config, gl, rig, scene]);

  useEffect(
    () => () => {
      scene.environment = null;
      rig.dispose();
    },
    [rig, scene]
  );

  useFrame((state, delta) => {
    const c = configRef.current;
    const instances = driver.step(c, delta, {
      onReseed: () => c.setControlsRef.current?.(reseedFor(c)),
      replay: c.growReplayRef.current,
      stops,
    });
    if (instances) rig.setInstances(instances);
  });

  return <primitive object={rig.group} />;
}

export default memo(Cubes);
