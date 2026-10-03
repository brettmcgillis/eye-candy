import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { FORM_KEYS, buildStructure } from '@modules/brutalist';
import { createBrutalistRig } from '@modules/brutalistRender';

const keyOf = (config, keys) => keys.map((key) => config[key]).join('|');

function Structure({ config }) {
  const scene = useThree((state) => state.scene);
  const configRef = useRef(config);
  configRef.current = config;

  const rig = useMemo(() => createBrutalistRig({ stage: 'maquette' }), []);
  const formKey = keyOf(config, FORM_KEYS);
  const structure = useMemo(() => buildStructure(configRef.current), [formKey]);

  useEffect(() => rig.apply(config), [config, rig]);
  useEffect(
    () => rig.setStructure(structure, configRef.current),
    [rig, structure]
  );

  useEffect(() => {
    rig.attach(scene);
    return () => {
      rig.detach(scene);
      rig.dispose();
    };
  }, [rig, scene]);

  return <primitive object={rig.group} />;
}

export default memo(Structure);
