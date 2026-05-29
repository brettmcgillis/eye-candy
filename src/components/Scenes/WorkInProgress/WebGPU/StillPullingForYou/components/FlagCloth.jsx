import * as THREE from 'three';

import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useFrame } from '@react-three/fiber';

import ClothMesh from '../../../../../elements/webgpu/cloth/ClothMesh';
import { pinEdge } from '../../../../../elements/webgpu/cloth/pinHelpers';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const LOCAL_AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const AXIS_NAMES = ['x', 'y', 'z'];

const sharedBasis = new THREE.Matrix4();
const sharedInverse = new THREE.Matrix4();
const sharedTopAttachedWorld = new THREE.Vector3();
const sharedTopFreeWorld = new THREE.Vector3();
const sharedBottomAttachedWorld = new THREE.Vector3();
const sharedXAxis = new THREE.Vector3();
const sharedYAxis = new THREE.Vector3();
const sharedZAxis = new THREE.Vector3();
const sharedDownAxis = new THREE.Vector3();
const sharedSampleWorld = new THREE.Vector3();
const sharedSurfaceWorld = new THREE.Vector3();
const sharedLocalPoint = new THREE.Vector3();
const sharedWorldQuat = new THREE.Quaternion();
const sharedSize = new THREE.Vector3();

const CONTACT_ROW_FRACTIONS = [0.82, 1.0];
const CONTACT_ROW_STAGGERS = [0, 0.5];

function buildAxisPoint(
  widthAxis,
  widthValue,
  heightAxis,
  heightValue,
  thicknessAxis,
  thicknessValue
) {
  const point = new THREE.Vector3();
  point[widthAxis] = widthValue;
  point[heightAxis] = heightValue;
  point[thicknessAxis] = thicknessValue;
  return point;
}

function buildEdgeCenter(
  widthAxis,
  widthValue,
  heightAxis,
  box,
  thicknessAxis
) {
  const point = new THREE.Vector3();
  point[widthAxis] = widthValue;
  point[heightAxis] = (box.min[heightAxis] + box.max[heightAxis]) * 0.5;
  point[thicknessAxis] =
    (box.min[thicknessAxis] + box.max[thicknessAxis]) * 0.5;
  return point;
}

function getMountData(flagMesh, reverseWidth) {
  const geometry = flagMesh?.geometry;
  if (!geometry) return null;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return null;

  box.getSize(sharedSize);
  flagMesh.getWorldQuaternion(sharedWorldQuat);

  const sortedAxes = AXIS_NAMES.map((name) => {
    const worldDir = LOCAL_AXIS_VECTORS[name]
      .clone()
      .applyQuaternion(sharedWorldQuat);
    return {
      name,
      size: sharedSize[name],
      upScore: Math.abs(worldDir.dot(WORLD_UP)),
      worldY: worldDir.y,
    };
  }).sort((a, b) => a.size - b.size);

  const thicknessAxis = sortedAxes[0].name;
  const planarAxes = sortedAxes.slice(1).sort((a, b) => b.upScore - a.upScore);
  const heightAxis = planarAxes[0].name;
  const widthAxis = planarAxes[1].name;
  const thicknessValue =
    (box.min[thicknessAxis] + box.max[thicknessAxis]) * 0.5;
  const topValue =
    planarAxes[0].worldY >= 0 ? box.max[heightAxis] : box.min[heightAxis];
  const bottomValue =
    planarAxes[0].worldY >= 0 ? box.min[heightAxis] : box.max[heightAxis];

  const minEdgeCenter = buildEdgeCenter(
    widthAxis,
    box.min[widthAxis],
    heightAxis,
    box,
    thicknessAxis
  );
  const maxEdgeCenter = buildEdgeCenter(
    widthAxis,
    box.max[widthAxis],
    heightAxis,
    box,
    thicknessAxis
  );

  const minIsAttached = minEdgeCenter.lengthSq() <= maxEdgeCenter.lengthSq();
  const attachedUsesMin = reverseWidth ? !minIsAttached : minIsAttached;
  const attachedValue = attachedUsesMin
    ? box.min[widthAxis]
    : box.max[widthAxis];
  const freeValue = attachedUsesMin ? box.max[widthAxis] : box.min[widthAxis];

  return {
    topAttached: buildAxisPoint(
      widthAxis,
      attachedValue,
      heightAxis,
      topValue,
      thicknessAxis,
      thicknessValue
    ),
    topFree: buildAxisPoint(
      widthAxis,
      freeValue,
      heightAxis,
      topValue,
      thicknessAxis,
      thicknessValue
    ),
    bottomAttached: buildAxisPoint(
      widthAxis,
      attachedValue,
      heightAxis,
      bottomValue,
      thicknessAxis,
      thicknessValue
    ),
  };
}

