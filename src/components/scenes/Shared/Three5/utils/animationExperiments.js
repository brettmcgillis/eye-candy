const ANIMATION_EXPERIMENTS = {
  washReveal: {
    label: '21 · Blooming watercolor',
    title: 'Let a wash find the paper',
    controls: 'Wash reveal',
    description:
      'A native watercolor painting appears through an irregular growing mask. Compare a central bloom, a sweep and several spreading spots.',
    instruction:
      'Use Animation timeline to pause, seek or change the cycle. Treatment display shows the mask; Paint target wraps it onto a sphere.',
    use: 'This animates the reveal of a baked painting. Edge softness and irregularity suggest a spreading wash; they do not simulate moving water or drying pigment.',
  },
  washMorph: {
    label: '22 · Morphing watercolor',
    title: 'A painting that breathes',
    controls: 'Morphing washes',
    description:
      'Petal boundaries change over time and p5.brush paints fresh watercolor fills. A locked seed helps steady the pigment; boiling changes it every repaint.',
    instruction:
      'Compare seed modes, shape movement and texture update rate. Pause before seeking to inspect a frame. Treatment shows the geometric shape reference.',
    use: 'Tests genuinely repainted animated fills for breathing petals, clouds and changing washes. Only one native paint job runs at a time; the previous image remains visible until the next frame is ready. This is not continuous fluid simulation.',
  },
  pigmentFlow: {
    label: '23 · Pigment in motion',
    title: 'Move pigment beneath the grain',
    controls: 'Pigment movement',
    description:
      'Swirl, drift or ripple a baked watercolor texture while its geometry and paper grain stay fixed. No native painting jobs run during motion.',
    instruction:
      'Change the motion pattern and strength, then try the sphere target. Treatment replaces the paint with a grid so the texture-coordinate motion is clear.',
    use: 'Tests inexpensive animated watercolor materials. A bounded UV mesh warps the paint; the paper overlay uses separate fixed coordinates. It moves an existing image and does not evolve pigment concentration.',
  },
  paintSequence: {
    label: '24 · Ink then watercolor',
    title: 'Watch an illustration take shape',
    controls: 'Painting sequence',
    description:
      'Native pencil outlines draw themselves and individual watercolor washes arrive in stages. Change their order or let ink and color grow together.',
    instruction:
      'Try ink then wash, wash then ink and together. Pause and seek through the timeline; Treatment isolates the developing pencil drawing.',
    use: 'The native ink and dry wash layers are baked once. Path masks reveal each pencil contour; layer fades compose the painting over time. This is animation choreography over p5.brush assets, driven by the existing scene clock.',
  },
};
export default ANIMATION_EXPERIMENTS;
