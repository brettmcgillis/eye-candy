import * as THREE from 'three';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { usePaintTargetsRegistry } from '../hooks/usePaintTargets';

const MAX_YAW = THREE.MathUtils.degToRad(24);
const MAX_PITCH = THREE.MathUtils.degToRad(15);
// Wheel zoom dollies the paint camera along its base forward axis
// (todo item 52).
const ZOOM_MAX_METERS = 3;
const ZOOM_METERS_PER_TICK = 0.0025;
// Where the handheld can sits in camera space: lower-right of the view so
// it reads as "held in your hand" without covering the reticle/work area
// (todo item 43).
const HANDHELD_CAMERA_OFFSET = new THREE.Vector3(0.16, -0.13, -0.45);
const AIM_DISTANCE_NO_HIT = 6;
// Distance-based spray spread (adopted from the linked spray-paint sim,
// todo item 62): farther hits get a wider, softer stamp, like real
// rattle-can falloff. Reference distance = stamp at authored brush size.
const SPREAD_REFERENCE_DISTANCE = 2.5;

const tmpNormal = new THREE.Vector3();
const tmpReticlePos = new THREE.Vector3();
const tmpAimObject = new THREE.Object3D();
const tmpHandheldPos = new THREE.Vector3();
const tmpAimDir = new THREE.Vector3();
const tmpAimTarget = new THREE.Vector3();
const tmpForward = new THREE.Vector3();

// Single continuous raycast that drives everything aim-related each frame:
// the mouse-look camera, the handheld can's pose, the reticle, and — while
// the mouse button is held — the actual paint stamping. Targets come from
// the paint-target registry ('paint' surfaces in paint mode, 'ui' decals in
// color-select for the small hover reticle). Photo mode disables the rig
// entirely — CameraRig's operator mode owns the camera there.
function PaintRig({
  brush,
  mode,
  handheldGroupRef,
  onSprayingChange,
  wideShot,
}) {
  const { gl } = useThree();
  const registry = usePaintTargetsRegistry();
  const reticleRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const isSprayingRef = useRef(false);
  const zoomRef = useRef(0);

  const wideShotBase = useMemo(() => {
    const position = new THREE.Vector3(...wideShot.position);
    const target = new THREE.Vector3(...wideShot.target);
    const forward = target.clone().sub(position).normalize();
    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    return {
      position,
      target,
      forward,
      right,
      up,
      distance: position.distanceTo(target),
    };
  }, [wideShot]);

  const setSpraying = (next) => {
    if (isSprayingRef.current === next) return;
    isSprayingRef.current = next;
    onSprayingChange?.(next);
  };

  useEffect(() => {
    const dom = gl.domElement;
    const onDown = (e) => {
      if (e.button === 0) isPointerDownRef.current = true;
    };
    const onUp = () => {
      isPointerDownRef.current = false;
    };
    const onWheel = (e) => {
      if (mode !== 'paint') return;
      zoomRef.current = THREE.MathUtils.clamp(
        zoomRef.current - e.deltaY * ZOOM_METERS_PER_TICK,
        0,
        ZOOM_MAX_METERS
      );
    };
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl, mode]);

  useFrame((state) => {
    const { camera, pointer, raycaster } = state;
    const isPaintMode = mode === 'paint';

    if (mode === 'photo') {
      if (reticleRef.current) reticleRef.current.visible = false;
      setSpraying(false);
      return;
    }

    if (isPaintMode) {
      const base = wideShotBase;
      const yaw = pointer.x * MAX_YAW;
      const pitch = pointer.y * MAX_PITCH;
      tmpAimTarget
        .copy(base.target)
        .addScaledVector(base.right, Math.tan(yaw) * base.distance)
        .addScaledVector(base.up, Math.tan(pitch) * base.distance);
      camera.position
        .copy(base.position)
        .addScaledVector(base.forward, zoomRef.current);
      camera.lookAt(tmpAimTarget);
    }

    const targets = registry.getMeshes(isPaintMode ? 'paint' : 'ui');
    if (!targets.length) {
      if (reticleRef.current) reticleRef.current.visible = false;
      setSpraying(false);
      return;
    }

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(targets, false)[0];

    if (hit) {
      tmpNormal
        .copy(hit.face.normal)
        .transformDirection(hit.object.matrixWorld);
      // Flip backfacing normals so the reticle offsets toward the camera.
      camera.getWorldDirection(tmpForward);
      if (tmpNormal.dot(tmpForward) > 0) tmpNormal.negate();
      tmpReticlePos.copy(hit.point).addScaledVector(tmpNormal, 0.01);

      if (reticleRef.current) {
        reticleRef.current.visible = true;
        reticleRef.current.position.copy(tmpReticlePos);
        tmpAimObject.position.copy(tmpReticlePos);
        tmpAimObject.lookAt(tmpReticlePos.clone().add(tmpNormal));
        reticleRef.current.quaternion.copy(tmpAimObject.quaternion);
        // Much smaller reticle over the flat settings decals (todo item 58).
        reticleRef.current.scale.setScalar(isPaintMode ? 1 : 0.2);
      }
    } else if (reticleRef.current) {
      reticleRef.current.visible = false;
    }

    if (isPaintMode && handheldGroupRef?.current) {
      const group = handheldGroupRef.current;
      tmpHandheldPos
        .copy(HANDHELD_CAMERA_OFFSET)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
      const aimAt = hit
        ? hit.point
        : raycaster.ray.at(AIM_DISTANCE_NO_HIT, tmpAimTarget);
      tmpAimDir.subVectors(aimAt, tmpHandheldPos).normalize();

      // A real spray can is held mostly upright — nozzle on top, spraying
      // out horizontally — so instead of lookAt (which pointed the can's
      // BOTTOM at the camera, todo item 43) we yaw the can so its spray-out
      // side faces the aim and lean it a damped amount toward the aim's
      // vertical component.
      const yaw = Math.atan2(tmpAimDir.x, tmpAimDir.z);
      const pitch = Math.asin(THREE.MathUtils.clamp(tmpAimDir.y, -1, 1));
      group.position.copy(tmpHandheldPos);
      group.rotation.order = 'YXZ';
      group.rotation.set(-pitch * 0.6, yaw, 0);
    }

    const spraying = isPaintMode && isPointerDownRef.current && !!hit;
    setSpraying(spraying);

    if (!spraying) return;

    const entry = registry.getEntry(hit.object);
    if (!entry?.stamp || !hit.uv) return;

    const spread = THREE.MathUtils.clamp(
      hit.distance / SPREAD_REFERENCE_DISTANCE,
      0.6,
      2
    );

    entry.stamp({
      u: hit.uv.x,
      v: hit.uv.y,
      color: brush.color,
      size: brush.size * spread,
      hardness: brush.hardness / spread,
      brushTexture: brush.texture,
      dripChance: brush.dripChance,
      dripLengthScale: brush.dripLengthScale,
    });
  });

  return (
    <mesh ref={reticleRef} visible={false}>
      <ringGeometry args={[0.03, 0.045, 24]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.85}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

export default memo(PaintRig);
