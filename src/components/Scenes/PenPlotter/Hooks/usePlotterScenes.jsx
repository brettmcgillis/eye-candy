import PrimitivesTest from '../PlotScenes/PrimitivesTest';

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
