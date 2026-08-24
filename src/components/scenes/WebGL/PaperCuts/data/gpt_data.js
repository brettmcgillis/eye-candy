import { sq } from '../utils/squareData';

const SHARED_SETTINGS = {
  paperDepth: 1 / 16,
};

const FRAME_SAFE_HALF_EXTENT = 3.5;

function quad(size, [x, y]) {
  return [
    sq(size, [x, y]),
    sq(size, [-x, y]),
    sq(size, [x, -y]),
    sq(size, [-x, -y]),
  ];
}

function octet(size, [x, y]) {
  return [...quad(size, [x, y]), ...quad(size, [y, x])];
}

function cardinal(size, distance) {
  return [
    sq(size, [0, distance]),
    sq(size, [distance, 0]),
    sq(size, [0, -distance]),
    sq(size, [-distance, 0]),
  ];
}

function mirrored(size, points) {
  return points.flatMap(([x, y]) => quad(size, [x, y]));
}

function woven(size, points) {
  return points.flatMap(([x, y]) => octet(size, [x, y]));
}

function opposites(size, [x, y]) {
  return [sq(size, [x, y]), sq(size, [-x, -y])];
}

function screenHorizontalPair(size, distance) {
  return opposites(size, [distance, -distance]);
}

function screenVerticalPair(size, distance) {
  return opposites(size, [distance, distance]);
}

function frontFirst(layers) {
  return [...layers].reverse();
}

function getFrameHalfExtent(layers) {
  return layers.reduce((frameMax, layer) => {
    return Math.max(
      frameMax,
      ...layer.map(({ size, position: [x, y] }) => {
        const halfSize = size / 2;
        return Math.max(Math.abs(x) + halfSize, Math.abs(y) + halfSize);
      })
    );
  }, 0);
}

function withFitScale(frame, targetHalfExtent = FRAME_SAFE_HALF_EXTENT) {
  const frameHalfExtent = getFrameHalfExtent(frame.layers);
  const dataScaleMultiplier =
    frameHalfExtent > targetHalfExtent ? targetHalfExtent / frameHalfExtent : 1;

  return {
    ...frame,
    settings: {
      ...frame.settings,
      dataScaleMultiplier,
    },
  };
}

export const gptBloom = {
  settings: SHARED_SETTINGS,
  layers: [
    [sq(1.5, [0, 0])],
    [...quad(1.15, [1.05, 1.05]), ...cardinal(0.85, 1.9)],
    [...octet(0.75, [0.6, 2.45]), ...quad(1.3, [1.95, 1.95])],
    [...cardinal(1, 3.05), ...octet(0.85, [1.25, 2.8])],
    [...quad(1.2, [2.85, 2.85]), ...octet(0.65, [2.55, 1.35])],
    [...cardinal(0.9, 3.65), ...octet(0.55, [1.65, 3.3])],
  ],
};

export const gptTide = {
  settings: SHARED_SETTINGS,
  layers: [
    [sq(1.25, [0, 0]), ...cardinal(0.95, 1.3)],
    [...octet(0.8, [0.65, 2.1]), ...quad(1.15, [1.3, 1.3])],
    [...cardinal(1.05, 2.55), ...quad(0.85, [2.05, 2.05])],
    [...octet(0.9, [1.05, 3]), ...quad(1.05, [2.7, 1.6])],
    [...quad(1.2, [3.15, 2.2]), ...octet(0.7, [0.85, 3.55])],
    [...cardinal(0.85, 4.05), ...quad(0.9, [3.45, 3.45])],
  ],
};

export const gptRosette = {
  settings: SHARED_SETTINGS,
  layers: [
    [sq(1.6, [0, 0])],
    [
      ...quad(1.15, [0.95, 0.95]),
      ...cardinal(0.7, 1.85),
      ...mirrored(0.55, [
        [0.45, 1.7],
        [1.7, 0.45],
      ]),
    ],
    [
      ...woven(0.85, [
        [0.6, 2.3],
        [1.2, 1.9],
      ]),
      ...quad(1.25, [1.9, 1.9]),
      ...mirrored(0.65, [
        [2.45, 0.95],
        [0.95, 2.45],
      ]),
    ],
    [
      ...cardinal(1, 2.95),
      ...woven(0.7, [
        [1.25, 2.75],
        [0.75, 3.2],
      ]),
      ...quad(0.8, [2.65, 1.45]),
    ],
    [
      ...quad(1.2, [2.8, 2.8]),
      ...woven(0.75, [
        [1.55, 3.35],
        [2.2, 2.5],
      ]),
      ...mirrored(0.6, [
        [3.35, 1.15],
        [1.15, 3.35],
      ]),
    ],
    [
      ...cardinal(0.95, 3.85),
      ...woven(0.65, [
        [0.55, 4.05],
        [1.95, 3.75],
      ]),
      ...quad(0.85, [3.7, 2.1]),
    ],
    [
      ...quad(1.1, [3.9, 3.9]),
      ...woven(0.6, [
        [1.35, 4.45],
        [2.65, 3.55],
      ]),
      ...mirrored(0.5, [
        [4.35, 2.35],
        [2.35, 4.35],
      ]),
    ],
    [
      ...cardinal(0.8, 4.9),
      ...woven(0.45, [
        [0.85, 4.95],
        [1.75, 4.6],
        [3.1, 4.15],
      ]),
      ...quad(0.7, [4.55, 3]),
    ],
  ],
};

