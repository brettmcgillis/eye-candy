import { hexToRgb, pickStop } from '@utils/paletteStops';

import { growState } from './motion';
import { hashUnit } from './noise';

export const SEGMENT_FLOATS = 16;
export const SPRITE_FLOATS = 8;
export const CLASSES = { bridge: 1, edge: 0, node: 0, pulse: 1, trail: 2 };
const ARC_STEPS = 14;
const TRAIL_STEPS = 5;
const PULSE_FADE_IN = 0.3;

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export const linearOf = (hex) => hexToRgb(hex).map(toLinear);
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const smooth = (x) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};

// One linear colour per placement: the node colour pulled toward a palette
// stop. Stops are dealt in a seeded order so neighbours rarely match.
export function placementColors(network, config, stops) {
  const base = linearOf(config.nodeColor);
  return network.placements.map((placement, index) => {
    if (!stops?.length || config.paletteMix <= 0) return base;
    const t = hashUnit(Math.round(config.pointSeed), index, 0, 91);
    return mix3(base, pickStop(stops, t).map(toLinear), config.paletteMix);
  });
}

function createWriter(stride, initial) {
  let data = new Float32Array(Math.max(initial, 64) * stride);
  let classes = new Uint8Array(Math.max(initial, 64));
  let count = 0;
  return {
    reset() {
      count = 0;
    },
    // Room for one more instance; returns its first float.
    next(cls) {
      if ((count + 1) * stride > data.length) {
        const grown = new Float32Array(data.length * 2);
        grown.set(data);
        data = grown;
        const grownClasses = new Uint8Array(classes.length * 2);
        grownClasses.set(classes);
        classes = grownClasses;
      }
      classes[count] = cls;
      count += 1;
      return { data, offset: (count - 1) * stride };
    },
    result() {
      return {
        classes: classes.subarray(0, count),
        count,
        data: data.subarray(0, count * stride),
      };
    },
  };
}

// Reusable output buffers for a caller that rebuilds every frame (the
// scene); anything that holds on to a result must not pass them.
export function createInstanceBuffers() {
  return {
    segments: createWriter(SEGMENT_FLOATS, 4096),
    sprites: createWriter(SPRITE_FLOATS, 2048),
  };
}

function writeSegment(writer, cls, a, b, width, ca, cb) {
  const { data: d, offset: o } = writer.next(cls);
  for (let c = 0; c < 3; c += 1) {
    d[o + c] = a[c];
    d[o + 4 + c] = b[c];
  }
  d[o + 3] = width;
  d[o + 7] = 0;
  for (let c = 0; c < 4; c += 1) {
    d[o + 8 + c] = ca[c];
    d[o + 12 + c] = cb[c];
  }
}

const pointOf = (positions, i) => [
  positions[i * 3],
  positions[i * 3 + 1],
  positions[i * 3 + 2],
];

// A bridge bows off its chord toward a per-edge direction; anything else is
// straight. `at(t)` walks the edge from a to b.
export function edgeCurve(positions, edge, config, seed) {
  const pa = pointOf(positions, edge.a);
  const pb = pointOf(positions, edge.b);
  const bend = edge.rule === 'bridge' ? config.bridgeArc : 0;
  if (bend <= 0) {
    return { at: (t) => mix3(pa, pb, t), steps: 1 };
  }
  const chord = pb.map((v, i) => v - pa[i]);
  const length = Math.hypot(...chord) || 1;
  const dir = chord.map((v) => v / length);
  const theta = hashUnit(seed, edge.a, edge.b, 3) * Math.PI * 2;
  const z = hashUnit(seed, edge.a, edge.b, 4) * 2 - 1;
  const r = Math.sqrt(1 - z * z);
  const random = [r * Math.cos(theta), z, r * Math.sin(theta)];
  const side = [
    dir[1] * random[2] - dir[2] * random[1],
    dir[2] * random[0] - dir[0] * random[2],
    dir[0] * random[1] - dir[1] * random[0],
  ];
  const sideLength = Math.hypot(...side) || 1;
  const control = pa.map(
    (v, i) => (v + pb[i]) / 2 + (side[i] / sideLength) * length * bend * 0.5
  );
  return {
    at: (t) =>
      pa.map(
        (v, i) =>
          (1 - t) * (1 - t) * v + 2 * (1 - t) * t * control[i] + t * t * pb[i]
      ),
    steps: ARC_STEPS,
  };
}

const lerp4 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// `colorAt(t)` is the linear rgba at curve parameter t.
function writeRun(writer, curve, [t0, t1], width, colorAt, cls) {
  const steps = Math.max(1, Math.ceil(curve.steps * Math.abs(t1 - t0)));
  let prevT = t0;
  let prev = curve.at(t0);
  for (let s = 1; s <= steps; s += 1) {
    const t = t0 + ((t1 - t0) * s) / steps;
    const next = curve.at(t);
    writeSegment(writer, cls, prev, next, width, colorAt(prevT), colorAt(t));
    prev = next;
    prevT = t;
  }
}

