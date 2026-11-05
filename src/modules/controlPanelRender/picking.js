import * as THREE from 'three/webgpu';

import { PLUG_LENGTH, plugDirection } from '@modules/controlPanel';

export default function createPanelPicker({ canvas, getCamera, pointer }) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const rayPoint = new THREE.Vector3();
  const segmentPoint = new THREE.Vector3();
  const direction = new Float64Array(3);
  function pick(ray, session) {
    if (session.building) return null;
    const { patch } = session;
    const camera = getCamera();
    const { height } = canvas.getBoundingClientRect();
    const pixelRadius = (distanceSquared, pixels) => {
      const span = camera.isOrthographicCamera
        ? (camera.top - camera.bottom) / camera.zoom
        : (2 *
            Math.sqrt(distanceSquared) *
            Math.tan((camera.fov * Math.PI) / 360)) /
          camera.zoom;
      return (span * pixels) / height;
    };
    let best = null;
    let depth = Infinity;
    const p = patch.world.positions;
    patch.world.ropes.forEach((rope, cable) => {
      for (let i = 0; i < rope.count - 1; i += 1) {
        const node = rope.start + i;
        a.fromArray(p, node * 3);
        b.fromArray(p, (node + 1) * 3);
        const d = ray.distanceSqToSegment(a, b, rayPoint, segmentPoint);
        const radius =
          i < 2 || i >= rope.count - 3
            ? 0.12 * Math.max(...patch.cables[cable].scales)
            : rope.radius + 0.045;
        const t = ray.origin.distanceToSquared(rayPoint);
        if (d < Math.max(radius, pixelRadius(t, 5)) ** 2 && t < depth) {
          depth = t;
          let end = null;
          if (i < 2) end = 0;
          if (i >= rope.count - 3) end = 1;
          best = { cable, end, node, point: segmentPoint.toArray() };
        }
      }
    });
    patch.world.ropes.forEach((rope, cable) => {
      for (let end = 0; end < 2; end += 1) {
        const node = rope.start + (end === 0 ? 0 : rope.count - 1);
        plugDirection(patch, cable, end, direction);
        a.fromArray(p, node * 3);
        const scale = patch.cables[cable].scales[end];
        b.set(
          a.x - direction[0] * PLUG_LENGTH * scale,
          a.y - direction[1] * PLUG_LENGTH * scale,
          a.z - direction[2] * PLUG_LENGTH * scale
        );
        const d = ray.distanceSqToSegment(a, b, rayPoint, segmentPoint);
        const t = ray.origin.distanceToSquared(rayPoint);
        if (
          d < Math.max(0.1, 0.12 * scale, pixelRadius(t, 9)) ** 2 &&
          t < depth
        ) {
          depth = t;
          best = { cable, end, node, point: segmentPoint.toArray() };
        }
      }
    });
    patch.sockets.forEach((socket) => {
      a.set(socket.p[0], socket.p[1], socket.p[2] + 0.1);
      const d = ray.distanceSqToPoint(a);
      const t = ray.origin.distanceToSquared(a);
      if (d < (0.14 * socket.scale) ** 2 && t < depth) {
        best = { socket: socket.id, point: a.toArray() };
        depth = t;
      }
    });
    return best;
  }
  function socketUnderPointer(session, event) {
    const camera = getCamera();
    const rect = canvas.getBoundingClientRect();
    const radius = event.pointerType === 'touch' ? 22 : 14;
    let nearest = radius;
    let socketId = null;
    const [ox, oy] = session.offset ?? [0, 0];
    session.patch.sockets.forEach((socket) => {
      if (session.patch.occupant(socket.id)) return;
      a.set(socket.p[0] + ox, socket.p[1] + oy, socket.p[2]).project(camera);
      if (a.z < -1 || a.z > 1) return;
      const distance = Math.hypot(
        ((a.x - pointer.x) * rect.width) / 2,
        ((a.y - pointer.y) * rect.height) / 2
      );
      if (distance < nearest) {
        nearest = distance;
        socketId = socket.id;
      }
    });
    return socketId;
  }
  return { pick, socketUnderPointer };
}
