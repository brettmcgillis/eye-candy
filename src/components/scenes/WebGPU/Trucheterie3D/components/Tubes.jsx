import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { MESH_KEYS, TUBE_KEYS } from '@modules/trucheterie3d';
import { createTubeRig } from '@modules/trucheterie3dRender';

import createDriver from '../utils/createDriver';
import createTubeClient from '../utils/createTubeClient';

function Tubes({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const configRef = useRef(config);
  configRef.current = config;

  const rig = useMemo(createTubeRig, []);
  const driver = useMemo(createDriver, []);
  const client = useMemo(
    () =>
      createTubeClient(({ field, membrane, mesh, tubes }) =>
        rig.setTubes({
          config: configRef.current,
          field,
          membrane,
          mesh,
          tubes,
        })
      ),
    [rig]
  );

  const tubeKey = [...TUBE_KEYS, ...MESH_KEYS]
    .map((key) => config[key])
    .join('|');
  useEffect(() => {
    client.build(configRef.current);
  }, [client, tubeKey]);

  useEffect(() => {
    rig.apply(config);
    rig.updateEnvironment(gl, scene, config);
  }, [config, gl, rig, scene]);

  useEffect(
    () => () => {
      client.dispose();
      scene.environment = null;
      rig.dispose();
    },
    [client, rig, scene]
  );

  useFrame((_, delta) => {
    driver.step(configRef.current, delta, rig, gl);
  });

  return <primitive object={rig.group} />;
}

export default memo(Tubes);
