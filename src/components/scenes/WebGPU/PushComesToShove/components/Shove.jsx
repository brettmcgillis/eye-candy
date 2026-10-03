import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { createShoveRig } from '@modules/pushComesToShoveRender';

function Shove({ config }) {
  const gl = useThree((state) => state.gl);
  const configRef = useRef(config);
  configRef.current = config;

  const rig = useMemo(createShoveRig, []);

  useEffect(() => {
    rig.apply(config);
  }, [config, rig]);

  useEffect(() => () => rig.dispose(), [rig]);

  useFrame((_, delta) => {
    rig.step(gl, configRef.current, delta);
  });

  return <primitive object={rig.group} />;
}

export default memo(Shove);
