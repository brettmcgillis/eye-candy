import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { SOURCE_IMAGE_MAX } from '@modules/isoLines';
import { createReliefRig } from '@modules/isoLinesReliefRender';
import { useWebcamFrame } from '@modules/webcam';

import useSourceImage from '../hooks/useSourceImage';
import createDriver from '../utils/createDriver';
import createReliefClient from '../utils/createReliefClient';

function Relief({ config }) {
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

  const rig = useMemo(createReliefRig, []);
  const driver = useMemo(createDriver, []);

  useEffect(() => {
    const client = createReliefClient();
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
    const { build, motion } = driver.step(c, delta, {
      aspect: state.size.width / Math.max(state.size.height, 1),
      image: sourceRef.current,
      replay: c.replayRef.current,
    });
    if (build) {
      rig.setBuild(build);
      rig.setTime(build.time);
    }
    rig.setMotion(motion);
    rig.setPixelRatio(state.viewport.dpr);
  });

  return <primitive object={rig.group} />;
}

export default memo(Relief);
