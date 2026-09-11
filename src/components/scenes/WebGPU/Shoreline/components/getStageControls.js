import { folder } from 'leva';

export default function getStageControls(p) {
  return folder(
    {
      runSimulation: { label: 'Run', value: p.runSimulation },
      timeScale: {
        label: 'Time Scale',
        value: p.timeScale,
        min: 0,
        max: 3,
        step: 0.05,
      },
      substeps: {
        label: 'Substeps',
        value: p.substeps,
        min: 2,
        max: 12,
        step: 2,
      },
      solverResolution: {
        label: 'Solver Grid',
        value: p.solverResolution,
        options: [256, 320, 384, 512, 640],
      },
      renderScale: {
        label: 'Render Scale',
        value: p.renderScale,
        min: 0.4,
        max: 1,
        step: 0.05,
      },
      backgroundColor: { label: 'Background', value: p.backgroundColor },
      fogNear: {
        label: 'Fog Near',
        value: p.fogNear,
        min: 0,
        max: 200,
        step: 1,
      },
      fogFar: {
        label: 'Fog Far',
        value: p.fogFar,
        min: 10,
        max: 400,
        step: 1,
      },
    },
    { collapsed: true }
  );
}
