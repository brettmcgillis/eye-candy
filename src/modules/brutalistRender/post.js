// Ships disabled (docs/scene-conventions.md §12). Grain is still: nothing
// in this scene moves but the fog.
const POST = {
  grain: { type: 'grain', amount: 0.05, animated: false, enabled: false },
  grade: {
    type: 'grade',
    enabled: false,
    letterbox: 0,
    tint: '#ffffff',
    vignette: 0.3,
  },
};

export default POST;
