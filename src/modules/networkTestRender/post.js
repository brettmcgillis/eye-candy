// Glow wants the mip bloom; ink turns it off and may take grain instead.
const POST = {
  bloom: { type: 'mipBloom', strength: 1.2, threshold: 0.6 },
  grade: { type: 'grade', letterbox: 0, tint: '#ffffff', vignette: 0.35 },
  grain: {
    type: 'grain',
    amount: 0.06,
    animated: true,
    enabled: false,
    scale: 1,
  },
};

export default POST;
