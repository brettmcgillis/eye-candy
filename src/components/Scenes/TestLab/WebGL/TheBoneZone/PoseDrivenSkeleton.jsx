import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  mapPoseNormalizedOffsetToWorld,
  mapPoseWorldOffsetToWorld,
} from '../../../../../hooks/pose/poseLandmarkUtils';
import Skeleton from '../../../../elements/skeleton/Skeleton';

const HAND_LANDMARK_NAMES = [
  'wrist',
  'thumbCMC',
  'thumbMCP',
  'thumbIP',
  'thumbTip',
  'indexMCP',
  'indexPIP',
  'indexDIP',
  'indexTip',
  'middleMCP',
  'middlePIP',
  'middleDIP',
  'middleTip',
  'ringMCP',
  'ringPIP',
  'ringDIP',
  'ringTip',
  'pinkyMCP',
  'pinkyPIP',
  'pinkyDIP',
  'pinkyTip',
];

const BONE_TARGETS = [
  {
    boneName: 'abdomen_03',
    childName: 'chest_04',
    startNames: ['leftHip', 'rightHip'],
    endNames: ['leftShoulder', 'rightShoulder'],
  },
  {
    boneName: 'chest_04',
    childName: 'neck_05',
    startNames: ['leftShoulder', 'rightShoulder'],
    endNames: ['nose', 'leftEar', 'rightEar'],
  },
  {
    boneName: 'neck_05',
    childName: 'head_06',
    startNames: ['leftShoulder', 'rightShoulder'],
    endNames: ['nose', 'leftEye', 'rightEye'],
  },
  {
    boneName: 'head_06',
    childName: 'upperJaw_08',
    startNames: ['leftEar', 'rightEar'],
    endNames: ['nose', 'leftEye', 'rightEye'],
  },
  {
    boneName: 'lCollar_041',
    childName: 'lShldr_042',
    startNames: ['leftShoulder', 'rightShoulder'],
    endNames: ['leftShoulder'],
  },
  {
    boneName: 'rCollar_017',
    childName: 'rShldr_018',
    startNames: ['leftShoulder', 'rightShoulder'],
    endNames: ['rightShoulder'],
  },
  {
    boneName: 'lShldr_042',
    childName: 'lForeArm_043',
    startNames: ['leftShoulder'],
    endNames: ['leftElbow'],
  },
  {
    boneName: 'rShldr_018',
    childName: 'rForeArm_019',
    startNames: ['rightShoulder'],
    endNames: ['rightElbow'],
  },
  {
    boneName: 'lForeArm_043',
    childName: 'lHand_044',
    startNames: ['leftElbow'],
    endNames: ['leftWrist'],
  },
  {
    boneName: 'rForeArm_019',
    childName: 'rHand_020',
    startNames: ['rightElbow'],
    endNames: ['rightWrist'],
  },
  {
    boneName: 'lHand_044',
    childName: 'lMid1_052',
    handEndNames: ['indexMCP', 'middleMCP', 'ringMCP'],
    handSource: 'leftHand',
    handStartNames: ['wrist'],
    startNames: ['leftWrist'],
    endNames: ['leftIndex', 'leftPinky', 'leftThumb'],
  },
  {
    boneName: 'rHand_020',
    childName: 'rMid1_028',
    handEndNames: ['indexMCP', 'middleMCP', 'ringMCP'],
    handSource: 'rightHand',
    handStartNames: ['wrist'],
    startNames: ['rightWrist'],
    endNames: ['rightIndex', 'rightPinky', 'rightThumb'],
  },
  {
    boneName: 'lThumb1_045',
    childName: 'lThumb2_046',
    handEndNames: ['thumbMCP'],
    handSource: 'leftHand',
    handStartNames: ['thumbCMC'],
  },
  {
    boneName: 'lThumb2_046',
    childName: 'lThumb3_047',
    handEndNames: ['thumbIP'],
    handSource: 'leftHand',
    handStartNames: ['thumbMCP'],
  },
  {
    boneName: 'lIndex1_049',
    childName: 'lIndex2_050',
    handEndNames: ['indexPIP'],
    handSource: 'leftHand',
    handStartNames: ['indexMCP'],
  },
  {
    boneName: 'lIndex2_050',
    childName: 'lIndex3_051',
    handEndNames: ['indexDIP'],
    handSource: 'leftHand',
    handStartNames: ['indexPIP'],
  },
  {
    boneName: 'lMid1_052',
    childName: 'lMid2_053',
    handEndNames: ['middlePIP'],
    handSource: 'leftHand',
    handStartNames: ['middleMCP'],
  },
  {
    boneName: 'lMid2_053',
    childName: 'lMid3_054',
    handEndNames: ['middleDIP'],
    handSource: 'leftHand',
    handStartNames: ['middlePIP'],
  },
  {
    boneName: 'lRing1_055',
    childName: 'lRing2_056',
    handEndNames: ['ringPIP'],
    handSource: 'leftHand',
    handStartNames: ['ringMCP'],
  },
  {
    boneName: 'lRing2_056',
    childName: 'lRing3_057',
    handEndNames: ['ringDIP'],
    handSource: 'leftHand',
    handStartNames: ['ringPIP'],
  },
  {
    boneName: 'lPinky1_058',
    childName: 'lPinky2_059',
    handEndNames: ['pinkyPIP'],
    handSource: 'leftHand',
    handStartNames: ['pinkyMCP'],
  },
  {
    boneName: 'lPinky2_059',
    childName: 'lPinky3_060',
    handEndNames: ['pinkyDIP'],
    handSource: 'leftHand',
    handStartNames: ['pinkyPIP'],
  },
  {
    boneName: 'rThumb1_021',
    childName: 'rThumb2_022',
    handEndNames: ['thumbMCP'],
    handSource: 'rightHand',
    handStartNames: ['thumbCMC'],
  },
  {
    boneName: 'rThumb2_022',
    childName: 'rThumb3_023',
    handEndNames: ['thumbIP'],
    handSource: 'rightHand',
    handStartNames: ['thumbMCP'],
  },
  {
    boneName: 'rIndex1_025',
    childName: 'rIndex2_026',
    handEndNames: ['indexPIP'],
    handSource: 'rightHand',
    handStartNames: ['indexMCP'],
  },
  {
    boneName: 'rIndex2_026',
    childName: 'rIndex3_027',
    handEndNames: ['indexDIP'],
    handSource: 'rightHand',
    handStartNames: ['indexPIP'],
  },
  {
    boneName: 'rMid1_028',
    childName: 'rMid2_029',
    handEndNames: ['middlePIP'],
    handSource: 'rightHand',
    handStartNames: ['middleMCP'],
  },
  {
    boneName: 'rMid2_029',
    childName: 'rMid3_030',
    handEndNames: ['middleDIP'],
    handSource: 'rightHand',
    handStartNames: ['middlePIP'],
  },
  {
    boneName: 'rRing1_031',
    childName: 'rRing2_032',
    handEndNames: ['ringPIP'],
    handSource: 'rightHand',
    handStartNames: ['ringMCP'],
  },
  {
    boneName: 'rRing2_032',
    childName: 'rRing3_033',
    handEndNames: ['ringDIP'],
    handSource: 'rightHand',
    handStartNames: ['ringPIP'],
  },
  {
    boneName: 'rPinky1_034',
    childName: 'rPinky2_035',
    handEndNames: ['pinkyPIP'],
    handSource: 'rightHand',
    handStartNames: ['pinkyMCP'],
  },
  {
    boneName: 'rPinky2_035',
    childName: 'rPinky3_036',
    handEndNames: ['pinkyDIP'],
    handSource: 'rightHand',
    handStartNames: ['pinkyPIP'],
  },
  {
    boneName: 'lThigh_0100',
    childName: 'lShin_0101',
    startNames: ['leftHip'],
    endNames: ['leftKnee'],
  },
  {
    boneName: 'rThigh_083',
    childName: 'rShin_084',
    startNames: ['rightHip'],
    endNames: ['rightKnee'],
  },
  {
    boneName: 'lShin_0101',
    childName: 'lFoot_0102',
    startNames: ['leftKnee'],
    endNames: ['leftAnkle'],
  },
  {
    boneName: 'rShin_084',
    childName: 'rFoot_085',
    startNames: ['rightKnee'],
    endNames: ['rightAnkle'],
  },
  {
    boneName: 'lFoot_0102',
    childName: 'lToe_0103',
    startNames: ['leftAnkle'],
    endNames: ['leftFootIndex', 'leftHeel'],
  },
  {
    boneName: 'rFoot_085',
    childName: 'rToe_086',
    startNames: ['rightAnkle'],
    endNames: ['rightFootIndex', 'rightHeel'],
  },
];

