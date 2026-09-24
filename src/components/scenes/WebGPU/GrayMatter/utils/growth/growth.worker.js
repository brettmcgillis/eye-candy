import SurfaceGrowthEngine from './engine';
import seedLoop from './seedLoop';
import createSurfaceProjector from './surfaceProjector';

let project = null;
let engine = null;
let timeline = [];

// Packs the curve as the tube shader reads it: points (xyz + curvature) and
// the surface normal under each point (w: length of the edge to the next).
function pack() {
  const curve = engine.curves[0];
  const count = curve.points.length;
  const points = new Float32Array(count * 4);
  const normals = new Float32Array(count * 4);
  curve.points.forEach((p, i) => {
    points.set([p.x, p.y, p.z, curve.curvature[i]], i * 4);
    const n = curve.normals[i];
    const q = curve.points[(i + 1) % count];
    normals.set(
      [n.x, n.y, n.z, Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z)],
      i * 4
    );
  });
  return { count, normals, points };
}

function reply(id, frame, keep) {
  const transfer = keep
    ? { ...frame, normals: frame.normals.slice(), points: frame.points.slice() }
    : frame;
  globalThis.postMessage({ frame: transfer, id }, [
    transfer.points.buffer,
    transfer.normals.buffer,
  ]);
}

globalThis.onmessage = ({ data }) => {
  if (data.type === 'surface') {
    project = createSurfaceProjector(data.surface);
    return;
  }
  if (data.type === 'start') {
    engine = new SurfaceGrowthEngine({ ...data.settings }, data.seed, project);
    engine.gradientBlur = data.gradientBlur;
    engine.setCurve(
      seedLoop(data.origin, data.normal, data.settings.targetEdgeLength),
      true
    );
    timeline = [];
    return;
  }
  if (data.type === 'settings') {
    if (engine) {
      Object.assign(engine.settings, data.settings);
      engine.gradientBlur = data.gradientBlur;
    }
    return;
  }
  if (data.type === 'step') {
    engine.step(data.dt, data.growthSpeed, data.seedInfluence);
    const frame = pack();
    if (data.record) timeline.push(frame);
    reply(data.id, frame, data.record);
    return;
  }
  if (data.type === 'frame') {
    const frame = timeline[Math.min(data.index, timeline.length - 1)];
    reply(data.id, frame, true);
  }
};
