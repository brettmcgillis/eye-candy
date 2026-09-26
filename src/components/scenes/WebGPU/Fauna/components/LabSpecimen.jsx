import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import createCreatureStore from '../utils/creatureStore';
import CreatureField from './CreatureField';

const FACING = Math.PI / 4;

function LabSpecimen({ body, heroScale, uniforms, visible, skinMode }) {
  const store = useMemo(() => createCreatureStore(1), []);
  const strideRef = useRef(0);

  useEffect(() => () => store.dispose(), [store]);

  useEffect(() => {
    store.clear();

    if (body) store.add(0, body);
  }, [body, store]);

  useFrame((_, delta) => {
    if (!visible || !body) return;

    const pose = store.pose.image.data;
    const motion = store.motion.image.data;

    strideRef.current += Math.min(delta, 0.1) * 2;
    pose[0] = 0;
    pose[1] = body.plan === 'swimmer' ? heroScale * 0.5 : 0;
    pose[2] = 0;
    pose[3] = FACING;
    motion[0] = heroScale;
    motion[1] = strideRef.current;
    motion[2] = 1;
    motion[3] = 0;
    store.pose.needsUpdate = true;
    store.motion.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      <CreatureField skinMode={skinMode} store={store} uniforms={uniforms} />
    </group>
  );
}

export default memo(LabSpecimen);
