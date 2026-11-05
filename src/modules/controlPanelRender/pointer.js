/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { dragHit, pickHit, pressHit, releaseHit } from '@modules/controlPanel';

import createPanelPicker from './picking';

const CURSORS = {
  rotary: 'ns-resize',
  step: 'pointer',
  toggle: 'pointer',
  latch: 'pointer',
  linear: 'grab',
  xy: 'move',
  ball: 'grab',
  pad: 'crosshair',
  pull: 'grab',
  stamp: 'pointer',
  set: 'pointer',
};

export default function connectPanelPointer({
  canvas,
  controls,
  getCamera,
  getSession,
  redraw = () => {},
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const { pick, socketUnderPointer } = createPanelPicker({
    canvas,
    getCamera,
    pointer,
  });
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.15);
  const point = new THREE.Vector3();
  let held = null;
  let restoreOrbit = true;
  const oldTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'none';

  // The pointer's ray in the panel's own frame: a scrolling panel sits
  // `session.offset` from the world's.
  function rayOf(event) {
    const camera = getCamera();
    if (!camera) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2
    );
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const [ox, oy] = getSession()?.offset ?? [0, 0];
    raycaster.ray.origin.x -= ox;
    raycaster.ray.origin.y -= oy;
    return raycaster.ray;
  }
  function coordinates(ray, z = 0.15) {
    plane.constant = -z;
    return ray.intersectPlane(plane, point) ? point.toArray() : null;
  }
  function finish(event, cancel = false) {
    if (!held || (event?.pointerId != null && event.pointerId !== held.pointer))
      return;
    if (held.patch) held.session.patch.release(cancel);
    else {
      held.session.apply(releaseHit(held.gesture, held.session.time));
      const stale =
        event?.timeStamp != null && event.timeStamp - held.time > 100;
      held.session.endGesture(held.gesture, cancel || stale);
    }
    held.unsubscribe?.();
    const pointerId = held.pointer;
    held = null;
    if (canvas.hasPointerCapture?.(pointerId))
      canvas.releasePointerCapture(pointerId);
    if (controls) controls.enabled = restoreOrbit;
    canvas.style.cursor = '';
    redraw();
  }
  function down(event) {
    if (held || event.button !== 0) return;
    const ray = rayOf(event);
    const session = getSession();
    if (!ray || !session || session.building) return;
    let picked = pick(ray, session);
    const p = coordinates(ray);
    const hit =
      !picked && p && pickHit(session.panel, p[0], p[1], session.read);
    if (!picked && !hit) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (picked) {
      if (picked.socket && !session.patch.occupant(picked.socket))
        picked = { ...session.spawn(picked.socket), point: picked.point };
      const selection = picked.socket
        ? session.patch.occupant(picked.socket)
        : picked;
      const rope = session.patch.world.ropes[selection.cable];
      const node =
        selection.end == null
          ? selection.node
          : rope.start + (selection.end === 0 ? 0 : rope.count - 1);
      const nodePoint = Array.from(
        session.patch.world.positions.subarray(node * 3, node * 3 + 3)
      );
      if (!session.patch.begin(picked, nodePoint)) return;
      held = {
        patch: true,
        session,
        pointer: event.pointerId,
        z: picked.point[2],
        offset: nodePoint.map((v, axis) => v - picked.point[axis]),
        point: picked.point,
      };
    } else {
      session.beginGesture(hit);
      const { gesture, set } = pressHit(hit, p, session.read, session.time);
      session.apply(set);
      if (!gesture) {
        redraw();
        return;
      }
      held = {
        gesture,
        session,
        pointer: event.pointerId,
        point: p,
        time: event.timeStamp,
      };
    }
    held.unsubscribe = session.onDispose(() => finish(null, true));
    restoreOrbit = controls?.enabled ?? true;
    if (controls) controls.enabled = false;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
    redraw();
  }
  function move(event) {
    const ray = rayOf(event);
    const session = getSession();
    if (!ray || !session) return;
    if (held) {
      if (held.pointer !== event.pointerId) return;
      if (held.session !== session || session.building) {
        finish(event, true);
        return;
      }
      const p = coordinates(ray, held.patch ? held.z : 0.15);
      if (!p) return;
      held.point = p;
      if (held.patch)
        session.patch.move(
          p.map((v, axis) => v + held.offset[axis]),
          socketUnderPointer(session, event),
          {
            origin: ray.origin.toArray(),
            direction: ray.direction.toArray(),
            offset: held.offset,
          }
        );
      else {
        session.apply(
          dragHit(held.gesture, p, (event.timeStamp - held.time) / 1000)
        );
        held.time = event.timeStamp;
      }
      event.preventDefault();
      redraw();
      return;
    }
    const p = coordinates(ray);
    const hit = p && pickHit(session.panel, p[0], p[1], session.read);
    canvas.style.cursor = pick(ray, session)
      ? 'grab'
      : (CURSORS[hit?.kind] ?? '');
  }
  const up = (event) => {
    if (held?.patch) move(event);
    finish(event);
  };
  const cancel = (event) => finish(event, true);
  canvas.addEventListener('pointerdown', down, true);
  canvas.addEventListener('pointermove', move, true);
  canvas.addEventListener('pointerup', up, true);
  canvas.addEventListener('pointercancel', cancel, true);
  canvas.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', cancel);
  return () => {
    finish(null, true);
    canvas.removeEventListener('pointerdown', down, true);
    canvas.removeEventListener('pointermove', move, true);
    canvas.removeEventListener('pointerup', up, true);
    canvas.removeEventListener('pointercancel', cancel, true);
    canvas.removeEventListener('lostpointercapture', cancel);
    window.removeEventListener('blur', cancel);
    canvas.style.touchAction = oldTouchAction;
  };
}
