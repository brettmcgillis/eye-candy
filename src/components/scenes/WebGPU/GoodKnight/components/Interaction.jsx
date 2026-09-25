import { memo, useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier';

import { Plane, Raycaster, Vector2, Vector3 } from 'three';

import { mulberry32 } from '@utils/noise2d';

import { PICK_GROUPS } from '../utils/ragdoll';
import { pierceGap, swordFrame } from '../utils/swordPlacement';

const STAB_REACH = 0.7;

// Pointer on the knight: grab mode hangs the hit body off a kinematic
// handle that follows the cursor on a camera-facing plane (release throws);
// stab mode drives a fresh sword in along the view ray.
function Interaction({
  blades,
  followRate,
  impalementsRef,
  mode,
  ragdoll,
  stab,
}) {
  const { camera, clock, controls, gl } = useThree();
  const { rapier, world } = useRapier();
  const drag = useRef(null);
  const rand = useRef(mulberry32(7));

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const segmentOf = new Map(
      Object.entries(ragdoll.bodies).map(([id, body]) => [body.handle, id])
    );

    const castFrom = (event) => {
      const rect = element.getBoundingClientRect();
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      return raycaster.ray;
    };

    const onDown = (event) => {
      if (event.button !== 0 || mode === 'off') return;
      const ray = castFrom(event);
      const hit = world.castRay(
        new rapier.Ray(ray.origin, ray.direction),
        100,
        true,
        undefined,
        PICK_GROUPS
      );
      if (!hit) return;
      const point = ray.at(hit.timeOfImpact, new Vector3());
      const { statue } = ragdoll;
      const hitBody = hit.collider.parent();
      const onCorpse =
        hitBody === statue?.body || segmentOf.has(hitBody.handle);
      const body = statue && onCorpse ? statue.body : hitBody;
      event.stopImmediatePropagation();

      if (mode === 'stab') {
        const segment =
          segmentOf.get(hitBody.handle) ??
          statue?.segmentOf.get(hit.collider.handle);
        const impalements = impalementsRef.current;
        if (!segment || !impalements) return;
        const r = rand.current;
        const variant = Math.floor(r() * blades.length);
        const far = 2;
        const back = hit.collider.castRay(
          new rapier.Ray(
            point.clone().addScaledVector(ray.direction, far),
            ray.direction.clone().negate()
          ),
          far,
          true
        );
        const thickness = back < 0 ? 0.3 : far - back;
        const gap = pierceGap(
          blades[variant].bladeLength,
          thickness,
          stab.pierceMin + r() * (stab.pierceMax - stab.pierceMin)
        );
        impalements.stab({
          distance: STAB_REACH,
          gap,
          now: clock.elapsedTime,
          segment,
          variant,
          world: swordFrame(
            ray.direction,
            r() * Math.PI * 2,
            point.clone().addScaledVector(ray.direction, -gap)
          ),
        });
        body.applyImpulseAtPoint(
          ray.direction.clone().multiplyScalar(stab.impulse),
          point,
          true
        );
        return;
      }

      const handle = world.createRigidBody(
        rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(
          point.x,
          point.y,
          point.z
        )
      );
      const t = body.translation();
      const inverse = body.rotation();
      const local = point
        .clone()
        .sub(new Vector3(t.x, t.y, t.z))
        .applyQuaternion({
          x: -inverse.x,
          y: -inverse.y,
          z: -inverse.z,
          w: inverse.w,
        });
      world.createImpulseJoint(
        rapier.JointData.spherical({ x: 0, y: 0, z: 0 }, local),
        handle,
        body,
        true
      );
      body.wakeUp();
      drag.current = {
        handle,
        plane: new Plane().setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new Vector3()).negate(),
          point
        ),
        position: point.clone(),
        target: point,
      };
      if (controls) controls.enabled = false;
      element.setPointerCapture(event.pointerId);
    };

    const onMove = (event) => {
      if (!drag.current) return;
      const ray = castFrom(event);
      const target = ray.intersectPlane(drag.current.plane, new Vector3());
      if (target) drag.current.target = target;
    };

    const onUp = (event) => {
      if (!drag.current) return;
      world.removeRigidBody(drag.current.handle);
      drag.current = null;
      if (controls) controls.enabled = true;
      if (element.hasPointerCapture(event.pointerId))
        element.releasePointerCapture(event.pointerId);
    };

    element.addEventListener('pointerdown', onDown, { capture: true });
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    return () => {
      element.removeEventListener('pointerdown', onDown, { capture: true });
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      if (drag.current) world.removeRigidBody(drag.current.handle);
      drag.current = null;
      if (controls) controls.enabled = true;
    };
  }, [
    blades,
    camera,
    clock,
    controls,
    gl,
    impalementsRef,
    mode,
    ragdoll,
    rapier,
    stab,
    world,
  ]);

  useBeforePhysicsStep(() => {
    if (!drag.current) return;
    const { handle, position, target } = drag.current;
    position.lerp(target, followRate);
    handle.setNextKinematicTranslation(position);
  });

  return null;
}

export default memo(Interaction);
