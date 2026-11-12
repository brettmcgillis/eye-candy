const STUDIO_EXPERIMENTS = {
  contours: {
    label: '10 · Geometry-aware contours',
    title: 'The edges the camera can see',
    controls: 'Mesh contours',
    description:
      'Real mesh adjacency identifies silhouettes and sharp creases. Visibility is sampled against the mesh; hidden edges can be drawn separately.',
    instruction:
      'Orbit, change the crease angle, then reveal hidden edges. Compare the original surface with its brush contours.',
    use: 'Useful for illustrated geometry and technical drawings. These are sampled polygon contours, so low-poly silhouettes reveal the underlying tessellation.',
  },
  lightHatch: {
    label: '11 · Light-driven pencil',
    title: 'Shade with pencil strokes',
    controls: 'Light and marks',
    description:
      'Pencil marks sit on sampled triangles. Surface orientation and an occluding sphere determine which marks appear in shadow.',
    instruction:
      'Move the light azimuth. Increase hatch density or cross-hatching, then run motion to test surface attachment.',
    use: 'A bounded surface-sampling study for shaded Flora ornaments and illustrated solids. Marks use actual p5.brush pigment strips; lighting and sphere shadows are evaluated on the CPU.',
  },
  lightWash: {
    label: '12 · Light-driven watercolor',
    title: 'Light chooses the wash',
    controls: 'Light and marks',
    description:
      'A native watercolor painting is shaded in discrete tonal bands using surface normals, a moving light and sphere occlusion.',
    instruction:
      'Try two tonal bands, move the light and compare with the unpainted lighting reference. Watercolor fills changes the pigment.',
    use: 'Proves geometry-aware watercolor shading without repainting the canvas every frame. The test uses analytic sphere shadows; it is not a general scene shadow-map filter.',
  },
  stability: {
    label: '13 · Motion and mark stability',
    title: 'Can the drawing hold still?',
    controls: 'Mark stability',
    description:
      'The same moving curves are drawn with surface-attached pigment or repeatedly projected and repainted through the camera.',
    instruction:
      'Run motion. Compare surface attachment with camera repaint, then unlock the seed or retain previous ink.',
    use: 'Tests swimming, boiling, repaint cadence and trails before applying a drawn look to animation. Camera repaint has one brush job in flight and drops intermediate frames.',
  },
  space: {
    label: '14 · Draw in 3D space',
    title: 'Your gesture has depth',
    controls: 'Draw in space',
    description:
      'Drag to draw textured ribbons on a depth plane. Every finished gesture keeps its depth and pressure; orbit to inspect the drawing in space.',
    instruction:
      'Draw, change Drawing plane Z, and draw again. Disable Draw gestures to orbit. Use Clear space drawing to start over.',
    use: 'Tests spatial handwriting, occlusion and pressure. Pen input uses hardware pressure; mouse input can derive pressure from speed. The drawing plane is world XY.',
  },
  mapping: {
    label: '15 · Paint projection methods',
    title: 'Where does the paint belong?',
    controls: 'Paint projection',
    description:
      'Compare the original UV unwrap with a clipped geometric decal or three-axis, normal-weighted paint projection.',
    instruction:
      'Switch UV, decal and triplanar. Move the decal or change blend sharpness; run motion and test world anchoring.',
    use: 'Useful for avoiding UV seams and placing intentional marks. Triplanar sampling is baked into a triangle atlas, refreshed at a bounded cadence when world anchored.',
  },
  paperStudy: {
    label: '16 · Paper in three spaces',
    title: 'A surface, or the whole page?',
    controls: 'Paper anchoring',
    description:
      'Fibres can travel with the object, stay fixed in the world, or sit across the camera image. Surface fibres also affect lighting through bump.',
    instruction:
      'Run motion, change Grain space, then orbit. Compare grain contrast and fibre bump.',
    use: 'Distinguishes material paper from a screen overlay. Screen grain intentionally covers the image and has no physical bump.',
  },
  cutouts: {
    label: '17 · Painted cutouts',
    title: 'Give the painting an edge',
    controls: 'Cut paper',
    description:
      'A watercolor leaf is shown as a transparent card, a traced alpha contour, or extruded paper with a curled surface.',
    instruction:
      'Switch construction, add thickness and curl, then orbit to inspect edges and cast shadows.',
    use: 'For layered botanical sets, paper theatre and sculptural illustrations. The contour is traced from the actual brush image. Its shadow is projected onto the floor along the light direction; this bounded study does not compute self-shadows.',
  },
  masks: {
    label: '18 · Pigment as a material',
    title: 'Ink can change more than color',
    controls: 'Pigment as material',
    description:
      'Native brush layers create a deposited-coverage map independently of their color. Use it for roughness, bump, displacement or a clear glaze.',
    instruction:
      'Compare coverage and luminance, then change the material channel. Orbit to inspect the highlight or silhouette.',
    use: 'Coverage is accumulated from isolated pigment layers; luminance is derived from the finished painting. This demonstrates why a dark color alone is not a pigment-height measurement.',
  },
  printing: {
    label: '19 · Ink and registration',
    title: 'A painting becomes ink plates',
    controls: 'Ink separations',
    description:
      'The native painting is separated into limited inks, screened into rotated dots or lines, then recombined with registration offsets.',
    instruction:
      'Inspect each plate, change screen cell size and registration error, then return to the composite.',
    use: 'Tests print-inspired art direction. The separation is an optical-density approximation, not a calibrated printer profile or a print-ready color management workflow.',
  },
  particles: {
    label: '20 · Painted particle field',
    title: 'Paint suspended in motion',
    controls: 'Painted particles',
    description:
      'Instanced native brush stamps drift, age and fade in 3D. Compare simple particles with smoke, spray, pollen or painted leaves.',
    instruction:
      'Run motion, orbit and change stamp type. Toggle sorting, depth writing and the occluder to see transparency tradeoffs.',
    use: 'For painted smoke, clouds, pollen, drifting foliage and atmospheric depth. One instanced draw per field; CPU sorting and motion are bounded by the particle count.',
  },
};

export default STUDIO_EXPERIMENTS;
