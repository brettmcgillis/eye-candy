import { createRng } from '@modules/flora';

import { distance, socketTop } from './patchUtils';
import { compatibleSockets } from './sockets';
import { linearOf } from './style';

export default function generatePatches(panel, config) {
  const rng = createRng(`${config.seed}:${config.patchSeed}:patch`);
  const sockets = [...panel.sockets];
  for (let i = sockets.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [sockets[i], sockets[j]] = [sockets[j], sockets[i]];
  }
  const occupied = new Set();
  const cables = [];
  const colors = [
    config.capColorA,
    config.capColorB,
    config.capColorC,
    config.knobColor,
  ];
  sockets.forEach((socket) => {
    if (occupied.has(socket.id) || rng() >= config.patchCableChance) return;
    occupied.add(socket.id);
    const candidates = sockets.filter(
      (s) => !occupied.has(s.id) && compatibleSockets(socket, s)
    );
    const target =
      candidates.length && rng() < config.patchConnectChance
        ? candidates[Math.floor(rng() * candidates.length)]
        : null;
    if (target) occupied.add(target.id);
    const a = socketTop(socket);
    const length = Math.max(
      0.8,
      target
        ? distance(a, socketTop(target)) * config.patchSlack + 0.5
        : (1.2 + rng() * 2.8) * config.patchSlack
    );
    const b = target
      ? socketTop(target)
      : [a[0] + (rng() - 0.5) * 0.7, a[1] - length * 0.8, a[2] + 0.35];
    const count = Math.max(16, Math.min(96, Math.ceil(length / 0.14)));
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const arc = Math.sin(Math.PI * t);
      points.push(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - arc * length * 0.2,
        a[2] + (b[2] - a[2]) * t + arc * length * 0.18
      );
    }
    cables.push({
      id: `cable-${cables.length}`,
      family: socket.family,
      ends: [socket.id, target?.id ?? null],
      scales: [socket.scale, target?.scale ?? socket.scale],
      endRadii: [socket.scale * 0.08, (target?.scale ?? socket.scale) * 0.08],
      color: linearOf(colors[Math.floor(rng() * colors.length)]),
      radius:
        (socket.family === 'quarter' ? 0.034 : 0.025) *
        Math.min(1, socket.scale),
      length,
      points,
    });
  });
  return cables;
}
