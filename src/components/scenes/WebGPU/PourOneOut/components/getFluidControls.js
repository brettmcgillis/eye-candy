import { folder } from 'leva';

export default function getFluidControls(p) {
  return folder(
    {
      showFluid: { label: 'Show Fluid', value: p.showFluid },
      // Solid writes depth and needs no sort, so it is the mode for a glossy
      // liquid; the blended modes are the volumetric ones.
      fluidRenderMode: {
        label: 'Render Mode',
        value: p.fluidRenderMode,
        options: ['Solid', 'Alpha', 'Additive'],
      },
      particleScale: {
        label: 'Particle Scale',
        value: p.particleScale,
        min: 0.3,
        max: 4,
        step: 0.05,
      },
      // 0 is a hard-edged bead, 1 is a puff with no core left.
      particleSoftness: {
        label: 'Softness',
        value: p.particleSoftness,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      fluidOpacity: {
        label: 'Opacity',
        value: p.fluidOpacity,
        min: 0.01,
        max: 1,
        step: 0.01,
      },
      particleMaxPixels: {
        label: 'Max Pixels',
        value: p.particleMaxPixels,
        min: 8,
        max: 256,
        step: 1,
      },
      Colour: folder(
        {
          fluidColorCold: { label: 'Cold', value: p.fluidColorCold },
          fluidColorWarm: { label: 'Warm', value: p.fluidColorWarm },
          fluidColorHot: { label: 'Hot', value: p.fluidColorHot },
          fluidEmissive: {
            label: 'Emissive',
            value: p.fluidEmissive,
            min: 0,
            max: 8,
            step: 0.05,
          },
          heatGain: {
            label: 'Heat Gain',
            value: p.heatGain,
            min: 0,
            max: 4,
            step: 0.05,
          },
          heatBias: {
            label: 'Heat Bias',
            value: p.heatBias,
            min: -1,
            max: 1,
            step: 0.01,
          },
          heatGamma: {
            label: 'Heat Gamma',
            value: p.heatGamma,
            min: 0.2,
            max: 4,
            step: 0.05,
          },
          speedHeat: {
            label: 'Speed Heat',
            value: p.speedHeat,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Shading: folder(
        {
          // 0 leaves the sprite flat; 1 shades it as the sphere its silhouette
          // already implies, which is what turns smoke into liquid.
          fluidShading: {
            label: 'Sphere Shading',
            value: p.fluidShading,
            min: 0,
            max: 1,
            step: 0.01,
          },
          fluidSpecular: {
            label: 'Specular',
            value: p.fluidSpecular,
            min: 0,
            max: 3,
            step: 0.01,
          },
          fluidGloss: {
            label: 'Gloss',
            value: p.fluidGloss,
            min: 2,
            max: 128,
            step: 1,
          },
          fluidRim: {
            label: 'Rim',
            value: p.fluidRim,
            min: 0,
            max: 2,
            step: 0.01,
          },
          fluidLightGain: {
            label: 'Light Gain',
            value: p.fluidLightGain,
            min: 0,
            max: 3,
            step: 0.01,
          },
          fluidAmbient: {
            label: 'Ambient',
            value: p.fluidAmbient,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      'Self-Shadow': folder(
        {
          // Absorption per grid cell along the ray to the key light. Obstacles
          // shadow the fluid through the same march.
          shadowDensity: {
            label: 'Fluid Density',
            value: p.shadowDensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          shadowSolid: {
            label: 'Solid Density',
            value: p.shadowSolid,
            min: 0,
            max: 4,
            step: 0.01,
          },
          shadowReach: {
            label: 'Reach (cells)',
            value: p.shadowReach,
            min: 4,
            max: 64,
            step: 1,
          },
          shadowBias: {
            label: 'Bias (cells)',
            value: p.shadowBias,
            min: 0,
            max: 6,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
      // Bitonic passes per frame. Only the blended modes need it, and the order
      // is allowed to trail the particles by a few frames.
      sortPasses: {
        label: 'Sort Passes',
        value: p.sortPasses,
        min: 0,
        max: 32,
        step: 1,
      },
    },
    { collapsed: true }
  );
}
