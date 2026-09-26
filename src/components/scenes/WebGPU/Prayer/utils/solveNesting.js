import { Matrix4, Vector3 } from 'three';

const DEG = Math.PI / 180;
const SEARCH_SAMPLES = 4000;
const STEP = 1;

function boundsOf(sampleSets) {
  let minY = Infinity;
  let minZ = Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  sampleSets.forEach((samples) => {
    for (let i = 0; i < samples.length; i += 3) {
      minY = Math.min(minY, samples[i + 1]);
      maxY = Math.max(maxY, samples[i + 1]);
      minZ = Math.min(minZ, samples[i + 2]);
      maxZ = Math.max(maxZ, samples[i + 2]);
    }
  });
  return { minY, minZ, maxY, maxZ };
}

function createGrid(bounds, cellSize) {
  const cols = Math.max(
    1,
    Math.ceil((bounds.maxY - bounds.minY) / cellSize) + 1
  );
  const rows = Math.max(
    1,
    Math.ceil((bounds.maxZ - bounds.minZ) / cellSize) + 1
  );
  return {
    size: cols * rows,
    cellOf(y, z) {
      const cy = Math.floor((y - bounds.minY) / cellSize);
      const cz = Math.floor((z - bounds.minZ) / cellSize);
      if (cy < 0 || cz < 0 || cy >= cols || cz >= rows) return -1;
      return cz * cols + cy;
    },
  };
}

function centroidOf(samples) {
  const c = new Vector3();
  const n = samples.length / 3;
  for (let i = 0; i < samples.length; i += 3) {
    c.x += samples[i];
    c.y += samples[i + 1];
    c.z += samples[i + 2];
  }
  return c.divideScalar(Math.max(n, 1));
}

function subsample(samples, limit) {
  const n = samples.length / 3;
  if (n <= limit) return samples;
  const stride = Math.ceil(n / limit);
  const out = new Float32Array(Math.ceil(n / stride) * 3);
  let o = 0;
  for (let i = 0; i < n; i += stride) {
    out[o] = samples[i * 3];
    out[o + 1] = samples[i * 3 + 1];
    out[o + 2] = samples[i * 3 + 2];
    o += 3;
  }
  return out;
}

function concat(sets) {
  const out = new Float32Array(sets.reduce((n, s) => n + s.length, 0));
  let o = 0;
  sets.forEach((s) => {
    out.set(s, o);
    o += s.length;
  });
  return out;
}

