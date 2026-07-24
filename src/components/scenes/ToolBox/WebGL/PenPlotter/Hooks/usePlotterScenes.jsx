import { lazy } from 'react';

const PrimitivesTest = lazy(
  () => import('../PlotScenes/PrimitivesTest/PrimitivesTest')
);

const scenes = [
  {
    id: 'primitivesTest',
    label: 'Primitives Test',
    Component: PrimitivesTest,
  },
];

export default function usePlotterScenes() {
  return { scenes };
}