function averageVisibleMappedLandmarks(pose, names, minVisibility, out) {
  if (!pose?.mappedLandmarks || !pose?.landmarks) return null;

  out.set(0, 0, 0);
  let count = 0;

  names.forEach((name) => {
    const mapped = pose.mappedLandmarks[name];
    const visibility = pose.landmarks[name]?.visibility ?? 1;

    if (!mapped || visibility < minVisibility) return;

    out.add(mapped);
    count += 1;
  });

  if (!count) return null;

  return out.multiplyScalar(1 / count);
}

function directionFromPose(
  pose,
  startNames,
  endNames,
  minVisibility,
  out,
  tempStart,
  tempEnd
) {
  const start = averageVisibleMappedLandmarks(
    pose,
    startNames,
    minVisibility,
    tempStart
  );
  const end = averageVisibleMappedLandmarks(
    pose,
    endNames,
    minVisibility,
    tempEnd
  );

  if (!start || !end) return null;

  out.subVectors(end, start);

  if (out.lengthSq() < 1e-6) return null;

  return out.normalize();
}

function nameHandLandmarks(landmarks) {
  if (!landmarks?.length) return null;

  const named = {};

  HAND_LANDMARK_NAMES.forEach((name, index) => {
    named[name] = landmarks[index] ?? null;
  });

  return named;
}