export const gptLabyrinth = {
  settings: SHARED_SETTINGS,
  layers: [
    [sq(1.2, [0, 0]), ...cardinal(0.9, 1.25)],
    [
      ...quad(1, [1.15, 1.15]),
      ...mirrored(0.7, [
        [0.45, 2],
        [2, 0.45],
      ]),
      ...quad(0.6, [1.95, 1.95]),
    ],
    [
      ...woven(0.8, [
        [0.7, 2.6],
        [1.4, 2.1],
      ]),
      ...quad(1.05, [2.35, 1.45]),
      ...cardinal(0.75, 2.85),
    ],
    [
      ...mirrored(0.65, [
        [0.55, 3.35],
        [1.7, 2.95],
        [2.95, 1.7],
      ]),
      ...quad(0.95, [2.65, 2.65]),
      ...woven(0.55, [[1.05, 3.65]]),
    ],
    [
      ...cardinal(0.95, 4),
      ...woven(0.7, [
        [1.25, 4],
        [2.15, 3.25],
      ]),
      ...mirrored(0.6, [
        [3.55, 1.15],
        [3.2, 2.15],
      ]),
    ],
    [
      ...quad(1.05, [3.8, 2.4]),
      ...quad(1.05, [2.4, 3.8]),
      ...woven(0.6, [
        [0.75, 4.55],
        [1.75, 4.15],
        [2.75, 3.45],
      ]),
    ],
    [
      ...cardinal(0.8, 5.05),
      ...mirrored(0.55, [
        [1.2, 5],
        [2.2, 4.65],
        [3.45, 3.95],
      ]),
      ...quad(0.85, [4.35, 3.2]),
    ],
    [
      ...woven(0.45, [
        [0.95, 5.45],
        [1.55, 5.15],
        [2.6, 4.75],
        [3.7, 4.05],
      ]),
      ...quad(0.65, [4.85, 4.1]),
      ...mirrored(0.5, [
        [5.25, 2.4],
        [2.4, 5.25],
      ]),
    ],
  ],
};

export const gptEmbossedReliquary = withFitScale({
  settings: SHARED_SETTINGS,
  layers: frontFirst([
    [sq(10.8, [0, 0])],
    [sq(9.95, [0, 0])],
    [
      ...screenHorizontalPair(3.55, 2.55),
      ...screenVerticalPair(2.1, 4.85),
      ...screenHorizontalPair(1.2, 5.45),
    ],
    [
      ...screenHorizontalPair(2.75, 2.55),
      ...screenVerticalPair(1.25, 4.85),
      ...screenHorizontalPair(0.62, 5.45),
      ...opposites(0.85, [1.75, -3.35]),
      ...opposites(0.85, [3.35, -1.75]),
      ...opposites(0.7, [3.95, 4.65]),
      ...opposites(0.7, [4.65, 3.95]),
    ],
    [
      sq(2.25, [0, 0]),
      ...cardinal(0.95, 1.2),
      ...quad(0.75, [0.8, 0.8]),
      ...opposites(0.8, [2.1, -2.1]),
      ...opposites(0.65, [2.65, -2.65]),
      ...opposites(0.75, [4.15, -5.05]),
      ...opposites(0.75, [5.05, -4.15]),
      ...opposites(0.55, [4.35, 5.35]),
      ...opposites(0.55, [5.35, 4.35]),
    ],
    [
      ...screenHorizontalPair(1.5, 2.55),
      ...screenVerticalPair(0.8, 4.85),
      ...opposites(0.7, [1.25, -3.85]),
      ...opposites(0.7, [3.85, -1.25]),
      ...opposites(0.55, [3.45, 4.15]),
      ...opposites(0.55, [4.15, 3.45]),
      ...opposites(0.5, [5.75, -4.65]),
      ...opposites(0.5, [4.65, -5.75]),
    ],
    [
      ...screenHorizontalPair(0.9, 1.1),
      ...screenVerticalPair(0.65, 3.95),
      ...opposites(0.45, [0.4, 2.15]),
      ...opposites(0.45, [2.15, 0.4]),
      ...opposites(0.45, [2.85, -4.55]),
      ...opposites(0.45, [4.55, -2.85]),
    ],
  ]),
});

export const gptInterlockRelief = withFitScale({
  settings: SHARED_SETTINGS,
  layers: frontFirst([
    [...cardinal(3.6, 4.55)],
    [...quad(2, [1.7, 1.7]), ...cardinal(1.4, 2.65)],
    [
      sq(3.25, [0, 0]),
      ...quad(1.35, [2.35, 2.35]),
      ...opposites(1, [3.3, 1.2]),
      ...opposites(1, [1.2, 3.3]),
    ],
    [
      sq(2.6, [0, 0]),
      ...cardinal(1.1, 1.45),
      ...quad(0.9, [1, 3]),
      ...quad(0.9, [3, 1]),
    ],
    [
      sq(1.35, [0, 0]),
      ...screenVerticalPair(1.2, 2.7),
      ...screenHorizontalPair(0.95, 2.7),
      ...cardinal(0.9, 3.7),
    ],
    [
      ...quad(0.7, [1.85, 1.85]),
      ...opposites(0.7, [4.15, 2.25]),
      ...opposites(0.7, [2.25, 4.15]),
    ],
  ]),
});

const gptFrames = [
  { name: 'GPT Embossed Reliquary', frame: gptEmbossedReliquary },
  { name: 'GPT Interlock Relief', frame: gptInterlockRelief },
  { name: 'GPT Bloom', frame: gptBloom },
  { name: 'GPT Tide', frame: gptTide },
  { name: 'GPT Rosette', frame: gptRosette },
  { name: 'GPT Labyrinth', frame: gptLabyrinth },
];

export default gptFrames;