// Everything the rig and the plot draw for one frame, as flat vec4 runs:
// segments are start+width, end, colourA, colourB; sprites are
// centre+radius, colour+alpha. Colours are linear and carry intensity.
export default function buildInstances({
  config,
  edges = null,
  grow = null,
  network,
  positions = network.positions,
  pulseAlpha = 1,
  buffers = null,
  pulses = null,
  stops = null,
}) {
  const seed = Math.round(config.wireSeed);
  const pointSeed = Math.round(config.pointSeed);
  const groupColor = placementColors(network, config, stops);
  const edgeBase = linearOf(config.edgeColor);
  const bridgeBase = linearOf(config.bridgeColor);
  const sourceMix = network.rgb ? config.imageColor : 0;
  const sourced = (i, color) => {
    if (sourceMix <= 0 || network.rgb[i * 3] < 0) return color;
    const source = [0, 1, 2].map((c) =>
      network.rgb[i * 3 + c] <= 0.04045
        ? network.rgb[i * 3 + c] / 12.92
        : ((network.rgb[i * 3 + c] + 0.055) / 1.055) ** 2.4
    );
    return mix3(color, source, sourceMix);
  };
  const growing = growState(network, grow);
  const list = edges ?? network.edges;
  const fadeLength = Math.max(network.spacing * 6, 1e-4);
  const { segments, sprites } = buffers ?? {
    segments: createWriter(SEGMENT_FLOATS, list.length * 2),
    sprites: createWriter(SPRITE_FLOATS, network.count),
  };
  segments.reset();
  sprites.reset();
  const pa = [0, 0, 0];
  const pb = [0, 0, 0];

  list.forEach((edge) => {
    const bridge = edge.rule === 'bridge';
    let alpha = config.edgeOpacity * (edge.alpha ?? 1);
    if (!bridge && config.lengthFade > 0) {
      alpha *= 1 - config.lengthFade * smooth(edge.length / fadeLength);
    }
    let span = [0, 1];
    if (growing) {
      const state = growing.edge(edge);
      if (state.reveal <= 0) return;
      alpha *= state.alpha;
      span = state.from === 'a' ? [0, state.reveal] : [1, 1 - state.reveal];
    }
    if (alpha <= 0.002) return;
    const endColor = (i) =>
      bridge
        ? bridgeBase
        : sourced(
            i,
            mix3(edgeBase, groupColor[network.group[i]], config.edgeTint)
          );
    const scale = config.edgeIntensity;
    const ca = endColor(edge.a);
    const cb = endColor(edge.b);
    const colorA = [ca[0] * scale, ca[1] * scale, ca[2] * scale, alpha];
    const colorB = [cb[0] * scale, cb[1] * scale, cb[2] * scale, alpha];
    const width = config.edgeWidth * (bridge ? 1.3 : 1);
    const cls = bridge ? CLASSES.bridge : CLASSES.edge;
    if (bridge && config.bridgeArc > 0) {
      writeRun(
        segments,
        edgeCurve(positions, edge, config, seed),
        span,
        width,
        (t) => lerp4(colorA, colorB, t),
        cls
      );
      return;
    }
    for (let c = 0; c < 3; c += 1) {
      const from = positions[edge.a * 3 + c];
      const to = positions[edge.b * 3 + c];
      pa[c] = from + (to - from) * span[0];
      pb[c] = from + (to - from) * span[1];
    }
    writeSegment(
      segments,
      cls,
      pa,
      pb,
      width,
      span[0] === 0 ? colorA : lerp4(colorA, colorB, span[0]),
      span[1] === 1 ? colorB : lerp4(colorA, colorB, span[1])
    );
  });

  if (config.nodeShare > 0 && config.nodeSize > 0) {
    for (let i = 0; i < network.count; i += 1) {
      if (hashUnit(pointSeed, i, 0, 17) < config.nodeShare) {
        const alpha = growing ? growing.node(i) : 1;
        if (alpha > 0.002) {
          const hub = Math.max(Math.sqrt(network.degree[i] ?? 0) - 1, 0);
          const color = sourced(i, groupColor[network.group[i]]);
          const { data: d, offset: o } = sprites.next(CLASSES.node);
          d[o] = positions[i * 3];
          d[o + 1] = positions[i * 3 + 1];
          d[o + 2] = positions[i * 3 + 2];
          d[o + 3] = config.nodeSize * (1 + config.nodeHubScale * hub * 0.5);
          d[o + 4] = color[0] * config.nodeIntensity;
          d[o + 5] = color[1] * config.nodeIntensity;
          d[o + 6] = color[2] * config.nodeIntensity;
          d[o + 7] = alpha;
        }
      }
    }
  }

  if (pulses && pulseAlpha > 0.002 && config.pulseSize > 0) {
    const live = edges ? { ...network, edges } : network;
    const edgeOf = new Map(
      live.edges.map((edge) => [edge.a * network.count + edge.b, edge])
    );
    const color = linearOf(config.pulseColor).map(
      (c) => c * config.pulseIntensity
    );
    pulses.forEach((pulse) => {
      if (pulse.from < 0) return;
      const lo = Math.min(pulse.from, pulse.to);
      const hi = Math.max(pulse.from, pulse.to);
      const edge = edgeOf.get(lo * network.count + hi) ?? {
        a: lo,
        b: hi,
        rule: 'edge',
      };
      const curve = edgeCurve(positions, edge, config, seed);
      const forward = pulse.from === edge.a;
      const t = forward ? pulse.progress : 1 - pulse.progress;
      const alpha = pulseAlpha * smooth(pulse.age / PULSE_FADE_IN);
      const { data: d, offset: o } = sprites.next(CLASSES.pulse);
      d.set([...curve.at(t), config.pulseSize, ...color, alpha], o);
      if (config.pulseTrail > 0) {
        const tail = forward
          ? Math.max(t - config.pulseTrail, 0)
          : Math.min(t + config.pulseTrail, 1);
        const glow = color.map((c) => c * 0.5);
        const reach = t - tail || 1;
        writeRun(
          segments,
          { at: curve.at, steps: TRAIL_STEPS },
          [tail, t],
          config.edgeWidth * 1.8,
          (p) => [...glow, alpha * smooth((p - tail) / reach)],
          CLASSES.trail
        );
      }
    });
  }

  return { segments: segments.result(), sprites: sprites.result() };
}
