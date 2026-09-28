import * as THREE from 'three/webgpu';

// GrayMatter's differential growth on the dish instead of the skull: closed
// loops grow in a worker, which rasterises them into a ridge field. Presents
// the same surface as the reaction-diffusion solvers (update / inject / reseed
// / outputTexture / uniforms / dispose), `.r` the ridge height and `.g` the
// curvature under it, so the sand shades it with no code of its own.

export const GROWTH_SOLVER = 'differentialGrowth';

const RECORDS = 90;
const PLATEAU_WINDOW = 4;
const PLATEAU_GROWTH = 0.01;
const MAX_LOOP_RADIUS = 0.3;

const SETTING_KEYS = [
  'dgEdgeLength',
  'dgGradientBlur',
  'dgGrowthStep',
  'dgMaxVertices',
  'dgRepulsion',
  'dgShapeRetention',
  'dgSideBias',
  'dgSmoothing',
  'dgSplitThreshold',
];

function createUniforms() {
  const values = {
    bedRadius: 3.4,
    dgEdgeLength: 0.06,
    dgGradientBlur: 0.35,
    dgGrowDuration: 90,
    dgGrowthStep: 1.33,
    dgHoldDuration: 6,
    dgLineWidth: 0.05,
    dgLoop: 1,
    dgMaxVertices: 12000,
    dgRepulsion: 0.68,
    dgRestDuration: 1,
    dgRewindDuration: 6,
    dgSeed: 520671,
    dgSeedInfluence: 0.62,
    dgSeedOffset: 0.85,
    dgShapeRetention: 0,
    dgSideBias: 0,
    dgSimSpeed: 0.15,
    dgSmoothing: 0.14,
    dgSplitThreshold: 1.35,
  };
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { value }])
  );
}

const engineSettings = (u) => ({
  growthStep: u.dgGrowthStep.value,
  maxVertices: u.dgMaxVertices.value,
  repulsion: u.dgRepulsion.value,
  shapeRetention: u.dgShapeRetention.value,
  sideBias: u.dgSideBias.value,
  smoothing: u.dgSmoothing.value,
  splitThreshold: u.dgSplitThreshold.value,
  targetEdgeLength: u.dgEdgeLength.value,
});

