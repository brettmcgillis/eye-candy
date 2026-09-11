import { folder } from 'leva';

export default function getSwellControls(p) {
  return folder(
    {
      runSimulation: { label: 'Run', value: p.runSimulation },
      timeScale: {
        label: 'Time Scale',
        value: p.timeScale,
        min: 0.1,
        max: 3,
        step: 0.05,
      },
      // Substeps run in pairs so the settled state always lands in buffer 0.
      substeps: {
        label: 'Substeps',
        value: p.substeps,
        min: 2,
        max: 8,
        step: 2,
      },
      swellAmplitude: {
        label: 'Swell Height',
        value: p.swellAmplitude,
        min: 0.1,
        max: 6,
        step: 0.05,
      },
      swellPeriod: {
        label: 'Period (s)',
        value: p.swellPeriod,
        min: 2,
        max: 20,
        step: 0.25,
      },
      swellSpread: {
        label: 'Along-shore Spread',
        value: p.swellSpread,
        min: 0,
        max: 4,
        step: 0.05,
      },
      swellGroupRate: {
        label: 'Set Rate',
        value: p.swellGroupRate,
        min: 0,
        max: 0.6,
        step: 0.01,
      },
      swellDrive: {
        label: 'Drive',
        value: p.swellDrive,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      Solver: folder(
        {
          pipeArea: {
            label: 'Pipe Area',
            value: p.pipeArea,
            min: 0.1,
            max: 2,
            step: 0.05,
          },
          fluxDamping: {
            label: 'Flux Damping',
            value: p.fluxDamping,
            min: 0.9,
            max: 1,
            step: 0.001,
          },
          bedDrag: {
            label: 'Bed Drag',
            value: p.bedDrag,
            min: 0,
            max: 0.3,
            step: 0.005,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
