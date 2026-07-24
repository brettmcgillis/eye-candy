import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const MIN_BODY_SPAN = 0.01;
const MAX_BODY_SPAN = 0.12;

function wrapCurveU(value) {
  return ((value % 1) + 1) % 1;
}

export default function SplineShark({
  Shark,
  points,
  speed,
  scale,
  headingOffset = 0,
  clockwise = true,
  visible = true,
  showSpline = false,
  bodySpanScale = 0.85,
  bodyCenterBlend = 1,
  sharkProps = {},
}) {
  const ref = useRef();
  const centerRef = useRef();
  const bodyRef = useRef();
  const metricsReadyRef = useRef(false);
  const bodyLengthRef = useRef(0);
  const bodyOffsetRef = useRef(new THREE.Vector3());
  const temp = useMemo(
    () => ({
      box: new THREE.Box3(),
      worldCenter: new THREE.Vector3(),
      localCenter: new THREE.Vector3(),
      size: new THREE.Vector3(),
      front: new THREE.Vector3(),
      back: new THREE.Vector3(),
      curveCenter: new THREE.Vector3(),
      chordCenter: new THREE.Vector3(),
      bodyCenter: new THREE.Vector3(),
      axis: new THREE.Vector3(),
    }),
    []
  );
  const scenePoints = useMemo(() => {
    if (!points?.length) return [];
    return points.map((point) => point.clone().multiplyScalar(0.01));
  }, [points]);
  const curve = useMemo(() => {
    if (!scenePoints.length) return null;
    return new THREE.CatmullRomCurve3(scenePoints, true, 'centripetal', 0.5);
  }, [scenePoints]);
  const curveLength = useMemo(() => curve?.getLength() ?? 0, [curve]);
  const splineDebugPoints = useMemo(() => curve?.getPoints(128) ?? [], [curve]);

  useEffect(() => {
    metricsReadyRef.current = false;
    bodyLengthRef.current = 0;
    bodyOffsetRef.current.set(0, 0, 0);
  }, [Shark, scale]);

  useFrame((state) => {
    if (!ref.current || !centerRef.current || !bodyRef.current || !curve) {
      return;
    }

    if (!metricsReadyRef.current) {
      bodyRef.current.updateWorldMatrix(true, true);
      temp.box.setFromObject(bodyRef.current);
      if (!temp.box.isEmpty()) {
        temp.box.getCenter(temp.worldCenter);
        temp.localCenter.copy(temp.worldCenter);
        ref.current.worldToLocal(temp.localCenter);

        bodyOffsetRef.current.set(-temp.localCenter.x, 0, -temp.localCenter.z);
        centerRef.current.position.copy(bodyOffsetRef.current);

        temp.box.getSize(temp.size);
        bodyLengthRef.current = Math.max(temp.size.x, temp.size.y, temp.size.z);
        metricsReadyRef.current = bodyLengthRef.current > 0;
      }
    } else {
      centerRef.current.position.copy(bodyOffsetRef.current);
    }

    const t = (state.clock.elapsedTime * speed) % 1;
    const u = clockwise ? (1 - t + 1) % 1 : t;

    const fallbackBodyLength = curveLength * MIN_BODY_SPAN * 2;
    const bodyLength = bodyLengthRef.current || fallbackBodyLength;
    const bodySpan = THREE.MathUtils.clamp(
      (bodyLength * bodySpanScale) / (curveLength * 2),
      MIN_BODY_SPAN,
      MAX_BODY_SPAN
    );

    curve.getPointAt(wrapCurveU(u + bodySpan), temp.front);
    curve.getPointAt(wrapCurveU(u - bodySpan), temp.back);
    curve.getPointAt(u, temp.curveCenter);

    temp.chordCenter.copy(temp.front).add(temp.back).multiplyScalar(0.5);
    temp.bodyCenter.lerpVectors(
      temp.curveCenter,
      temp.chordCenter,
      bodyCenterBlend
    );

    temp.axis.copy(temp.front).sub(temp.back);
    const heading = Math.atan2(temp.axis.x, temp.axis.z);

    ref.current.position.set(
      temp.bodyCenter.x,
      temp.curveCenter.y + Math.sin(state.clock.elapsedTime * 1.7) * 0.05,
      temp.bodyCenter.z
    );
    ref.current.rotation.y = heading + headingOffset;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.0) * 0.08;
  });

  return (
    <>
      {visible && (
        <group ref={ref}>
          <group ref={centerRef}>
            <group ref={bodyRef} scale={scale}>
              <Shark {...sharkProps} />
            </group>
          </group>
        </group>
      )}
      {splineDebugPoints.length >= 2 && (
        <Line
          points={splineDebugPoints}
          color="#ff6600"
          lineWidth={3}
          visible={showSpline}
          toneMapped={false}
        />
      )}
    </>
  );
}
