import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { configFrom } from '@modules/argyle';
import { createRig } from '@modules/argyleRender';

function Pattern({ config }) {
  const rig = useMemo(createRig, []);
  const elapsed = useRef(0);
  const generationKey = JSON.stringify(configFrom(config));
  useEffect(() => {
    const next = JSON.parse(generationKey);
    if (next.source === 'automaton') elapsed.current = 0;
    rig.apply(next);
  }, [generationKey, rig]);
  useEffect(() => () => rig.dispose(), [rig]);
  useFrame((state, delta) => {
    elapsed.current += delta;
    rig.update(elapsed.current, state.camera);
  });
  return <primitive object={rig.group} dispose={null} />;
}
export default memo(Pattern);
