import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { SOURCE_IMAGE_MAX } from '@modules/isoLines';
import { createIsoRig } from '@modules/isoLinesRender';
import { useWebcamFrame } from '@modules/webcam';

import useSourceImage from '../hooks/useSourceImage';
import createDriver from '../utils/createDriver';
import createIsoClient from '../utils/createIsoClient';

function Iso({ config }) {
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

  const rig = useMemo(createIsoRig, []);
  const driver = useMemo(createDriver, []);

  useEffect(() => {
    const client = createIsoClient();
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
    const build = driver.step(c, delta, {
      aspect: state.size.width / Math.max(state.size.height, 1),
      image: sourceRef.current,
    });
    if (build) rig.setBuild(build);
    rig.setPixelRatio(state.viewport.dpr);
  });

  return <primitive object={rig.group} />;
}

export default memo(Iso);
