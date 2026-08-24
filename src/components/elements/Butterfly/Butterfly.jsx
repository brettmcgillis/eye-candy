import React from 'react';

import { PerspectiveCamera, useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function Butterfly({
  animationOffset = 0,
  animationSpeed = 1,
  ...props
}) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('butterfly.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    const names = Object.keys(actions || {});
    if (!names.length) {
      return undefined;
    }

    const action = actions[names[0]];
    if (!action) {
      return undefined;
    }

    action.enabled = true;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset();
    action.play();
    action.timeScale = animationSpeed;

    if (Number.isFinite(animationOffset) && action.getClip()?.duration > 0) {
      const { duration } = action.getClip();
      action.time = ((animationOffset % duration) + duration) % duration;
    }

    return () => {
      action.stop();
    };
  }, [actions, animationOffset, animationSpeed]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group>
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <PerspectiveCamera
          name="default_camera"
          makeDefault={false}
          far={1092.007}
          near={0.011}
          fov={45.837}
          position={[0.005, 0.006, 0.935]}
        />
        <skinnedMesh
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials.M_BorboletaAzul}
          skeleton={nodes.Object_7.skeleton}
          position={[-0.06, 0, 0]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('butterfly.glb'));
