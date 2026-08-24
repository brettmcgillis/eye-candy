import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

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
// Cross-surface stamping (todo item 66): besides the center ray, four rays
// offset within the spray footprint catch neighboring surfaces (wall + curb
// at their seam) so a fat brush paints both sides of a boundary at once.
const FOOTPRINT_OFFSETS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const FOOTPRINT_REACH = 0.65;
// Fallback meters-per-UV-width for paint targets that don't report one
// (PaintableShell over arbitrary GLTF UVs).
const DEFAULT_WORLD_WIDTH = 4;
// Handheld-can dodge (todo item 64): as the cursor nears the can's corner of
// the screen, slide the can further right so the reticle stays visible.
const DODGE_START_X = -0.2;
const DODGE_FULL_X = -0.85;
const DODGE_OFFSET_X = 0.12;

// Nozzle tip in the handheld group's local (raw model) units: the can spans
// y 0..~6.72 after the element's base recentering, nozzle on top.
const NOZZLE_LOCAL = new THREE.Vector3(0, 6.55, 0);
// Visible paint mist (todo item 73): short-lived instanced droplets fired
// from the nozzle toward the hit point. Pool-sized for 60fps, not physics.
const MIST_COUNT = 64;
const MIST_EMIT_PER_SECOND = 240;
const MIST_CONE_JITTER = 0.09;

