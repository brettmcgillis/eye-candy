import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function PoliceCruiser({ showTires = true, ...props }) {
  const { nodes, materials } = useGLTF(modelFile('/policeCruiser.glb'));
  return (
    <group {...props} dispose={null}>
      <group rotation={[-1.57, 0, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group
            position={[-0.241, 1.406, -4]}
            rotation={[-1.571, 0.002, Math.PI]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Fairheaven_LT80_Lightbar_UCB_BOTTOM_GT_0.geometry}
              material={materials.UCB_BOTTOM_GT}
              position={[-0.001, -0.265, -0.04]}
            />
          </group>
          <group
            position={[-0.228, 1.235, -4.288]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Fairheaven_LT80_Copstuff_UCB_BOTTOM_GT_0.geometry}
              material={materials.UCB_BOTTOM_GT}
              position={[0.124, -0.418, 2.178]}
            />
          </group>
          <group
            position={[2.342, 0.472, -3.973]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Fairheaven_LT80_Bullbar_UCB_BOTTOM_GT_0.geometry}
              material={materials.UCB_BOTTOM_GT}
              position={[-0.191, 0.341, 4.75]}
            />
          </group>
          {showTires ? (
            <>
              <group
                position={[1.417, 0.303, -4.737]}
                rotation={[Math.PI, 0, Math.PI]}
                scale={[0.79, 0.79, 0.589]}
              >
                <mesh
                  castShadow
                  receiveShadow
                  geometry={
                    nodes.Fairheaven_LT80_WheelStamp_FL_RB1c_Tire_1k_0.geometry
                  }
                  material={materials.RB1c_Tire_1k}
                  position={[-0.001, 0, 0.179]}
                />
              </group>
              <group
                position={[-1.234, 0.303, -4.737]}
                rotation={[Math.PI, 0, Math.PI]}
                scale={[0.79, 0.79, 0.589]}
              >
                <mesh
                  castShadow
                  receiveShadow
                  geometry={
                    nodes.Fairheaven_LT80_WheelStamp_RL_RB1c_Tire_1k_0.geometry
                  }
                  material={materials.RB1c_Tire_1k}
                  position={[-0.001, 0, 0.179]}
                />
              </group>
              <group
                position={[1.417, 0.303, -3.261]}
                rotation={[0, 0, -Math.PI]}
                scale={[0.79, 0.79, 0.589]}
              >
                <mesh
                  castShadow
                  receiveShadow
                  geometry={
                    nodes.Fairheaven_LT80_WheelStamp_FR_RB1c_Tire_1k_0.geometry
                  }
                  material={materials.RB1c_Tire_1k}
                  position={[-0.001, 0, 0.179]}
                />
              </group>
              <group
                position={[-1.234, 0.303, -3.261]}
                rotation={[0, 0, -Math.PI]}
                scale={[0.79, 0.79, 0.589]}
              >
                <mesh
                  castShadow
                  receiveShadow
                  geometry={
                    nodes.Fairheaven_LT80_WheelStamp_RR_RB1c_Tire_1k_0.geometry
                  }
                  material={materials.RB1c_Tire_1k}
                  position={[-0.001, 0, 0.179]}
                />
              </group>
            </>
          ) : null}
          <group
            position={[-2.383, 0.668, -3.999]}
            rotation={[-1.571, -1.484, -1.571]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Cop_Numberplate_Rear_Numberplates_Misk_U_0
                  .geometry
              }
              material={materials.Numberplates_Misk_U}
              position={[0.492, -0.485, -0.002]}
            />
          </group>
          <group
            position={[2.353, 0.378, -3.411]}
            rotation={[0.918, 1.354, -0.929]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Cop_Numberplate_Front_Numberplates_Misk_U_0
                  .geometry
              }
              material={materials.Numberplates_Misk_U}
              position={[0.492, -0.485, -0.002]}
            />
          </group>
          <group
            position={[-0.24, 1.439, -4]}
            rotation={[-1.571, 0.002, Math.PI]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Lightbar_Glass_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[0, -0.265, -0.073]}
            />
          </group>
          <group
            position={[-0.091, 0.552, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Bottom001_UCB_BOTTOM_GT_0.geometry
              }
              material={materials.UCB_BOTTOM_GT}
              position={[-0.163, 0.265, 2.317]}
            />
          </group>
          <group
            position={[-2.358, 0.653, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Brakelights001_UCB_Lights_and_Glass_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass}
              position={[-0.163, 0.168, 0.007]}
            />
          </group>
          <group
            position={[2.314, 0.441, -4]}
            rotation={[-1.57, -1.569, -1.57]}
            scale={[1.028, 1, 1]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Bumper_Front001_UCB_BOTTOM_GT_0.geometry
              }
              material={materials.UCB_BOTTOM_GT}
              position={[-0.163, 0.39, 4.717]}
            />
          </group>
          <group
            position={[2.173, 0.555, -4]}
            rotation={[-1.571, -1.569, -1.571]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Front_Plate001_Fairheaven_LT80_Bodymat_0
                  .geometry
              }
              material={materials.Fairheaven_LT80_Bodymat}
              position={[-0.163, 0.258, 4.581]}
            />
          </group>
          <group
            position={[2.328, 0.686, -3.817]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Front_Plate_Badges001_Carbadges_misc_U_0
                  .geometry
              }
              material={materials.Carbadges_misc_U}
              position={[-1.633, 1.297, 0.651]}
            />
          </group>
          <group
            position={[2.191, 0.528, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Front_Plate_Inner001_UCB_BOTTOM_GT_0
                  .geometry
              }
              material={materials.UCB_BOTTOM_GT}
              position={[-0.163, 0.285, 4.599]}
            />
          </group>
          <group
            position={[-0.678, 1.067, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Glass_Body001_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[-0.163, -0.249, 1.73]}
            />
          </group>
          <group
            position={[0.156, 1.063, -4.645]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Glass_Driver002_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[0.482, -0.246, 2.563]}
            />
          </group>
          <group
            position={[0.156, 1.063, -3.355]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Glass_Passanger002_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[-0.809, -0.246, 2.563]}
            />
          </group>
          <group
            position={[-1.287, 1.141, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Glass_Rear001_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[-0.163, -0.322, 1.12]}
            />
          </group>
          <group position={[2.231, 0.68, -4]} rotation={[-1.57, -1.569, -1.57]}>
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Headlights001_UCB_Lights_and_Glass_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass}
              position={[-0.163, 0.134, 4.638]}
            />
          </group>
          <group position={[2.257, 0.65, -4]} rotation={[-1.57, -1.569, -1.57]}>
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Headlights_Glass001_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[-0.163, 0.163, 4.004]}
            />
          </group>
          <group
            position={[1.67, 0.835, -4]}
            rotation={[-1.571, -1.569, -1.571]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Hood001_Fairheaven_LT80_Bodymat_0.geometry
              }
              material={materials.Fairheaven_LT80_Bodymat}
              position={[-0.163, -0.02, 4.078]}
            />
          </group>
          <group
            position={[-0.73, 0.819, -4]}
            rotation={[Math.PI, 0, -Math.PI]}
            scale={[1, 1, 0.948]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Interior001_UCB_Interior_Trim_0.geometry
              }
              material={materials.UCB_Interior_Trim}
              position={[-0.624, -0.254, 0.711]}
            />
          </group>
          <group
            position={[-0.102, 0.805, -4.003]}
            rotation={[Math.PI, 0, -Math.PI]}
            scale={[1, 1, 0.948]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Interior_Trim001_UCB_Interior_Trim_0
                  .geometry
              }
              material={materials.UCB_Interior_Trim}
              position={[0.004, -0.24, 0.708]}
            />
          </group>
          <group
            position={[-2.368, 0.584, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Reverse001_UCB_Lights_and_Glass_0.geometry
              }
              material={materials.UCB_Lights_and_Glass}
              position={[-0.141, 0.236, -0.002]}
            />
          </group>
          <group
            position={[0.309, 0.782, -4.34]}
            rotation={[Math.PI, 0, Math.PI]}
            scale={[1, 1, 0.852]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Steering_Wheel001_UCB_Interior_Trim_0
                  .geometry
              }
              material={materials.UCB_Interior_Trim}
              position={[0.415, -0.217, 0.323]}
            />
          </group>
          <group
            position={[-0.043, 0.341, -4]}
            rotation={[-3.142, 0, -3.14]}
            scale={1.066}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Suspension001_UCB_BOTTOM_GT_0.geometry
              }
              material={materials.UCB_BOTTOM_GT}
              position={[-1.116, -0.124, 0.159]}
            />
          </group>
          <group
            position={[-2.358, 0.659, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Taillights_Glass001_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[-0.164, 0.162, 0.007]}
            />
          </group>
          <group
            position={[-1.94, 0.752, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_Trunk_door_inner001_UCB_BOTTOM_GT_0
                  .geometry
              }
              material={materials.UCB_BOTTOM_GT}
              position={[-0.163, 0.068, 0.468]}
            />
          </group>
          <group
            position={[-0.18, 0.788, -4]}
            rotation={[-1.571, -1.569, -1.571]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_body001_Fairheaven_LT80_Bodymat_0.geometry
              }
              material={materials.Fairheaven_LT80_Bodymat}
              position={[-0.163, 0.029, 2.227]}
            />
          </group>
          <group
            position={[-2.401, 0.39, -4]}
            rotation={[-1.571, -1.569, -1.571]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_bumper_rear001_UCB_BOTTOM_GT_0.geometry
              }
              material={materials.UCB_BOTTOM_GT}
              position={[-0.163, 0.37, 4.752]}
            />
          </group>
          <group
            position={[-1.935, 0.752, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_trunk_door001_Fairheaven_LT80_Bodymat_0
                  .geometry
              }
              material={materials.Fairheaven_LT80_Bodymat}
              position={[-0.163, 0.068, 0.473]}
            />
          </group>
          <group
            position={[-2.373, 0.696, -3.934]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes.Fairheaven_LT80_trunk_door_Badges001_Carbadges_misc_U_0
                  .geometry
              }
              material={materials.Carbadges_misc_U}
              position={[-1.9, 1.906, 0.252]}
            />
          </group>
          <group
            position={[-0.759, 0.926, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Fairheaven_LT80_Trim_UCB_BOTTOM_GT_0.geometry}
              material={materials.UCB_BOTTOM_GT}
              position={[0.358, -0.108, 1.648]}
            />
          </group>
          <group
            position={[0.589, 1.108, -4]}
            rotation={[-1.57, -1.569, -1.57]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={
                nodes
                  .Fairheaven_LT80_Windshield001_UCB_Lights_and_Glass_Transperent_0
                  .geometry
              }
              material={materials.UCB_Lights_and_Glass_Transperent}
              position={[-0.169, -0.292, 2.996]}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/policeCruiser.glb'));
