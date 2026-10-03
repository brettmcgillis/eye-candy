import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { SOURCE_IMAGE_MAX } from '@modules/networkTest';
import { createNetworkRig, getPaletteStops } from '@modules/networkTestRender';
import { useWebcamFrame } from '@modules/webcam';

import useSourceImage from '../hooks/useSourceImage';
import createDriver from '../utils/createDriver';
import createNetworkClient from '../utils/createNetworkClient';

const reseed = () => ({
  pointSeed: Math.floor(Math.random() * 10000),
  wireSeed: Math.floor(Math.random() * 10000),
});

function Network({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const webcam = useWebcamFrame(config.webcam, {
    facing: config.webcamFacing,
    maxSize: SOURCE_IMAGE_MAX,
    rate: config.webcamRate,
  });
  const file = useSourceImage(config.sourceUpload ?? config.sourceImage);
  const sourceRef = useRef(null);
  sourceRef.current = config.webcam ? webcam : file;

  const rig = useMemo(createNetworkRig, []);
  const driver = useMemo(createDriver, []);
  const stops = useMemo(
    () => getPaletteStops(config.paletteName),
    [config.paletteName]
  );

  useEffect(() => {
    const client = createNetworkClient();
    driver.attach(client);
    return () => {
      driver.attach(null);
      client.dispose();
    };
  }, [driver]);

  useEffect(() => {
    rig.apply(config);
  }, [config, rig]);

  useEffect(() => () => rig.dispose(), [rig]);

  useFrame((state, delta) => {
    const c = configRef.current;
    const instances = driver.step(c, delta, {
      onReseed: () => c.setControlsRef.current?.(reseed()),
      replay: c.growReplayRef.current,
      source: sourceRef.current,
      stops,
    });
    const range = driver.depthRange(state.camera);
    if (range) rig.setDepthRange(...range);
    if (instances) rig.setInstances(instances);
  });

  return <primitive object={rig.group} />;
}

export default memo(Network);