export default function createGrowthField({ height, shape, width }) {
  const resolution = Math.min(width, height);
  const uniforms = createUniforms();
  const empty = () => new Uint8Array(resolution * resolution * 2);

  const outputTexture = new THREE.DataTexture(
    empty(),
    resolution,
    resolution,
    THREE.RGFormat,
    THREE.UnsignedByteType
  );
  outputTexture.minFilter = THREE.LinearFilter;
  outputTexture.magFilter = THREE.LinearFilter;
  outputTexture.wrapS = THREE.ClampToEdgeWrapping;
  outputTexture.wrapT = THREE.ClampToEdgeWrapping;
  outputTexture.generateMipmaps = false;
  outputTexture.needsUpdate = true;

  const worker = new Worker(new URL('./growth.worker.js', import.meta.url), {
    type: 'module',
  });

  let request = 0;
  let cycle = null;
  let cycleCount = 0;
  let loopRadius = 0.06;
  let lastSalt = null;
  let lastTime = null;
  let settingsKey = '';
  let bedShape = shape;

  const halfWidth = () =>
    uniforms.dgLineWidth.value / Math.max(uniforms.bedRadius.value, 1e-3);

  const sendBounds = () =>
    worker.postMessage({
      bounds: {
        margin: halfWidth() * 1.5,
        radius: uniforms.bedRadius.value,
        resolution,
        shape: bedShape,
      },
      type: 'bounds',
    });

  const send = (message) => {
    request += 1;
    cycle.busy = true;
    cycle.request = request;
    worker.postMessage({ ...message, halfWidth: halfWidth(), id: request });
  };

  const clearField = () => {
    outputTexture.image.data = empty();
    outputTexture.needsUpdate = true;
  };

  // A loop's inside stays empty however far it grows, so it starts against
  // the wall, like GrayMatter's loop at the jaw, and fills the dish from there.
  // The side it starts on changes every cycle.
  const start = () => {
    cycleCount += 1;
    sendBounds();
    const angle =
      (((uniforms.dgSeed.value + cycleCount) * 2.39996) % 1) * Math.PI * 2;
    const offset = uniforms.dgSeedOffset.value;
    worker.postMessage({
      gradientBlur: uniforms.dgGradientBlur.value,
      loop: {
        loopRadius,
        x: Math.cos(angle) * offset,
        z: Math.sin(angle) * offset,
      },
      seed: uniforms.dgSeed.value + cycleCount,
      settings: engineSettings(uniforms),
      type: 'start',
    });
    cycle = {
      busy: false,
      checkedAt: 0,
      checkedCount: 0,
      clock: 0,
      count: 0,
      recorded: 0,
      shown: -1,
      stage: 'grow',
    };
  };

  worker.onmessage = ({ data }) => {
    if (!cycle || data.id !== cycle.request) return;
    cycle.busy = false;
    cycle.count = data.count;
    if (cycle.stage === 'rest') return;
    outputTexture.image.data = data.field;
    outputTexture.needsUpdate = true;
  };
  worker.onerror = (event) => {
    // eslint-disable-next-line no-console
    console.error(`[PetriDish] growth worker failed: ${event.message}`);
  };

  const syncSettings = () => {
    const key = SETTING_KEYS.map((k) => uniforms[k].value).join('|');
    if (key === settingsKey) return;
    settingsKey = key;
    worker.postMessage({
      gradientBlur: uniforms.dgGradientBlur.value,
      settings: engineSettings(uniforms),
      type: 'settings',
    });
  };

  const grow = (dt) => {
    const u = uniforms;
    if (!cycle.busy) {
      const record =
        cycle.recorded < RECORDS &&
        cycle.clock >= (cycle.recorded / RECORDS) * u.dgGrowDuration.value;
      if (record) cycle.recorded += 1;
      send({
        dt: Math.min(dt, 1 / 60),
        growthSpeed: u.dgSimSpeed.value,
        record,
        seedInfluence: u.dgSeedInfluence.value,
        type: 'step',
      });
    }
    if (cycle.clock - cycle.checkedAt >= PLATEAU_WINDOW) {
      cycle.settled =
        cycle.clock > PLATEAU_WINDOW * 2 &&
        cycle.count < cycle.checkedCount * (1 + PLATEAU_GROWTH);
      cycle.checkedAt = cycle.clock;
      cycle.checkedCount = cycle.count;
    }
    const full = cycle.count >= u.dgMaxVertices.value;
    if (cycle.clock >= u.dgGrowDuration.value || full || cycle.settled) {
      cycle.stage = u.dgLoop.value ? 'hold' : 'done';
      cycle.clock = 0;
    }
  };

  function update(_renderer, time = 0) {
    const dt = lastTime === null ? 0 : Math.max(time - lastTime, 0);
    lastTime = time;
    syncSettings();
    if (!cycle) start();
    cycle.clock += dt;
    const u = uniforms;

    if (cycle.stage === 'grow') {
      grow(dt);
    } else if (
      cycle.stage === 'hold' &&
      cycle.clock >= u.dgHoldDuration.value
    ) {
      cycle.stage = 'rewind';
      cycle.clock = 0;
    } else if (cycle.stage === 'rewind') {
      const t = Math.min(
        cycle.clock / Math.max(u.dgRewindDuration.value, 1e-3),
        1
      );
      const index = Math.round((1 - t) * (cycle.recorded - 1));
      if (!cycle.busy && index !== cycle.shown) {
        cycle.shown = index;
        send({ index, type: 'frame' });
      }
      if (t >= 1) {
        cycle.stage = 'rest';
        cycle.clock = 0;
        clearField();
      }
    } else if (
      cycle.stage === 'rest' &&
      cycle.clock >= u.dgRestDuration.value
    ) {
      start();
    }
  }

  return {
    dispose: () => {
      worker.terminate();
      outputTexture.dispose();
    },
    // A drop plants a new loop where it lands, which grows into and pushes
    // against whatever is already there. SandField feeds one drop over several
    // frames, so repeat calls for the same drop are ignored.
    inject: (
      _renderer,
      { centerX = 0.5, centerY = 0.5, radius, salt } = {}
    ) => {
      if (salt !== undefined && salt === lastSalt) return;
      lastSalt = salt;
      if (!cycle || cycle.stage === 'rewind' || cycle.stage === 'rest') return;
      worker.postMessage({
        loop: {
          loopRadius: Math.min(radius ?? loopRadius, MAX_LOOP_RADIUS),
          x: centerX * 2 - 1,
          z: centerY * 2 - 1,
        },
        type: 'add',
      });
      if (cycle.stage !== 'grow') {
        cycle.stage = 'grow';
        cycle.clock = 0;
        cycle.checkedAt = 0;
        cycle.settled = false;
      }
    },
    outputTexture,
    reseed: (_renderer, { radius } = {}) => {
      loopRadius = Math.min(radius ?? loopRadius, MAX_LOOP_RADIUS);
      clearField();
      start();
    },
    setShape: (next) => {
      bedShape = next;
      sendBounds();
    },
    uniforms,
    update,
  };
}
