// A soft mip bloom over the lit object, then tint, vignette and letterbox.
const POST = {
  bloom: { type: 'mipBloom', strength: 0.6, threshold: 0.9 },
  grade: { type: 'grade', letterbox: 0, tint: '#ffffff', vignette: 0.3 },
};

export default POST;
