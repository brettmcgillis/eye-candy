import { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

import { applyPose, samplePosedHands } from '../utils/posedHands';

export const DEMOGRAPHIC_MODELS = {
  child: 'child-praying-hands.glb',
  female: 'female-praying-hands.glb',
  male: 'male-praying-hands.glb',
};

export const DEFAULT_DEMOGRAPHIC = 'female';

Object.values(DEMOGRAPHIC_MODELS).forEach((fileName) => {
  useGLTF.preload(modelFile(fileName));
});

export default function usePosedHands(demographic, pose) {
  const { scene, animations } = useGLTF(
    modelFile(
      DEMOGRAPHIC_MODELS[demographic] || DEMOGRAPHIC_MODELS[DEFAULT_DEMOGRAPHIC]
    )
  );

  return useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    applyPose(
      clone,
      animations.find((clip) => clip.name === pose) || animations[0]
    );
    return { clone, ...samplePosedHands(clone) };
  }, [animations, pose, scene]);
}
