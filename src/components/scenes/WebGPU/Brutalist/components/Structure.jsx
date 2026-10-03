import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Tree } from '@dgreenheck/ez-tree';
import { useFrame, useThree } from '@react-three/fiber';

import {
  FORM_KEYS,
  SITE_KEYS,
  buildStructure,
  scatterTrees,
} from '@modules/brutalist';
import { createBrutalistRig } from '@modules/brutalistRender';

const keyOf = (config, keys) => keys.map((key) => config[key]).join('|');

function Structure({ config }) {
  const scene = useThree((state) => state.scene);
  const configRef = useRef(config);
  configRef.current = config;

  const rig = useMemo(() => createBrutalistRig({ Tree, stage: 'forest' }), []);
  const formKey = keyOf(config, FORM_KEYS);
  const siteKey = keyOf(config, SITE_KEYS);
  const structure = useMemo(() => buildStructure(configRef.current), [formKey]);
  const site = useMemo(
    () => scatterTrees(configRef.current, structure),
    [siteKey, structure]
  );

  useEffect(() => rig.apply(config), [config, rig]);
  useEffect(
    () => rig.setStructure(structure, configRef.current),
    [rig, structure]
  );
  useEffect(() => rig.setSite(site, configRef.current), [rig, site]);

  useEffect(() => {
    rig.attach(scene);
    return () => {
      rig.detach(scene);
      rig.dispose();
    };
  }, [rig, scene]);

  useFrame((state) => rig.setPhase(state.clock.elapsedTime));

  return <primitive object={rig.group} />;
}

export default memo(Structure);
