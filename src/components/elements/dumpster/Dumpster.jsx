import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const DUMPSTER_BASE_ROTATION = [Math.PI / 2, 0, 0];
const DUMPSTER_BASE_SCALE = 0.01;
const DUMPSTER_ROOT_ROTATION = [-Math.PI, 0, 0];

export const DUMPSTER_LEFT_LID_PIVOT_POSITION = [-47.5, 51.999, 146.244];
export const DUMPSTER_RIGHT_LID_PIVOT_POSITION = [47.5, 51.999, 146.244];

function useDumpsterModel() {
  return useGLTF(modelFile(`Dumpster.glb`));
}

function DumpsterSceneGraph({ children, ...props }) {
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="Model">
          <group
            name="Base"
            rotation={DUMPSTER_BASE_ROTATION}
            scale={DUMPSTER_BASE_SCALE}
          >
            <group name="Root">
              <group name="Dumpster" rotation={DUMPSTER_ROOT_ROTATION}>
                {children}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function DumpsterShellContent({
  nodes,
  material,
  frontLeftWheelRotation,
  frontRightWheelRotation,
  rearLeftWheelRotation,
  rearRightWheelRotation,
}) {
  return (
    <>
      <group name="Container" position={[0, 2.238, 122.206]}>
        <group
          name="C1"
          position={[90, -49.761, -24.038]}
          rotation={[0, -1.571, 0]}
        >
          <mesh
            name="C2"
            castShadow
            receiveShadow
            geometry={nodes.C2.geometry}
            material={material}
          />
        </group>
      </group>

      <group
        name="FrontLeftWheel"
        position={[-83.16, -30, 16.669]}
        rotation={[0, 0, frontLeftWheelRotation]}
      >
        <group
          name="FLW1"
          position={[6.84, -17.523, 81.499]}
          rotation={[0, -1.571, 0]}
        >
          <mesh
            name="FLW2"
            castShadow
            receiveShadow
            geometry={nodes.FLW2.geometry}
            material={material}
          />
        </group>
      </group>

      <group
        name="FrontRightWheel"
        position={[83.16, -30, 16.669]}
        rotation={[0, 0, frontRightWheelRotation]}
      >
        <group
          name="FRW1"
          position={[6.84, -17.523, 81.499]}
          rotation={[0, -1.571, 0]}
        >
          <mesh
            name="FRW2"
            castShadow
            receiveShadow
            geometry={nodes.FRW2.geometry}
            material={material}
          />
        </group>
      </group>

      <group
        name="RearLeftWheel"
        position={[-83.16, 30, 16.669]}
        rotation={[0, 0, rearLeftWheelRotation]}
      >
        <group
          name="RLW1"
          position={[6.84, -17.523, 81.499]}
          rotation={[0, -1.571, 0]}
        >
          <mesh
            name="RLW2"
            castShadow
            receiveShadow
            geometry={nodes.RLW2.geometry}
            material={material}
          />
        </group>
      </group>

      <group
        name="RearRightWheel"
        position={[83.16, 33.131, 16.669]}
        rotation={[0, 0, rearRightWheelRotation]}
      >
        <group
          name="RRW1"
          position={[6.84, -17.523, 81.499]}
          rotation={[0, -1.571, 0]}
        >
          <mesh
            name="RRW2"
            castShadow
            receiveShadow
            geometry={nodes.RRW2.geometry}
            material={material}
          />
        </group>
      </group>
    </>
  );
}

function DumpsterLeftLidContent({
  nodes,
  material,
  pivotPosition,
  rotation,
  visible,
}) {
  return (
    <group
      visible={visible}
      name="LeftLid"
      position={pivotPosition}
      rotation={rotation}
    >
      <group name="LL1" position={[0, 0.3, 51.276]}>
        <mesh
          name="LL2"
          castShadow
          receiveShadow
          geometry={nodes.LL2.geometry}
          material={material}
        />
      </group>
    </group>
  );
}

function DumpsterRightLidContent({
  nodes,
  material,
  pivotPosition,
  rotation,
  visible,
}) {
  return (
    <group
      name="RightLid"
      visible={visible}
      position={pivotPosition}
      rotation={rotation}
    >
      <group name="RL1" position={[0, 0.3, 51.276]}>
        <mesh
          name="RL2"
          castShadow
          receiveShadow
          geometry={nodes.RL2.geometry}
          material={material}
        />
      </group>
    </group>
  );
}

export function DumpsterShell({
  frontLeftWheelRotation = Math.PI,
  frontRightWheelRotation = 0,
  rearLeftWheelRotation = Math.PI,
  rearRightWheelRotation = 0,
  ...props
}) {
  const { nodes, materials } = useDumpsterModel();

  return (
    <DumpsterSceneGraph {...props}>
      <DumpsterShellContent
        nodes={nodes}
        material={materials['Dumpster_02.001']}
        frontLeftWheelRotation={frontLeftWheelRotation}
        frontRightWheelRotation={frontRightWheelRotation}
        rearLeftWheelRotation={rearLeftWheelRotation}
        rearRightWheelRotation={rearRightWheelRotation}
      />
    </DumpsterSceneGraph>
  );
}

export function DumpsterLeftLid({
  visible = true,
  rotation = [0, 0, 0],
  pivotPosition = DUMPSTER_LEFT_LID_PIVOT_POSITION,
  ...props
}) {
  const { nodes, materials } = useDumpsterModel();

  return (
    <DumpsterSceneGraph {...props}>
      <DumpsterLeftLidContent
        nodes={nodes}
        material={materials['Dumpster_02.001']}
        pivotPosition={pivotPosition}
        rotation={rotation}
        visible={visible}
      />
    </DumpsterSceneGraph>
  );
}

export function DumpsterRightLid({
  visible = true,
  rotation = [0, 0, 0],
  pivotPosition = DUMPSTER_RIGHT_LID_PIVOT_POSITION,
  ...props
}) {
  const { nodes, materials } = useDumpsterModel();

  return (
    <DumpsterSceneGraph {...props}>
      <DumpsterRightLidContent
        nodes={nodes}
        material={materials['Dumpster_02.001']}
        pivotPosition={pivotPosition}
        rotation={rotation}
        visible={visible}
      />
    </DumpsterSceneGraph>
  );
}

export default function Dumpster({
  rightLidVisible = true,
  rightLidRotation = Math.PI / 4,
  leftLidVisible = true,
  leftLidRotation = 1.833,
  frontLeftWheelRotation = Math.PI,
  frontRightWheelRotation = 0,
  rearLeftWheelRotation = Math.PI,
  rearRightWheelRotation = 0,
  ...props
}) {
  const { nodes, materials } = useDumpsterModel();

  return (
    <DumpsterSceneGraph {...props}>
      <DumpsterShellContent
        nodes={nodes}
        material={materials['Dumpster_02.001']}
        frontLeftWheelRotation={frontLeftWheelRotation}
        frontRightWheelRotation={frontRightWheelRotation}
        rearLeftWheelRotation={rearLeftWheelRotation}
        rearRightWheelRotation={rearRightWheelRotation}
      />
      <DumpsterLeftLidContent
        nodes={nodes}
        material={materials['Dumpster_02.001']}
        pivotPosition={DUMPSTER_LEFT_LID_PIVOT_POSITION}
        rotation={[leftLidRotation, 0, 0]}
        visible={leftLidVisible}
      />
      <DumpsterRightLidContent
        nodes={nodes}
        material={materials['Dumpster_02.001']}
        pivotPosition={DUMPSTER_RIGHT_LID_PIVOT_POSITION}
        rotation={[rightLidRotation, 0, 0]}
        visible={rightLidVisible}
      />
    </DumpsterSceneGraph>
  );
}

useGLTF.preload(modelFile(`Dumpster.glb`));

export function DebugDumpster({
  leftLidRotation = 1.833,
  rightLidRotation = Math.PI / 4,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile(`Dumpster.glb`));
  return (
    <group {...props} dispose={null}>
      <group scale={0.01}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <group position={[0, 2.238, 122.206]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.C2.geometry}
              material={materials['Dumpster_02.001']}
              position={[90, -49.761, -24.038]}
              rotation={[0, -1.571, 0]}
            />
          </group>
          <group position={[-83.16, -30, 16.669]} rotation={[0, 0, -Math.PI]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.FLW2.geometry}
              material={materials['Dumpster_02.001']}
              position={[6.84, -17.523, 81.499]}
              rotation={[0, -1.571, 0]}
            />
          </group>
          <group position={[83.16, -30, 16.669]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.FRW2.geometry}
              material={materials['Dumpster_02.001']}
              position={[6.84, -17.523, 81.499]}
              rotation={[0, -1.571, 0]}
            />
          </group>
          {/* left Lid */}
          <group
            position={[-47.5, 51.999, 146.244]}
            rotation={[leftLidRotation, 0, 0]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.LL2.geometry}
              material={materials['Dumpster_02.001']}
              position={[0, 0.3, 51.276]}
            />
          </group>
          <group position={[-83.16, 30, 16.669]} rotation={[0, 0, Math.PI]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.RLW2.geometry}
              material={materials['Dumpster_02.001']}
              position={[6.84, -17.523, 81.499]}
              rotation={[0, -1.571, 0]}
            />
          </group>
          <group position={[83.16, 33.131, 16.669]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.RRW2.geometry}
              material={materials['Dumpster_02.001']}
              position={[6.84, -17.523, 81.499]}
              rotation={[0, -1.571, 0]}
            />
          </group>
          {/* right Lid */}
          <group
            position={[47.5, 51.999, 146.244]}
            rotation={[rightLidRotation, 0, 0]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.RL2.geometry}
              material={materials['Dumpster_02.001']}
              position={[0, 0.3, 51.276]}
            />
          </group>
        </group>
      </group>
    </group>
  );
}
