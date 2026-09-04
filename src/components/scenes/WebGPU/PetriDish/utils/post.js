// Ordered post-processing chain consumed by useScenePostControls + PostRig.
// Slot ids drive the flat `post<Slot><Prop>` preset keys, so renaming one is a
// preset migration.
//
// Focus is `manual` rather than `target`: target mode needs a moving world
// point fed in through PostRig's `focusTarget`, and this scene has no such
// subject — the bed is the whole subject. Note that from the default overhead
// camera every grain sits at nearly the same depth, so the bokeh only really
// opens up once you orbit down to a raking angle.
const POST = {
  dof: {
    type: 'dof',
    bokehScale: 4,
    focalLength: 3,
    focusDistance: 9.5,
    focusMode: 'manual',
    focusSmoothing: 6,
  },
};

export default POST;
