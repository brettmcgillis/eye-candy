import { folder } from 'leva';

export default function getGridControls(p) {
  return folder(
    {
      showGrid: { label: 'Show Grid', value: p.showGrid },
      gridColor: { label: 'Color', value: p.gridColor },
      // Which octree level each class of content refines down to. 0 is the
      // finest box, 4 the coarsest, so fluid at 0 and obstacles at 1 or 2 give
      // the reference's three tiers: tight at the pour, medium on the pins,
      // largest through empty space.
      gridFluidLevel: {
        label: 'Fluid Detail',
        value: p.gridFluidLevel,
        min: 0,
        max: 4,
        step: 1,
      },
      gridSolidLevel: {
        label: 'Obstacle Detail',
        value: p.gridSolidLevel,
        min: 0,
        max: 4,
        step: 1,
      },
      gridFineOpacity: {
        label: 'Fine Opacity',
        value: p.gridFineOpacity,
        min: 0,
        max: 1,
        step: 0.01,
      },
      gridCoarseOpacity: {
        label: 'Coarse Opacity',
        value: p.gridCoarseOpacity,
        min: 0,
        max: 1,
        step: 0.01,
      },
      gridFalloff: {
        label: 'Falloff',
        value: p.gridFalloff,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
      // How many finest-level nodes of halo the fluid gets. 0 hugs the fluid
      // exactly; 1 gives the stream the sleeve of boxes it has in the reference.
      gridMargin: {
        label: 'Halo',
        value: p.gridMargin,
        min: 0,
        max: 2,
        step: 1,
      },
      gridInset: {
        label: 'Box Inset',
        value: p.gridInset,
        min: 0.5,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
