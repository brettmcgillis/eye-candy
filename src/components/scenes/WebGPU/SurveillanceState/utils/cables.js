import { createRopeWorld } from '@modules/ropePhysics';
import { mulberry32 } from '@utils/noise2d';

import { POST_BASE, POST_HALF, TV_COLLIDERS, buildRig } from './rig';
import { resample, routeBetween } from './routes';

const SPACING = 0.05;

const SLEEVES = [
  ['#0b0b0c', 5],
  ['#111112', 3],
  ['#17171a', 2],
];

function pickWeighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  const hit = entries.find(([, w]) => {
    roll -= w;
    return roll <= 0;
  });
  return (hit ?? entries[0])[0];
}

const portAnchors = (port) => [
  [
    port.position[0] + port.normal[0] * 0.035,
    port.position[1],
    port.position[2] + port.normal[2] * 0.035,
  ],
  port.position,
];

function sleeveFor(rng) {
  return pickWeighted(rng, SLEEVES);
}

function farPoint(rng, radius) {
  const angle = Math.PI * (0.55 + rng() * 0.9) + (rng() < 0.5 ? 0 : Math.PI);
  return [Math.sin(angle) * radius, 0.01, Math.cos(angle) * radius];
}

function plan(settings) {
  const rig = buildRig(settings);
  const rng = mulberry32(Math.round(settings.seed) * 104729 + 7);
  const front = [...rig.frontPorts];
  const back = [...rig.backPorts];
  const takePort = (wantFront) =>
    (wantFront && front.length ? front : back).pop() ?? front.pop();
  const cables = [];

  rig.cameras.forEach((camera) => {
    const port = takePort(rng() < settings.frontPortShare);
    cables.push({
      head: camera.cableStart,
      tail: portAnchors(port).reverse(),
      tailPort: port,
      run: camera.cableRun,
      ports: [],
      color: sleeveFor(rng),
      radius: 0.0065 + rng() * 0.003,
    });
  });

  for (let i = 0; i < settings.extraCables; i += 1) {
    const roll = rng();
    const port = takePort(rng() < 0.4);
    if (!port) break;
    const head = portAnchors(port);
    let tail = null;
    let free = false;
    let tailPort = null;
    if (roll < 0.35) tail = [farPoint(rng, 3 + rng() * 2)];
    else if (roll < 0.55) {
      const other = takePort(port.side === 'back');
      if (other) {
        tail = portAnchors(other).reverse();
        tailPort = other;
      }
    }
    if (!tail) {
      free = true;
      const angle = rng() * Math.PI * 2;
      const reach = 0.7 + rng() * 1.2;
      tail = [[Math.sin(angle) * reach, 0.01, Math.cos(angle) * reach]];
    }
    cables.push({
      head,
      tail,
      free,
      tailPort,
      ports: [port],
      color: sleeveFor(rng),
      radius: 0.005 + rng() * 0.005,
    });
  }

  return { rig, rng, cables };
}

const FLOOR_SINK = -0.2;

function colliders(rig) {
  const boxes = TV_COLLIDERS.map(({ min, max }) => ({
    min: [min[0], FLOOR_SINK, min[2]],
    max,
  }));
  rig.cameras.forEach(({ post }) => {
    const [x, , z] = post.position;
    const spread = Math.abs(Math.cos(post.yaw)) + Math.abs(Math.sin(post.yaw));
    const b = POST_BASE.half * spread;
    const p = POST_HALF * spread;
    boxes.push(
      {
        min: [x - b, FLOOR_SINK, z - b],
        max: [x + b, POST_BASE.height, z + b],
      },
      {
        min: [x - p, FLOOR_SINK, z - p],
        max: [x + p, post.height, z + p],
      }
    );
  });
  return boxes;
}

function layerOrder(count, rng) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function endDirection(points, fromEnd) {
  const n = points.length / 3;
  const a = fromEnd ? n - 2 : 1;
  const b = fromEnd ? n - 1 : 0;
  const d = [0, 1, 2].map((k) => points[b * 3 + k] - points[a * 3 + k]);
  const len = Math.hypot(...d) || 1;
  return d.map((v) => v / len);
}

function plugsFor(cable, points) {
  const plugs = cable.ports.map((port) => ({
    position: port.position,
    direction: port.normal,
    kind: port.side === 'front' ? 'rca' : 'bnc',
  }));
  if (cable.tail.length > 1 && cable.tailPort)
    plugs.push({
      position: cable.tailPort.position,
      direction: cable.tailPort.normal,
      kind: cable.tailPort.side === 'front' ? 'rca' : 'bnc',
    });
  if (cable.run)
    plugs.push({
      position: cable.run[0],
      direction: [0, -1, 0],
      kind: 'bnc',
    });
  if (cable.free) {
    const n = points.length / 3;
    plugs.push({
      position: Array.from(points.slice((n - 1) * 3, n * 3)),
      direction: endDirection(points, true),
      kind: cable.ports[0]?.side === 'front' ? 'rca' : 'bnc',
    });
  }
  return plugs;
}

export default function buildCables(settings) {
  const { rig, rng, cables } = plan(settings);
  const order = layerOrder(cables.length, rng);
  const routed = cables.map((cable, i) => {
    const y = 0.02 + order[i] * settings.cableDropStep;
    const path = routeBetween(rng, cable.head, cable.tail, y, {
      lateral: settings.cableWander,
      coilChance: settings.cableCoils,
    });
    return { ...cable, ...resample(path, SPACING) };
  });

  const world = createRopeWorld(
    routed.map((c) => ({
      points: Array.from(c.points),
      length: c.length * (1 + settings.cableSlack),
      radius: c.radius,
    })),
    {
      floor: 0,
      boxes: colliders(rig),
      iterations: settings.settleIterations,
      damping: 0.975,
      bending: 0.1,
      minCellSize: 0,
    }
  );

  routed.forEach((c, id) => {
    const { start, count } = world.ropes[id];
    const pin = (k) =>
      world.anchor(
        k,
        Array.from(c.points.slice((k - start) * 3, (k - start) * 3 + 3))
      );
    pin(start);
    pin(start + 1);
    if (!c.free) {
      pin(start + count - 1);
      if (c.tail.length > 1) pin(start + count - 2);
    }
  });

  world.settle(settings.settleTicks);

  return routed.map((c, id) => {
    const { start, count } = world.ropes[id];
    const settled = world.positions.slice(start * 3, (start + count) * 3);
    const run = c.run ?? [];
    const points = new Float32Array(run.length * 3 + settled.length);
    run.forEach((p, i) => points.set(p, i * 3));
    points.set(settled, run.length * 3);
    return {
      points,
      radius: c.radius,
      color: c.color,
      plugs: plugsFor(c, points),
    };
  });
}
