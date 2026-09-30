// The rect reference's present pass: its mip bloom, then tint, vignette and
// letterbox (the octree reference's present is the same with a cool tint).
const POST = {
  bloom: { type: 'mipBloom', strength: 1, threshold: 1 },
  grade: { type: 'grade', letterbox: 0, tint: '#ffffff', vignette: 0.2 },
};

export default POST;
