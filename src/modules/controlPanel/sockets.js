import { rotate } from './parts';

export function collectSockets(modules) {
  const sockets = [];
  modules.forEach((module, owner) => {
    module.controls.forEach((control) => {
      const { offset, q, scale } = control.transform;
      control.sockets.forEach((socket, local) => {
        const scaled = socket.p.map((v) => v * scale);
        const position = q ? rotate(q, scaled) : scaled;
        sockets.push({
          ...socket,
          id: `${control.key}:${local}`,
          module: owner,
          p: position.map((v, axis) => v + offset[axis]),
          scale: socket.scale * scale,
        });
      });
    });
  });
  return sockets;
}

export function compatibleSockets(a, b) {
  return a.id !== b.id;
}
