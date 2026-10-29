import React, { memo, useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { createPaperRig } from '@modules/paperCutsRender';
import { textureFile } from '@utils/appUtils';

function Relief({ frame, config }) {
  const rig = useMemo(createPaperRig, []);
  const texture = useTexture(textureFile('watercolor.png'));
  useEffect(() => {
    rig.apply(frame, config, texture);
  }, [rig, frame, config, texture]);
  useEffect(() => () => rig.dispose(), [rig]);
  useFrame(({ clock }) => rig.animate(clock.getElapsedTime()));
  return <primitive object={rig.group} dispose={null} />;
}
export default memo(Relief);
useTexture.preload(textureFile('watercolor.png'));