const tmpNormal = new THREE.Vector3();
const tmpReticlePos = new THREE.Vector3();
const tmpAimObject = new THREE.Object3D();
const tmpHandheldPos = new THREE.Vector3();
const tmpAimDir = new THREE.Vector3();
const tmpAimTarget = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpNozzle = new THREE.Vector3();
const tmpEmitDir = new THREE.Vector3();
const tmpCamRight = new THREE.Vector3();
const tmpCamUp = new THREE.Vector3();
const tmpOffsetPoint = new THREE.Vector3();
const tmpRayDir = new THREE.Vector3();
const tmpMistDir = new THREE.Vector3();
const tmpMistMatrix = new THREE.Matrix4();
const tmpMistQuat = new THREE.Quaternion();
const tmpMistScale = new THREE.Vector3();

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
  // Previous frame's hit per surface (mesh -> {u, v}) while spraying — lets
  // stamps draw connected segments on every surface the footprint touches
  // (fluid strokes, todo item 71; cross-surface stamping, todo item 66).
  // Entries for surfaces the footprint left are pruned each frame so a
  // re-entering stroke doesn't chain a segment across the gap.
  const lastStrokeMapRef = useRef(new Map());
  const dodgeRef = useRef(0);
  const mistRef = useRef(null);
  const mistPool = useMemo(
    () =>
      Array.from({ length: MIST_COUNT }, () => ({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        ttl: 0,
        size: 1,
      })),
    []
  );

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

  // Instances mount with identity matrices (64 unit spheres at the origin)
  // — collapse them all before the first painted frame.
  useLayoutEffect(() => {
    const mesh = mistRef.current;
    if (!mesh) return;
    tmpMistScale.setScalar(0);
    tmpMistMatrix.compose(tmpNozzle.set(0, 0, 0), tmpMistQuat, tmpMistScale);
    for (let i = 0; i < MIST_COUNT; i += 1) {
      mesh.setMatrixAt(i, tmpMistMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

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

  // Advances the droplet pool every frame; `emit` (nullable) respawns dead
  // droplets at the nozzle, aimed at the current hit. Dead droplets hide by
  // composing a zero scale — no per-frame allocation, no count changes.
  const updateMist = (delta, emit) => {
    const mesh = mistRef.current;
    if (!mesh) return;
    let emitBudget = emit ? Math.ceil(MIST_EMIT_PER_SECOND * delta) : 0;

    for (let i = 0; i < MIST_COUNT; i += 1) {
      const droplet = mistPool[i];
      if (droplet.life < droplet.ttl) {
        droplet.life += delta;
        droplet.position.addScaledVector(droplet.velocity, delta);
      } else if (emitBudget > 0) {
        emitBudget -= 1;
        droplet.position.copy(emit.origin);
        tmpMistDir.set(
          emit.direction.x + (Math.random() - 0.5) * MIST_CONE_JITTER * 2,
          emit.direction.y + (Math.random() - 0.5) * MIST_CONE_JITTER * 2,
          emit.direction.z + (Math.random() - 0.5) * MIST_CONE_JITTER * 2
        );
        tmpMistDir.normalize();
        // Fast enough to visibly connect can and wall; droplets die right
        // around impact so paint never appears to fly past the surface.
        const speed = THREE.MathUtils.clamp(emit.distance / 0.12, 4, 14);
        droplet.velocity
          .copy(tmpMistDir)
          .multiplyScalar(speed * (0.85 + Math.random() * 0.3));
        droplet.life = 0;
        droplet.ttl = (emit.distance / speed) * (0.8 + Math.random() * 0.35);
        droplet.size = 0.003 + Math.random() * 0.005;
      }

      const alive = droplet.life < droplet.ttl;
      tmpMistScale.setScalar(alive ? droplet.size : 0);
      tmpMistMatrix.compose(droplet.position, tmpMistQuat, tmpMistScale);
      mesh.setMatrixAt(i, tmpMistMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const { camera, pointer, raycaster } = state;
    const isPaintMode = mode === 'paint';

    if (mode === 'photo') {
      if (reticleRef.current) reticleRef.current.visible = false;
      setSpraying(false);
      lastStrokeMapRef.current.clear();
      updateMist(delta, null);
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
      lastStrokeMapRef.current.clear();
      updateMist(delta, null);
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
      // Slide the can right (damped) as the cursor heads far left, before
      // the can's silhouette can cover the work (todo item 64).
      const dodgeTarget = THREE.MathUtils.clamp(
        (DODGE_START_X - pointer.x) / (DODGE_START_X - DODGE_FULL_X),
        0,
        1
      );
      dodgeRef.current = THREE.MathUtils.damp(
        dodgeRef.current,
        dodgeTarget,
        8,
        delta
      );
      tmpHandheldPos.copy(HANDHELD_CAMERA_OFFSET);
      tmpHandheldPos.x += dodgeRef.current * DODGE_OFFSET_X;
      tmpHandheldPos.applyQuaternion(camera.quaternion).add(camera.position);
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

    if (!spraying) {
      lastStrokeMapRef.current.clear();
      updateMist(delta, null);
      return;
    }

    // Emit paint mist from the nozzle toward the hit. The handheld group's
    // transform was set above this frame, so refresh its world matrix before
    // converting the nozzle-tip offset.
    const handheldGroup = handheldGroupRef?.current;
    if (handheldGroup) {
      handheldGroup.updateMatrixWorld();
      tmpNozzle.copy(NOZZLE_LOCAL);
      handheldGroup.localToWorld(tmpNozzle);
      tmpEmitDir.subVectors(hit.point, tmpNozzle);
      const mistDistance = tmpEmitDir.length();
      updateMist(delta, {
        origin: tmpNozzle,
        direction: tmpEmitDir.normalize(),
        distance: mistDistance,
      });
      if (mistRef.current) mistRef.current.material.color.copy(brush.color);
    } else {
      updateMist(delta, null);
    }

    const entry = registry.getEntry(hit.object);
    if (!entry?.stamp || !hit.uv) return;

    const spread = THREE.MathUtils.clamp(
      hit.distance / SPREAD_REFERENCE_DISTANCE,
      0.6,
      2
    );

    // Segments chain per surface via the stroke map; a surface the footprint
    // just (re)entered starts fresh.
    const strokeMap = lastStrokeMapRef.current;
    const stampedThisFrame = new Set();
    const stampOn = (targetEntry, object, uv, sizeFraction) => {
      const last = strokeMap.get(object);
      targetEntry.stamp({
        u: uv.x,
        v: uv.y,
        fromU: last ? last.u : null,
        fromV: last ? last.v : null,
        color: brush.color,
        size: sizeFraction,
        hardness: brush.hardness / spread,
        opacity: brush.opacity,
        brushTexture: brush.texture,
        finish: brush.finish,
        dripChance: brush.dripChance,
        dripLengthScale: brush.dripLengthScale,
      });
      strokeMap.set(object, { u: uv.x, v: uv.y });
      stampedThisFrame.add(object);
    };

    const primarySize = brush.size * spread;
    stampOn(entry, hit.object, hit.uv, primarySize);

    // Cross-surface footprint (todo item 66): brush size is a fraction of
    // its surface's UV width, so convert through meters to size the same
    // physical spray on whichever neighboring surface the offset rays hit.
    const worldRadius = primarySize * (entry.worldWidth ?? DEFAULT_WORLD_WIDTH);
    tmpCamRight.setFromMatrixColumn(camera.matrixWorld, 0);
    tmpCamUp.setFromMatrixColumn(camera.matrixWorld, 1);
    for (let i = 0; i < FOOTPRINT_OFFSETS.length; i += 1) {
      const [ox, oy] = FOOTPRINT_OFFSETS[i];
      tmpOffsetPoint
        .copy(hit.point)
        .addScaledVector(tmpCamRight, ox * worldRadius * FOOTPRINT_REACH)
        .addScaledVector(tmpCamUp, oy * worldRadius * FOOTPRINT_REACH);
      tmpRayDir.subVectors(tmpOffsetPoint, camera.position).normalize();
      raycaster.set(camera.position, tmpRayDir);
      const sideHit = raycaster.intersectObjects(targets, false)[0];
      const isNewSurface =
        sideHit?.uv &&
        sideHit.object !== hit.object &&
        !stampedThisFrame.has(sideHit.object);
      if (isNewSurface) {
        const sideEntry = registry.getEntry(sideHit.object);
        if (sideEntry?.stamp) {
          const sideSize =
            worldRadius / (sideEntry.worldWidth ?? DEFAULT_WORLD_WIDTH);
          stampOn(sideEntry, sideHit.object, sideHit.uv, sideSize);
        }
      }
    }

    // Prune surfaces the footprint left so a later re-entry doesn't chain a
    // segment across the gap.
    strokeMap.forEach((_value, object) => {
      if (!stampedThisFrame.has(object)) strokeMap.delete(object);
    });
  });

  return (
    <>
      <mesh ref={reticleRef} visible={false}>
        <ringGeometry args={[0.03, 0.045, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={brush.opacity ?? 0.85}
          depthTest={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Paint mist droplets (todo item 73). Low-poly spheres instead of
          points so they render identically on the WebGPU path; dead droplets
          sit at scale 0. */}
      <instancedMesh
        ref={mistRef}
        args={[undefined, undefined, MIST_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial
          transparent
          opacity={Math.min(0.9, brush.opacity ?? 0.9)}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}

export default memo(PaintRig);
