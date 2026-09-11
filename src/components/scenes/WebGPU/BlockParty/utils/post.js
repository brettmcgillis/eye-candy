// Ordered chain consumed by useScenePostControls + PostRig. The cards are
// shaded flat, so the ink is what separates two same-toned faces that meet;
// it runs lighter than it would over a lit render. Grain is the reference's
// closing move at 16/255, which is where 0.063 comes from.
const POST = {
  ink: {
    type: 'ink',
    color: '#000000',
    crease: 0.06,
    silhouette: 0.02,
    strength: 0.25,
    thickness: 1,
  },
  bloom: {
    type: 'bloom',
    radius: 0.5,
    strength: 0.35,
    threshold: 0.85,
  },
  grain: {
    type: 'grain',
    amount: 0.063,
    animated: true,
    scale: 1,
  },
};

export default POST;