const FlagCloth = memo(
  forwardRef(function FlagCloth(
    {
      flagAnchorRef,
      mountVersion,
      widthScale = 1,
      heightScale = 1,
      reverseWidth = false,
      segmentsX = 16,
      segmentsY = 24,
      color = '#7a2e22',
      roughness = 0.85,
      metalness = 0,
      opacity = 0.95,
      gravity = 0.00008,
      wind = 1.2,
      windDirX = 1,
      windDirZ = 0,
      stiffness = 0.3,
      dampening = 0.985,
      maxVelocity = 0.018,
      cursorCollider = true,
      cursorRadius = 0.12,
      paused = false,
      waterContactEnabled = false,
      waterContactRadius = 0.05,
      waterContactPoints = 4,
      waterContactSpanStart = 0.4,
      waterContactSpanEnd = 1,
      waterContactLift = 0.012,
      interactionRuntime,
      waveHeight,
      waveChoppiness,
      waveSpeed,
    },
    ref
  ) {
    const clothRef = useRef();
    const groupRef = useRef();
    const [mountData, setMountData] = useState(null);

    const contactColumns = Math.min(Math.max(0, waterContactPoints), 5);
    const colliders = useMemo(
      () =>
        Array.from(
          { length: contactColumns * CONTACT_ROW_FRACTIONS.length },
          () => ({
            position: new THREE.Vector3(),
            radius: waterContactRadius,
            enabled: false,
          })
        ),
      [contactColumns, waterContactRadius]
    );

    const pins = useMemo(
      () => pinEdge('left', segmentsX, segmentsY),
      [segmentsX, segmentsY]
    );

    useLayoutEffect(() => {
      const flagMesh = flagAnchorRef?.current;
      if (!flagMesh) return;
      setMountData(getMountData(flagMesh, reverseWidth));
    }, [flagAnchorRef, mountVersion, reverseWidth]);

    useImperativeHandle(
      ref,
      () => ({
        get sim() {
          return clothRef.current?.sim;
        },
        resetSim() {
          clothRef.current?.resetSim();
        },
      }),
      []
    );

    const scaledWidth = useMemo(() => {
      if (!mountData || !flagAnchorRef?.current) return 0;
      const flagMesh = flagAnchorRef.current;
      sharedTopAttachedWorld.copy(mountData.topAttached);
      sharedTopFreeWorld.copy(mountData.topFree);
      sharedBottomAttachedWorld.copy(mountData.bottomAttached);
      flagMesh.localToWorld(sharedTopAttachedWorld);
      flagMesh.localToWorld(sharedTopFreeWorld);
      flagMesh.localToWorld(sharedBottomAttachedWorld);
      return sharedTopFreeWorld.distanceTo(sharedTopAttachedWorld) * widthScale;
    }, [flagAnchorRef, mountData, widthScale]);

    const scaledHeight = useMemo(() => {
      if (!mountData || !flagAnchorRef?.current) return 0;
      const flagMesh = flagAnchorRef.current;
      sharedTopAttachedWorld.copy(mountData.topAttached);
      sharedBottomAttachedWorld.copy(mountData.bottomAttached);
      flagMesh.localToWorld(sharedTopAttachedWorld);
      flagMesh.localToWorld(sharedBottomAttachedWorld);
      return (
        sharedTopAttachedWorld.distanceTo(sharedBottomAttachedWorld) *
        heightScale
      );
    }, [flagAnchorRef, heightScale, mountData]);

    const clothKey = useMemo(
      () =>
        [
          segmentsX,
          segmentsY,
          scaledWidth.toFixed(4),
          scaledHeight.toFixed(4),
          reverseWidth ? 'rev' : 'fwd',
        ].join('-'),
      [reverseWidth, scaledHeight, scaledWidth, segmentsX, segmentsY]
    );

    useFrame(() => {
      const flagMesh = flagAnchorRef?.current;
      const group = groupRef.current;
      if (!mountData || !flagMesh || !group) return;

      sharedTopAttachedWorld.copy(mountData.topAttached);
      sharedTopFreeWorld.copy(mountData.topFree);
      sharedBottomAttachedWorld.copy(mountData.bottomAttached);
      flagMesh.localToWorld(sharedTopAttachedWorld);
      flagMesh.localToWorld(sharedTopFreeWorld);
      flagMesh.localToWorld(sharedBottomAttachedWorld);

      sharedXAxis.copy(sharedTopFreeWorld).sub(sharedTopAttachedWorld);
      if (sharedXAxis.lengthSq() < 1e-8) return;
      sharedXAxis.normalize();

      sharedYAxis.copy(sharedTopAttachedWorld).sub(sharedBottomAttachedWorld);
      if (sharedYAxis.lengthSq() < 1e-8) return;
      sharedYAxis.normalize();

      sharedZAxis.crossVectors(sharedXAxis, sharedYAxis);
      if (sharedZAxis.lengthSq() < 1e-8) return;
      sharedZAxis.normalize();

      sharedBasis.makeBasis(sharedXAxis, sharedYAxis, sharedZAxis);
      group.position.copy(sharedTopAttachedWorld);
      group.quaternion.setFromRotationMatrix(sharedBasis);
      group.updateWorldMatrix(true, false);

      if (waterContactEnabled && interactionRuntime && colliders.length > 0) {
        const spanStart = Math.min(waterContactSpanStart, waterContactSpanEnd);
        const spanEnd = Math.max(waterContactSpanStart, waterContactSpanEnd);
        const spanRange = spanEnd - spanStart;
        const pointSpacing =
          contactColumns > 1
            ? (scaledWidth * spanRange) / (contactColumns - 1)
            : scaledWidth * Math.max(spanRange, 0.25);
        const supportRadius = Math.max(waterContactRadius, pointSpacing * 0.65);
        sharedDownAxis.copy(sharedYAxis).multiplyScalar(-1);
        sharedInverse.copy(group.matrixWorld).invert();

        let colliderIndex = 0;
        for (
          let rowIndex = 0;
          rowIndex < CONTACT_ROW_FRACTIONS.length;
          rowIndex += 1
        ) {
          const rowFraction = CONTACT_ROW_FRACTIONS[rowIndex];
          const rowStagger =
            contactColumns > 1
              ? (CONTACT_ROW_STAGGERS[rowIndex] * spanRange) /
                (contactColumns - 1)
              : 0;

          for (let i = 0; i < contactColumns; i += 1) {
            const collider = colliders[colliderIndex];
            colliderIndex += 1;

            const t = contactColumns === 1 ? 0.5 : i / (contactColumns - 1);
            const widthT = THREE.MathUtils.clamp(
              spanStart + spanRange * t + rowStagger,
              0,
              1
            );
            sharedSampleWorld
              .copy(sharedTopAttachedWorld)
              .addScaledVector(sharedXAxis, scaledWidth * widthT)
              .addScaledVector(sharedDownAxis, scaledHeight * rowFraction);

            const surfaceY = interactionRuntime.sampleHeight(
              sharedSampleWorld.x,
              sharedSampleWorld.z,
              waveHeight,
              waveChoppiness,
              waveSpeed
            );

            if (
              sharedSampleWorld.y <=
              surfaceY + waterContactLift + supportRadius
            ) {
              sharedSurfaceWorld.set(
                sharedSampleWorld.x,
                surfaceY - supportRadius + waterContactLift,
                sharedSampleWorld.z
              );
              sharedLocalPoint
                .copy(sharedSurfaceWorld)
                .applyMatrix4(sharedInverse);
              collider.position.copy(sharedLocalPoint);
              collider.radius = supportRadius;
              collider.enabled = true;
            } else {
              collider.enabled = false;
            }
          }
        }

        for (let i = colliderIndex; i < colliders.length; i += 1) {
          colliders[i].enabled = false;
        }
        return;
      }

      for (let i = 0; i < colliders.length; i += 1) {
        colliders[i].enabled = false;
      }
    });

    if (!mountData || scaledWidth <= 0 || scaledHeight <= 0) return null;

    return (
      <group ref={groupRef}>
        <ClothMesh
          key={clothKey}
          ref={clothRef}
          width={scaledWidth}
          height={scaledHeight}
          segmentsX={segmentsX}
          segmentsY={segmentsY}
          pins={pins}
          gravity={gravity}
          wind={wind}
          windDirX={windDirX}
          windDirZ={windDirZ}
          stiffness={stiffness}
          dampening={dampening}
          maxVelocity={maxVelocity}
          paused={paused}
          cursorCollider={cursorCollider}
          cursorRadius={cursorRadius}
          colliders={waterContactEnabled ? colliders : []}
          materialProps={{
            color,
            roughness,
            metalness,
            opacity,
          }}
        />
      </group>
    );
  })
);

export default FlagCloth;
