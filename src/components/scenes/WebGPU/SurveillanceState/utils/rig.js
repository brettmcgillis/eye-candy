import { mulberry32 } from '@utils/noise2d';

export const TV_BOX = { min: [-0.4, 0, -0.471], max: [0.4, 0.523, 0.112] };

export const SCREEN = {
  center: [-0.0765, 0.2616, 0.09],
  width: 0.502,
  height: 0.394,
  uvMin: [0.0049, 0.1057],
  uvMax: [0.9948, 0.8868],
};

export const SCREEN_ASPECT = SCREEN.width / SCREEN.height;

export const CAMERA_MODEL = {
  plateZ: 0.041,
  plateBottom: 0.197,
  plateTop: 0.352,
  plateWidth: 0.202,
  lens: [0.002, 0.441, 0.49],
  armUnderside: [0, 0.255, 0.1],
};

export const POST_HALF = 0.024;
export const POST_BASE = { half: 0.13, height: 0.02 };
export const ADAPTER = { thickness: 0.012, margin: 0.02 };

const CABINET_BACK_Z = -0.206;

export const TV_COLLIDERS = [
  { min: [-0.4, 0, CABINET_BACK_Z], max: [0.4, 0.523, 0.112] },
  { min: [-0.2, 0, TV_BOX.min[2]], max: [0.2, 0.37, CABINET_BACK_Z] },
];

export const JACK_PANELS = [
  { center: [0, 0.18, TV_BOX.min[2]], size: [0.32, 0.27] },
  { center: [-0.295, 0.25, CABINET_BACK_Z], size: [0.13, 0.38] },
  { center: [0.295, 0.25, CABINET_BACK_Z], size: [0.13, 0.38] },
];

const BACK_PORTS = (() => {
  const ports = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      ports.push({
        side: 'back',
        position: [-0.13 + col * 0.065, 0.07 + row * 0.055, TV_BOX.min[2]],
        normal: [0, 0, -1],
      });
    }
  }
  [-1, 1].forEach((sign) => {
    for (let row = 0; row < 4; row += 1) {
      [0.26, 0.33].forEach((x) => {
        ports.push({
          side: 'back',
          position: [sign * x, 0.1 + row * 0.1, CABINET_BACK_Z],
          normal: [0, 0, -1],
        });
      });
    }
  });
  return ports;
})();

const FRONT_PORTS = (() => {
  const ports = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      ports.push({
        side: 'front',
        position: [0.225 + col * 0.045, 0.055 + row * 0.055, 0.1],
        normal: [0, 0, 1],
      });
    }
  }
  return ports;
})();

const lerp = (a, b, t) => a + (b - a) * t;
const toRadians = (deg) => (deg * Math.PI) / 180;

function shuffled(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function rotateY([x, y, z], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c + z * s, y, -x * s + z * c];
}

export function modelToWorld(camera, point) {
  const scaled = point.map((v) => v * camera.scale);
  const [x, y, z] = rotateY(scaled, camera.yaw);
  return [
    camera.position[0] + x,
    camera.position[1] + y,
    camera.position[2] + z,
  ];
}

function layoutCamera(index, settings, rng) {
  const {
    rigCount,
    rigSpread,
    rigDistanceMin,
    rigDistanceMax,
    rigHeightMin,
    rigHeightMax,
    rigScale,
  } = settings;
  const slot = rigCount === 1 ? 0.5 : index / (rigCount - 1);
  const jitter = (rng() - 0.5) * ((2 * rigSpread) / rigCount) * 0.6;
  const azimuth = toRadians(-rigSpread + 2 * rigSpread * slot + jitter);
  const distance = lerp(rigDistanceMin, rigDistanceMax, rng());
  const lensHeight = lerp(rigHeightMin, rigHeightMax, rng());
  const camera = {
    id: index,
    label: `CAM ${String(index + 1).padStart(2, '0')}`,
    scale: rigScale,
    yaw: azimuth + Math.PI,
    position: [
      Math.sin(azimuth) * distance,
      lensHeight - CAMERA_MODEL.lens[1] * rigScale,
      Math.cos(azimuth) * distance,
    ],
    sway: { phase: rng() * Math.PI * 2, rate: lerp(0.05, 0.14, rng()) },
  };
  const s = rigScale;
  const postZ = CAMERA_MODEL.plateZ - (ADAPTER.thickness + POST_HALF) / s;
  const postFoot = modelToWorld(camera, [0, 0, postZ]);
  const plateTopY = modelToWorld(camera, [0, CAMERA_MODEL.plateTop, 0])[1];
  const plateBottomY = modelToWorld(camera, [
    0,
    CAMERA_MODEL.plateBottom,
    0,
  ])[1];
  const side = rotateY([rng() < 0.5 ? -1 : 1, 0, 0], camera.yaw);
  const runOffset = POST_HALF + 0.007;
  const run = (y) => [
    postFoot[0] + side[0] * runOffset,
    y,
    postFoot[2] + side[2] * runOffset,
  ];

  return {
    ...camera,
    post: {
      position: [postFoot[0], 0, postFoot[2]],
      yaw: camera.yaw,
      height: plateTopY + 0.05,
      adapter: {
        centerY: (plateTopY + plateBottomY) / 2,
        width: CAMERA_MODEL.plateWidth * s + ADAPTER.margin,
        height: plateTopY - plateBottomY + ADAPTER.margin,
      },
    },
    cableRun: [
      modelToWorld(camera, CAMERA_MODEL.armUnderside),
      modelToWorld(camera, [0, CAMERA_MODEL.plateBottom - 0.03, 0.07]),
      run(plateBottomY - 0.06),
      run(plateBottomY * 0.5 + 0.03),
    ],
    cableStart: [run(0.07), run(0.05)],
  };
}

export function buildRig(settings) {
  const rng = mulberry32(Math.round(settings.seed) * 7919 + 13);
  const cameras = Array.from({ length: settings.rigCount }, (_, i) =>
    layoutCamera(i, settings, rng)
  );
  return {
    cameras,
    frontPorts: shuffled(FRONT_PORTS, rng),
    backPorts: shuffled(BACK_PORTS, rng),
  };
}
