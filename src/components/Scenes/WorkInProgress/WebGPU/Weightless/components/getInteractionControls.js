import { folder } from 'leva';

// Pointer interaction schema (PointerInput) + afterimage post (PostEffects).
export function getInteractionControls() {
  return {
    Interaction: folder(
      {
        interactionEnabled: { value: true, label: 'Enabled' },
        attractorMode: {
          value: 'attract',
          options: ['attract', 'repel'],
          label: 'Pointer Mode',
        },
        attractorStrength: { value: 6, min: 0, max: 40, label: 'Strength' },
        attractorRadius: { value: 1.5, min: 0.05, max: 10, label: 'Radius' },
        touchBoost: { value: 3, min: 1, max: 12, label: 'Touch Flow Boost' },
        touchRadiusScale: {
          value: 1,
          min: 0.2,
          max: 3,
          label: 'Touch Radius',
        },
      },
      { collapsed: true }
    ),
  };
}

export function getPostControls() {
  return {
    Post: folder(
      {
        afterimageEnabled: { value: false, label: 'Afterimage' },
        afterimageDamp: { value: 0.85, min: 0, max: 0.99, label: 'Damp' },
      },
      { collapsed: true }
    ),
  };
}
