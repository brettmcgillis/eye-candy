/* eslint-disable no-underscore-dangle */
import { SkeletonUtils } from 'three-stdlib';

import React, { useEffect } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function HummingBird({ clip, timeScale = 1, ...props }) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('hummingbird.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (!clip) return undefined;
    const action = actions[clip] ?? Object.values(actions)[0];
    if (!action) return undefined;
    action.reset().play();
    return () => action.stop();
  }, [actions, clip]);

  useEffect(() => {
    mixer.timeScale = timeScale;
  }, [mixer, timeScale]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="RootNode" scale={17.754}>
          <group
            name="Bird"
            position={[-2.255, 2.158, -4.582]}
            rotation={[-1.585, 0.195, 1.709]}
          >
            <group name="Object_5">
              <primitive object={nodes._rootJoint} />
              <skinnedMesh
                name="Object_721"
                geometry={nodes.Object_721.geometry}
                material={materials.Hummingbird_eyes}
                skeleton={nodes.Object_721.skeleton}
              />
              <skinnedMesh
                name="Object_722"
                geometry={nodes.Object_722.geometry}
                material={materials.Hummingbird_eyelens}
                skeleton={nodes.Object_722.skeleton}
              />
              <skinnedMesh
                name="Object_723"
                geometry={nodes.Object_723.geometry}
                material={materials.Hummingbird_eyelids}
                skeleton={nodes.Object_723.skeleton}
              />
              <skinnedMesh
                name="Object_725"
                geometry={nodes.Object_725.geometry}
                material={materials.Hummingbird_feather}
                skeleton={nodes.Object_725.skeleton}
              />
              <skinnedMesh
                name="Object_727"
                geometry={nodes.Object_727.geometry}
                material={materials.Hummingbird_body}
                skeleton={nodes.Object_727.skeleton}
              />
              <skinnedMesh
                name="Object_728"
                geometry={nodes.Object_728.geometry}
                material={materials.Hummingbird_peck}
                skeleton={nodes.Object_728.skeleton}
              />
              <skinnedMesh
                name="Object_729"
                geometry={nodes.Object_729.geometry}
                material={materials.Hummingbird_leg}
                skeleton={nodes.Object_729.skeleton}
              />
              <skinnedMesh
                name="Object_730"
                geometry={nodes.Object_730.geometry}
                material={materials.Hummingbird_tongue}
                skeleton={nodes.Object_730.skeleton}
              />
              <skinnedMesh
                name="Object_732"
                geometry={nodes.Object_732.geometry}
                material={materials.Hummingbird_feather}
                skeleton={nodes.Object_732.skeleton}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('hummingbird.glb'));
