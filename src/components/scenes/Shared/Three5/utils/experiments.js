import ANIMATION_EXPERIMENTS from './animationExperiments';
import STUDIO_EXPERIMENTS from './studioExperiments';

export const EXPERIMENTS = {
  marks: {
    controls: 'Brush marks',
    instruction:
      'Choose a brush, then change Ink color and Stroke weight. The larger sample uses the selected brush.',
    label: '01 · Brush cabinet',
    title: 'A cabinet of marks',
    description:
      'Compare every built-in brush on the same pressure-sensitive curve. The selected brush draws the larger study below.',
    use: 'Use for pencilcrayon splines, charcoal contours, hatching and texture atlases.',
  },
  washes: {
    controls: 'Watercolor fills',
    instruction:
      'Try Bleed, Granulation and Edge pigment. Open Hatching for a drawn fill.',
    label: '02 · Watercolor paper',
    title: 'Water, pigment, paper',
    description:
      'Overlapping p5.brush fills. Compare watercolor with flat wash; change bleed, grain, edge pigment and color separation.',
    use: 'Use for paintings, petal cards, painted skies and paper illustrations. Flush between layers to compare dry and wet overlaps.',
  },
  materials: {
    controls: 'Mesh surface',
    instruction:
      'Change Mesh and Shading, then compare Paint bump and Texture repeat. Paint colors live in Watercolor fills.',
    label: '03 · Painted materials',
    title: 'Wrap a painting around a solid',
    description:
      'The painting becomes a color map. A separate grayscale image supplies bump and roughness. Orbit to inspect UV seams and stretching.',
    use: 'Use for painted sculpture, ceramics and Flora ornaments. Bump changes lighting; it does not change the silhouette.',
  },
  curves: {
    controls: '3D lines',
    instruction:
      'Try Line width and Curve form. Brush marks controls ink and pressure; equal pressures keep the stroke continuous.',
    label: '04 · Drawn curves in 3D',
    title: 'A pencil line with depth',
    description:
      'Textured pencil strokes follow 3D curves. The default uses steady pressure so each line stays readable as you orbit.',
    use: 'Use for stems, wireframes, trajectories and contours. The geometry has depth; each mark remains a flat textured ribbon.',
  },
  flora: {
    controls: 'Botanical shape',
    instruction:
      'Change the crown, segment budget and ornament count. Use 3D lines for stem width and Brush marks for ink.',
    label: '05 · Flora study',
    title: 'Botany in pencilcrayon',
    description:
      'The actual Flora kernel supplies stems, fibers, wire ornaments and solid placements. Brush ribbons and watercolor textures draw a budgeted study of it.',
    use: 'Use to evaluate a Flora renderer variant. Increase the segment budget to see more of the original specimen.',
  },
  water: {
    controls: 'Water volume',
    instruction:
      'Animated mode exposes water colors, opacity and waves. Static mode uses Watercolor fills. The submerged ring shows the tint; 3D lines controls the drawn edges.',
    label: '06 · Water + outlines',
    title: 'Water held by a drawn edge',
    description:
      'Animated water from Staying Afloat, bounded by drawn edges. Compare it with a static painted volume, or add the existing watercolor filter in WebGL.',
    use: 'Use to compare authored paint, drawn 3D edges and a screen-space filter independently. This study does not change Staying Afloat.',
  },
  layers: {
    controls: 'Planes in space',
    instruction:
      'Change plane count, depth and billboarding. Watercolor fills paints the cards; Brush marks draws their veins.',
    label: '07 · Painted space',
    title: 'An illustration you can walk around',
    description:
      'Transparent watercolor drawings on planes, distributed in depth. Orbit to reveal the construction; toggle billboarding and paper backing.',
    use: 'Use for botanical dioramas, painted clouds, foliage, stage sets and parallax illustrations.',
  },
  painting: {
    controls: 'Paint on mesh',
    instruction:
      'Drag to paint; disable Paint gestures to orbit. Mesh surface changes the object. Brush marks changes your drawing tool.',
    label: '08 · Paint a mesh',
    title: 'Leave a mark on the surface',
    description:
      'Enable Paint gestures and drag on the mesh to see live p5.brush marks on its UV texture. Release to finish the stroke. Disable painting to orbit.',
    use: 'Use for authored skins and interactive marks. UV seams split strokes; painting a sphere shows why a good unwrap matters.',
  },
  projection: {
    controls: 'Camera drawing',
    instruction:
      'Choose Compare to see both views. Orbit the source, then Repaint drawing, or enable Repaint on orbit end.',
    label: '09 · Redraw a 3D view',
    title: 'Geometry becomes a drawing',
    description:
      'Project a real 3D knot into 2D and redraw its visible triangles and sampled wire edges with p5.brush. Repaint after orbiting.',
    use: 'Use for illustrated stills and deliberate camera views. This is geometry-aware repainting, not an automatic filter for arbitrary scenes.',
  },
  ...STUDIO_EXPERIMENTS,
  ...ANIMATION_EXPERIMENTS,
};

export const BRUSHES = [
  '2B',
  'HB',
  '2H',
  'cpencil',
  'pen',
  'rotring',
  'spray',
  'marker',
  'crayon',
  'charcoal',
  'pastel',
  'Lab crayon',
  'Lab pastel',
];

export const FIELDS = [
  'none',
  'hand',
  'curved',
  'zigzag',
  'waves',
  'seabed',
  'spiral',
  'columns',
];
