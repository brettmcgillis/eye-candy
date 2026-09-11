import { folder } from 'leva';

// Every height is a multiplier on the reference's own pixel amounts: the
// extrusion stroke count for towers, the offset fill for plazas. Cards float
// on paper, so a card's rise is also the grey thickness band you see.
export default function getReliefControls(preset = {}) {
  return folder(
    {
      towerHeightScale: {
        label: 'Tower Height',
        max: 4,
        min: 0,
        step: 0.05,
        value: preset.towerHeightScale ?? 1,
      },
      plazaRiseScale: {
        label: 'Plaza Rise',
        max: 6,
        min: 0,
        step: 0.05,
        value: preset.plazaRiseScale ?? 1,
      },
      stairRiseScale: {
        label: 'Stair Rise',
        max: 1.5,
        min: 0,
        step: 0.01,
        value: preset.stairRiseScale ?? 0.2,
      },
      darkCardRise: {
        label: 'Dark Card Rise',
        max: 40,
        min: 0.5,
        step: 0.5,
        value: preset.darkCardRise ?? 3,
      },
      minTowerFootprint: {
        label: 'Min Tower Width',
        max: 24,
        min: 1,
        step: 0.5,
        value: preset.minTowerFootprint ?? 6,
      },
      neonThickness: {
        label: 'Pad Thickness',
        max: 12,
        min: 0.25,
        step: 0.25,
        value: preset.neonThickness ?? 2,
      },
    },
    { collapsed: true }
  );
}
