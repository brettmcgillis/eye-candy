function cSq(size, position, color) {
  return {
    size,
    position,
    color,
  };
}

function sq(size, position) {
  return cSq(size, position, 'white');
}

const FrameData1 = {
  settings: {
    paperDepth: 1 / 16,
    symmetric: true,
  },
  layers: [
    // 1
    [sq(1, [0, 0])],
    // 2
    [sq(2, [0, 0]), sq(1, [1.5, 1.5])],
    // 3
    [sq(2, [1.5, 1.5]), sq(1, [-0.75, 0.75])],
    // 4
    [
      sq(1, [0.75, 0.75]),
      sq(1, [0.75, 2.25]),
      sq(1, [2.25, 0.75]),
      sq(1, [2.25, 2.25]),
    ],
    // 5
    [
      sq(1, [-1.25, 1.25]),
      sq(1, [0, 1.5]),
      sq(1, [1.5, 0]),
      sq(1, [0.5, 2.5]),
      sq(1, [2.5, 0.5]),
      sq(1, [1.5, 3]),
      sq(1, [3, 1.5]),
      sq(1, [2.5, 2.5]),
    ],
    // 6
    [sq(2, [-1.25, 1.25])],
    // 7
    [sq(2, [0, 2.5]), sq(2, [2.5, 0]), sq(2, [2.5, 2.5]), sq(1, [-2, 2])],
  ],
};

export function getFrames() {
  return [{ name: '1', frame: FrameData1 }];
}

export function getFrameData(name) {
  return getFrames().find((f) => f.name === name)?.frame;
}
