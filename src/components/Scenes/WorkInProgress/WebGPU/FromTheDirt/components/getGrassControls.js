import { folder } from 'leva';

export default function getGrassControls(p) {
  return folder(
    {
      grassCount: {
        label: 'Blade Count',
        max: 150000,
        min: 1000,
        step: 1000,
        value: p.grassCount,
      },
      bladeHeight: {
        label: 'Blade Height',
        max: 1,
        min: 0.05,
        step: 0.01,
        value: p.bladeHeight,
      },
      bladeWidth: {
        label: 'Blade Width',
        max: 0.15,
        min: 0.01,
        step: 0.005,
        value: p.bladeWidth,
      },
      bladeBend: {
        label: 'Blade Bend',
        max: 1.5,
        min: 0,
        step: 0.01,
        value: p.bladeBend,
      },
      clumpSize: {
        label: 'Clump Size',
        max: 3,
        min: 0.2,
        step: 0.05,
        value: p.clumpSize,
      },
      clumpPull: {
        label: 'Clump Pull',
        max: 0.25,
        min: 0,
        step: 0.01,
        value: p.clumpPull,
      },
      backlightStrength: {
        label: 'Backlight',
        max: 2,
        min: 0,
        step: 0.01,
        value: p.backlightStrength,
      },
      rootColor: { label: 'Root Color', value: p.rootColor },
      tipColor: { label: 'Tip Color', value: p.tipColor },
      Endless: folder(
        {
          endlessTileDensityRatio: {
            label: 'Tile Density vs Hero',
            max: 4,
            min: 0.25,
            step: 0.05,
            value: p.endlessTileDensityRatio ?? p.endlessGrassDensity ?? 1,
          },
          endlessGrassPerTileCap: {
            label: 'Per-Tile Cap',
            max: 150000,
            min: 1000,
            step: 1000,
            value: p.endlessGrassPerTileCap ?? p.grassCount,
          },
        },
        { collapsed: true }
      ),
      Wind: folder(
        {
          windStrength: {
            label: 'Strength',
            max: 1.2,
            min: 0,
            step: 0.01,
            value: p.windStrength,
          },
          windSpeed: {
            label: 'Speed',
            max: 3,
            min: 0.05,
            step: 0.05,
            value: p.windSpeed,
          },
          windScale: {
            label: 'Gust Scale',
            max: 1.5,
            min: 0.05,
            step: 0.01,
            value: p.windScale,
          },
          windDirX: {
            label: 'Direction X',
            max: 1,
            min: -1,
            step: 0.05,
            value: p.windDirX,
          },
          windDirZ: {
            label: 'Direction Z',
            max: 1,
            min: -1,
            step: 0.05,
            value: p.windDirZ,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
