import React, { memo } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import useSceneBackdrop from '@hooks/useSceneBackdrop';

import useFlatToneMapping from '../hooks/useFlatToneMapping';
import { WORLD_HEIGHT } from '../hooks/useStage';

function Stage({ backgroundColor, children }) {
  const height = useThree((state) => state.size.height);

  useFlatToneMapping();
  useSceneBackdrop({ color: backgroundColor });

  return (
    <>
      <OrthographicCamera
        far={50}
        makeDefault
        near={0.1}
        position={[0, 0, 10]}
        zoom={height / WORLD_HEIGHT}
      />
      {children}
    </>
  );
}

export default memo(Stage);