function aboutPivot(pivot, rotation) {
  return new Matrix4()
    .makeTranslation(pivot.x, pivot.y, pivot.z)
    .multiply(rotation)
    .multiply(new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
}

function tiltMatrix(pivot, lean, turn, side) {
  return aboutPivot(
    pivot,
    new Matrix4()
      .makeRotationZ(lean * side)
      .multiply(new Matrix4().makeRotationY(-turn * side))
  );
}

function scanFace(samples, matrix, side, grid, face, reduce) {
  const e = matrix.elements;
  for (let i = 0; i < samples.length; i += 3) {
    const x = samples[i];
    const y = samples[i + 1];
    const z = samples[i + 2];
    const tx = e[0] * x + e[4] * y + e[8] * z + e[12];
    const ty = e[1] * x + e[5] * y + e[9] * z + e[13];
    const tz = e[2] * x + e[6] * y + e[10] * z + e[14];
    const cell = grid.cellOf(ty, tz);
    // eslint-disable-next-line no-param-reassign
    if (cell >= 0) face[cell] = reduce(face[cell], tx * side);
  }
  return face;
}

function innerFace(samples, matrix, side, grid) {
  const face = new Float32Array(grid.size).fill(Infinity);
  return scanFace(samples, matrix, side, grid, face, Math.min);
}

function growEnvelope(samples, matrix, side, grid, envelope) {
  return scanFace(samples, matrix, side, grid, envelope, Math.max);
}

function clearance(envelope, face) {
  let push = -Infinity;
  for (let c = 0; c < face.length; c += 1) {
    if (face[c] !== Infinity && envelope[c] !== -Infinity) {
      push = Math.max(push, envelope[c] - face[c]);
    }
  }
  return push;
}

function penetration(samples, matrix, envelope, side, grid) {
  return clearance(envelope, innerFace(samples, matrix, side, grid));
}

function crossing(samples, matrix, side, midplane) {
  const e = matrix.elements;
  let worst = -Infinity;
  for (let i = 0; i < samples.length; i += 3) {
    const x =
      e[0] * samples[i] + e[4] * samples[i + 1] + e[8] * samples[i + 2] + e[12];
    worst = Math.max(worst, (midplane - x) * side);
  }
  return worst;
}

function contactScore(envelope, face, push, band) {
  let touching = 0;
  let gapSum = 0;
  let overlap = 0;
  for (let c = 0; c < face.length; c += 1) {
    if (face[c] !== Infinity && envelope[c] !== -Infinity) {
      const gap = face[c] + push - envelope[c];
      overlap += 1;
      gapSum += Math.min(Math.abs(gap), band * 4);
      if (gap <= band && gap >= -band * 2) touching += 1;
    }
  }
  return overlap ? touching - gapSum / (band * overlap) : -Infinity;
}

function placePalm(samples, reach, envelope, side, grid, settings, gap) {
  const pivot = centroidOf(samples);
  const probe = subsample(samples, SEARCH_SAMPLES);
  const reachProbe = subsample(reach, SEARCH_SAMPLES);
  const steps = settings.maxTilt > 0 ? settings.tiltSteps : 0;
  let best = { lean: 0, turn: 0, score: -Infinity };

  for (let a = -steps; a <= steps; a += 1) {
    for (let b = -steps; b <= steps; b += 1) {
      const lean = steps ? (a / steps) * settings.maxTilt * DEG : 0;
      const turn = steps ? (b / steps) * settings.maxTilt * DEG : 0;
      const matrix = tiltMatrix(pivot, lean, turn, side);
      const push = clearance(envelope, innerFace(probe, matrix, side, grid));
      if (push !== -Infinity) {
        const penalty = (Math.abs(lean) + Math.abs(turn)) * 0.5;
        const face = innerFace(reachProbe, matrix, side, grid);
        const score =
          contactScore(envelope, face, push, settings.band) - penalty;
        if (score > best.score) best = { lean, turn, score };
      }
    }
  }

  const tilt = tiltMatrix(pivot, best.lean, best.turn, side);
  const push = penetration(samples, tilt, envelope, side, grid);
  if (push === -Infinity) return new Matrix4();
  return new Matrix4()
    .makeTranslation(side * (push + gap), 0, 0)
    .multiply(tilt);
}

function hingeTowardInside(samples, pivot, axis, side) {
  const before = centroidOf(samples);
  const probe = aboutPivot(pivot, new Matrix4().makeRotationAxis(axis, DEG));
  const after = before.clone().applyMatrix4(probe);
  return Math.sign((before.x - after.x) * side) || 1;
}

function swingAway(samples, pivot, envelope, side, grid, maxSwing, gap) {
  const axis = new Vector3(0, 0, 1);
  const direction = -hingeTowardInside(samples, pivot, axis, side);
  const probe = subsample(samples, SEARCH_SAMPLES);
  const at = (degrees) =>
    aboutPivot(
      pivot,
      new Matrix4().makeRotationAxis(axis, degrees * DEG * direction)
    );

  for (let d = 0; d <= maxSwing; d += STEP) {
    if (penetration(probe, at(d), envelope, side, grid) + gap <= 0) {
      return at(d);
    }
  }
  return at(maxSwing);
}

function transformed(point, matrix) {
  return point.clone().applyMatrix4(matrix);
}

function moved(samples, matrix) {
  const out = new Float32Array(samples.length);
  const v = new Vector3();
  for (let i = 0; i < samples.length; i += 3) {
    v.fromArray(samples, i).applyMatrix4(matrix).toArray(out, i);
  }
  return out;
}

function hingeAt(pivot, axis, degrees) {
  return aboutPivot(pivot, new Matrix4().makeRotationAxis(axis, degrees * DEG));
}

function flexAxis(from, to, side, samples) {
  const along = to.clone().sub(from).normalize();
  const axis = new Vector3().crossVectors(along, new Vector3(side, 0, 0));
  if (axis.lengthSq() < 1e-8) return null;
  axis.normalize();
  return axis.multiplyScalar(hingeTowardInside(samples, from, axis, side));
}

function curlJoint(own, rest, pivot, axis, next, context) {
  const { envelope, side, grid, settings, gap } = context;
  const ownProbe = subsample(own, SEARCH_SAMPLES);
  const restProbe = subsample(rest, SEARCH_SAMPLES);
  const touches = (samples, matrix) =>
    samples.length > 0 &&
    penetration(samples, matrix, envelope, side, grid) + gap > 0;
  const crosses = (samples, matrix) =>
    samples.length > 0 &&
    crossing(samples, matrix, side, settings.midplane) + gap > 0;
  const restFits = (matrix) => {
    const blocked = (m) => touches(restProbe, m) || crosses(restProbe, m);
    if (!restProbe.length || !blocked(matrix)) return true;
    if (!next) return false;
    const nextPivot = next.pivot.clone().applyMatrix4(matrix);
    const nextAxis = next.axis.clone().transformDirection(matrix);
    return !blocked(
      hingeAt(nextPivot, nextAxis, -settings.maxExtend).multiply(matrix)
    );
  };

  let settled = null;
  let contact = false;
  for (let d = -settings.maxExtend; d <= settings.maxCurl; d += STEP) {
    const matrix = hingeAt(pivot, axis, d);
    const ownTouches = touches(ownProbe, matrix);
    const fits = !ownTouches && !crosses(ownProbe, matrix) && restFits(matrix);
    if (!fits) {
      contact = ownTouches || touches(restProbe, matrix);
      break;
    }
    settled = d;
  }

  if (settled === null) return hingeAt(pivot, axis, -settings.maxExtend);
  if (!contact && settled >= 0) return new Matrix4();
  return hingeAt(pivot, axis, settled);
}

function curlFinger(finger, base, envelope, side, grid, settings, gap) {
  const context = { envelope, side, grid, settings, gap };
  const points = [...finger.joints, finger.tip];
  const matrices = [];
  let parent = base;

  finger.segments.forEach((segment, joint) => {
    const own = moved(segment, parent);
    const rest = moved(concat(finger.segments.slice(joint + 1)), parent);
    const pivot = transformed(points[joint], parent);
    const axis = flexAxis(
      pivot,
      transformed(points[joint + 1], parent),
      side,
      concat([own, rest])
    );
    if (!axis) {
      matrices.push(parent);
      return;
    }

    let next = null;
    if (joint + 1 < finger.segments.length) {
      const nextPivot = transformed(points[joint + 1], parent);
      const nextAxis = flexAxis(
        nextPivot,
        transformed(points[joint + 2], parent),
        side,
        rest
      );
      if (nextAxis) next = { pivot: nextPivot, axis: nextAxis };
    }

    parent = curlJoint(own, rest, pivot, axis, next, context).multiply(parent);
    matrices.push(parent);
  });
  return matrices;
}

function segmentsOf(hand) {
  const pairs = [
    ['arm', hand.arm],
    ['palm', hand.palm],
  ];
  hand.fingers.forEach((finger) => {
    finger.keys.forEach((key, i) => pairs.push([key, finger.segments[i]]));
  });
  return pairs;
}

function nestHand(hand, envelope, side, grid, settings, gap) {
  const reach = concat([
    hand.palm,
    ...hand.fingers.flatMap((finger) => finger.segments),
  ]);
  const palm = placePalm(hand.palm, reach, envelope, side, grid, settings, gap);
  const result = { arm: palm, palm };

  hand.fingers.forEach((finger) => {
    const matrices =
      settings.maxCurl > 0 || settings.maxExtend > 0
        ? curlFinger(finger, palm, envelope, side, grid, settings, gap)
        : finger.segments.map(() => palm);
    finger.keys.forEach((key, i) => {
      result[key] = matrices[i];
    });
  });

  const wrist = transformed(hand.wrist, palm);
  const armSamples = new Float32Array(hand.arm.length);
  const v = new Vector3();
  for (let i = 0; i < hand.arm.length; i += 3) {
    v.fromArray(hand.arm, i).applyMatrix4(palm).toArray(armSamples, i);
  }
  const swing = swingAway(
    armSamples,
    wrist,
    envelope,
    side,
    grid,
    settings.maxSwing,
    gap
  );
  result.arm = swing.multiply(palm);

  let residual = -Infinity;
  segmentsOf(hand).forEach(([key, samples]) => {
    residual = Math.max(
      residual,
      penetration(samples, result[key], envelope, side, grid),
      crossing(samples, result[key], side, settings.midplane)
    );
  });
  if (residual + gap > 0) {
    const shift = new Matrix4().makeTranslation(side * (residual + gap), 0, 0);
    Object.keys(result).forEach((key) => {
      result[key] = shift.clone().multiply(result[key]);
    });
  }
  return result;
}

function uniform(hand, matrix) {
  return Object.fromEntries(
    segmentsOf(hand).map(([key]) => [key, matrix.clone()])
  );
}

function sidesOf(hands) {
  const [a, b] = hands.map((hand) => centroidOf(hand.palm).x);
  return a >= b ? [1, -1] : [-1, 1];
}

export default function solveNesting(shells, options) {
  const settings = {
    gap: 0.004,
    maxTilt: 8,
    tiltSteps: 4,
    maxSwing: 30,
    maxCurl: 25,
    maxExtend: 10,
    cellSize: 0.012,
    midplane: 0,
    ...options,
  };
  settings.band = settings.band ?? settings.cellSize * 1.5;

  const all = shells.flatMap((shell) =>
    shell.hands.flatMap((hand) => segmentsOf(hand).map(([, s]) => s))
  );
  if (!all.length) {
    return shells.map((shell) =>
      shell.hands.map((hand) => uniform(hand, new Matrix4()))
    );
  }

  const grid = createGrid(boundsOf(all), settings.cellSize);
  const envelopes = {
    1: new Float32Array(grid.size).fill(-Infinity),
    [-1]: new Float32Array(grid.size).fill(-Infinity),
  };
  const grow = (hand, correction, side) => {
    segmentsOf(hand).forEach(([key, samples]) => {
      growEnvelope(samples, correction[key], side, grid, envelopes[side]);
    });
  };

  return shells.map((shell, shellIndex) => {
    const sides = sidesOf(shell.hands);
    const gap = settings.gap + (shell.extraGap || 0);

    if (shellIndex === 0) {
      const [pos, neg] = sides[0] === 1 ? [0, 1] : [1, 0];
      const faceOf = (hand, side) => {
        const face = new Float32Array(grid.size).fill(Infinity);
        segmentsOf(hand).forEach(([, samples]) => {
          scanFace(samples, new Matrix4(), side, grid, face, Math.min);
        });
        return face;
      };
      const posFace = faceOf(shell.hands[pos], 1);
      const negFace = faceOf(shell.hands[neg], -1);
      let closest = Infinity;
      for (let c = 0; c < grid.size; c += 1) {
        if (posFace[c] !== Infinity && negFace[c] !== Infinity) {
          closest = Math.min(closest, posFace[c] + negFace[c]);
        }
      }
      const half = closest === Infinity ? 0 : (gap - closest) / 2;
      settings.midplane =
        (centroidOf(shell.hands[pos].palm).x +
          centroidOf(shell.hands[neg].palm).x) /
        2;
      const corrections = [];
      [pos, neg].forEach((index, i) => {
        const side = i ? -1 : 1;
        const shift = new Matrix4().makeTranslation(side * half, 0, 0);
        corrections[index] = uniform(shell.hands[index], shift);
        grow(shell.hands[index], corrections[index], side);
      });
      return corrections;
    }

    return shell.hands.map((hand, handIndex) => {
      const side = sides[handIndex];
      const correction = nestHand(
        hand,
        envelopes[side],
        side,
        grid,
        settings,
        gap
      );
      grow(hand, correction, side);
      return correction;
    });
  });
}