function mapNamedHandLandmarks(namedLandmarks, namedWorldLandmarks, mapping) {
  if (!namedLandmarks?.wrist) return null;

  return Object.fromEntries(
    Object.entries(namedLandmarks)
      .filter(([, point]) => Boolean(point))
      .map(([name, point]) => {
        const worldPoint = namedWorldLandmarks?.[name];
        const worldWrist = namedWorldLandmarks?.wrist;

        if (worldPoint && worldWrist) {
          return [
            name,
            mapPoseWorldOffsetToWorld(
              {
                x: worldPoint.x - worldWrist.x,
                y: worldPoint.y - worldWrist.y,
                z: worldPoint.z - worldWrist.z,
              },
              mapping
            ),
          ];
        }

        return [
          name,
          mapPoseNormalizedOffsetToWorld(point, namedLandmarks.wrist, mapping),
        ];
      })
  );
}

function buildHolisticHandState(normalizedLandmarks, worldLandmarks, mapping) {
  const namedLandmarks = nameHandLandmarks(normalizedLandmarks);
  if (!namedLandmarks) return null;

  return {
    landmarks: mapNamedHandLandmarks(
      namedLandmarks,
      nameHandLandmarks(worldLandmarks),
      mapping
    ),
  };
}

function buildHolisticTrackingState(trackingResults, mapping) {
  if (trackingResults?.mode !== 'holistic') {
    return {
      leftHand: null,
      rightHand: null,
    };
  }

  return {
    leftHand: buildHolisticHandState(
      trackingResults.leftHandLandmarks?.[0],
      trackingResults.leftHandWorldLandmarks?.[0],
      mapping
    ),
    rightHand: buildHolisticHandState(
      trackingResults.rightHandLandmarks?.[0],
      trackingResults.rightHandWorldLandmarks?.[0],
      mapping
    ),
  };
}

function averageMappedHandLandmarks(handState, names, out) {
  const landmarks = handState?.landmarks;
  if (!landmarks) return null;

  out.set(0, 0, 0);
  let count = 0;

  names.forEach((name) => {
    const mapped = landmarks[name];
    if (!mapped) return;

    out.add(mapped);
    count += 1;
  });

  if (!count) return null;

  return out.multiplyScalar(1 / count);
}

function directionFromHand(
  handState,
  startNames,
  endNames,
  out,
  tempStart,
  tempEnd
) {
  const start = averageMappedHandLandmarks(handState, startNames, tempStart);
  const end = averageMappedHandLandmarks(handState, endNames, tempEnd);

  if (!start || !end) return null;

  out.subVectors(end, start);

  if (out.lengthSq() < 1e-6) return null;

  return out.normalize();
}

function directionFromController(
  controller,
  pose,
  trackingState,
  visibilityThreshold,
  out,
  tempStart,
  tempEnd
) {
  if (controller.handSource) {
    const handDirection = directionFromHand(
      trackingState[controller.handSource],
      controller.handStartNames,
      controller.handEndNames,
      out,
      tempStart,
      tempEnd
    );

    if (handDirection) return handDirection;
  }

  if (!controller.startNames?.length || !controller.endNames?.length) {
    return null;
  }

  return directionFromPose(
    pose,
    controller.startNames,
    controller.endNames,
    visibilityThreshold,
    out,
    tempStart,
    tempEnd
  );
}

