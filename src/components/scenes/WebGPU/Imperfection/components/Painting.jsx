import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';
import { createPaintRig } from '@modules/imperfectionRender';

import useSourceFrame from '../hooks/useSourceFrame';

const MAX_DELTA = 1 / 15;

function Painting({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const clock = useRef(0);

  useRenderScale(config.renderScale);

  const rig = useMemo(createPaintRig, []);

  useEffect(() => () => rig.dispose(), [rig]);

  const source = useSourceFrame(config);
  useEffect(() => {
    rig.setSource(source);
  }, [rig, source]);

  useFrame((_, delta) => {
    const c = configRef.current;
    if (c.playing) clock.current += Math.min(delta, MAX_DELTA) * c.motionSpeed;
    rig.apply(c, { time: clock.current, view: c.sceneView });
  });

  return <primitive object={rig.mesh} />;
}

export default memo(Painting);
