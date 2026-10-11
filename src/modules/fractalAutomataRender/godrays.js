// The postRig godrays slot for a Fractal Automata config. Its keys are the
// scene's own `godrays*` controls, so the effect's update reads them as-is.
export default function godraysSlot(config) {
  return {
    blendColor: config.godraysBlendColor,
    blur: config.godraysBlur,
    density: config.godraysDensity,
    distanceAttenuation: config.godraysDistanceAttenuation,
    edgeRadius: config.godraysEdgeRadius,
    edgeStrength: config.godraysEdgeStrength,
    enabled: config.godraysEnabled,
    id: 'godrays',
    light: 'center',
    maxDensity: config.godraysMaxDensity,
    prefix: 'godrays',
    raymarchSteps: config.godraysRaymarchSteps,
    type: 'godrays',
  };
}