function collectRigState(group) {
  const bonesByName = new Map();

  group.traverse((child) => {
    if (child.isBone) {
      bonesByName.set(child.name, child);
    }
  });

  const controllers = BONE_TARGETS.flatMap((target) => {
    const bone = bonesByName.get(target.boneName);
    const child = bonesByName.get(target.childName);

    if (!bone || !child) return [];

    const childDirectionLocal = child.position.clone();
    if (childDirectionLocal.lengthSq() < 1e-6) return [];

    childDirectionLocal.normalize();

    return [
      {
        ...target,
        bone,
        restQuaternion: bone.quaternion.clone(),
        childDirectionLocal,
      },
    ];
  });

  const leftShoulder = bonesByName.get('lShldr_042');
  const rightShoulder = bonesByName.get('rShldr_018');
  const leftShoulderPosition = new THREE.Vector3();
  const rightShoulderPosition = new THREE.Vector3();

  if (leftShoulder && rightShoulder) {
    leftShoulder.getWorldPosition(leftShoulderPosition);
    rightShoulder.getWorldPosition(rightShoulderPosition);
  }

  return {
    controllers,
  };
}

export default function PoseDrivenSkeleton({
  pose,
  trackingResults,
  mapping = { xScale: 6, yScale: 4, zScale: 6 },
  scaleMultiplier = 1.75,
  rotationLerp = 0.2,
  visibilityThreshold = 0.45,
  basePosition = [0, 0, 0],
  ...props
}) {
  const wrapperRef = useRef(null);
  const rigRef = useRef(null);

  const basePositionVector = useMemo(
    () => new THREE.Vector3(...basePosition),
    [basePosition]
  );

  useEffect(() => {
    if (!wrapperRef.current || rigRef.current) return;

    rigRef.current = collectRigState(wrapperRef.current);
    wrapperRef.current.position.copy(basePositionVector);
    wrapperRef.current.scale.setScalar(scaleMultiplier);
  }, [basePositionVector, scaleMultiplier]);

  useFrame(() => {
    const group = wrapperRef.current;
    const rig = rigRef.current;

    if (!group || !rig) return;

    const poseActive = Boolean(pose?.mappedLandmarks && pose?.landmarks);
    const trackingState = buildHolisticTrackingState(trackingResults, mapping);
    const rotationAlpha = THREE.MathUtils.clamp(rotationLerp, 0.001, 1);

    const tempStart = new THREE.Vector3();
    const tempEnd = new THREE.Vector3();
    const targetDirection = new THREE.Vector3();
    const desiredParentDirection = new THREE.Vector3();
    const restParentDirection = new THREE.Vector3();
    const parentWorldQuaternion = new THREE.Quaternion();
    const inverseParentQuaternion = new THREE.Quaternion();
    const deltaQuaternion = new THREE.Quaternion();
    const desiredLocalQuaternion = new THREE.Quaternion();

    group.position.copy(basePositionVector);
    group.scale.setScalar(scaleMultiplier);

    group.updateMatrixWorld(true);

    rig.controllers.forEach((controller) => {
      if (!poseActive) {
        controller.bone.quaternion.slerp(
          controller.restQuaternion,
          rotationAlpha
        );
        return;
      }

      const desiredWorldDirection = directionFromController(
        controller,
        pose,
        trackingState,
        visibilityThreshold,
        targetDirection,
        tempStart,
        tempEnd
      );

      if (!desiredWorldDirection) {
        controller.bone.quaternion.slerp(
          controller.restQuaternion,
          rotationAlpha
        );
        controller.bone.updateMatrixWorld();
        return;
      }

      const { parent } = controller.bone;
      if (!parent) return;

      parent.getWorldQuaternion(parentWorldQuaternion);

      desiredParentDirection
        .copy(desiredWorldDirection)
        .applyQuaternion(
          inverseParentQuaternion.copy(parentWorldQuaternion).invert()
        )
        .normalize();

      restParentDirection
        .copy(controller.childDirectionLocal)
        .applyQuaternion(controller.restQuaternion)
        .normalize();

      if (
        desiredParentDirection.lengthSq() < 1e-6 ||
        restParentDirection.lengthSq() < 1e-6
      ) {
        return;
      }

      deltaQuaternion.setFromUnitVectors(
        restParentDirection,
        desiredParentDirection
      );
      desiredLocalQuaternion
        .copy(deltaQuaternion)
        .multiply(controller.restQuaternion);

      controller.bone.quaternion.slerp(desiredLocalQuaternion, rotationAlpha);
      controller.bone.updateMatrixWorld();
    });
  });

  return (
    <group ref={wrapperRef}>
      <Skeleton {...props} scale={0.1} />
    </group>
  );
}
