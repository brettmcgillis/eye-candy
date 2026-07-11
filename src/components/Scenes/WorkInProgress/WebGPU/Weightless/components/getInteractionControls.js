import { folder } from 'leva';

// Pointer interaction schema (PointerInput) + afterimage post (PostEffects).
// `p` is the resolved initial-preset snapshot — see getParticleBirdControls.
export function getInteractionControls(p = {}) {
  return {
    Interaction: folder(
      {
        interactionEnabled: {
          value: p.interactionEnabled ?? true,
          label: 'Enabled',
        },
        attractorMode: {
          value: p.attractorMode ?? 'attract',
          options: ['attract', 'repel'],
          label: 'Pointer Mode',
        },
        attractorStrength: {
          value: p.attractorStrength ?? 6,
          min: 0,
          max: 40,
          label: 'Strength',
        },
        attractorRadius: {
          value: p.attractorRadius ?? 1.5,
          min: 0.05,
          max: 10,
          label: 'Radius',
        },
        touchBoost: {
          value: p.touchBoost ?? 3,
          min: 1,
          max: 12,
          label: 'Touch Flow Boost',
        },
        touchRadiusScale: {
          value: p.touchRadiusScale ?? 1,
          min: 0.2,
          max: 3,
          label: 'Touch Radius',
        },
      },
      { collapsed: true }
    ),
  };
}

export function getPostControls(p = {}) {
  return {
    Post: folder(
      {
        afterimageEnabled: {
          value: p.afterimageEnabled ?? false,
          label: 'Afterimage',
        },
        afterimageDamp: {
          value: p.afterimageDamp ?? 0.85,
          min: 0,
          max: 0.99,
          label: 'Damp',
        },
      },
      { collapsed: true }
    ),
  };
}
