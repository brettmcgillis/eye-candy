import { folder } from 'leva';

const range = (p, key, min, max, step) => ({ max, min, step, value: p[key] });

export default function getGrassControls(p) {
  return folder(
    {
      grassCount: range(p, 'grassCount', 20000, 400000, 1000),
      grassBladeHeight: range(p, 'grassBladeHeight', 0.2, 3, 0.01),
      grassBladeWidth: range(p, 'grassBladeWidth', 0.02, 0.4, 0.005),
      grassHeightJitter: range(p, 'grassHeightJitter', 0, 0.9, 0.01),
      grassBend: range(p, 'grassBend', 0, 1, 0.01),
      grassFarWiden: range(p, 'grassFarWiden', 5, 80, 0.5),
      Color: folder(
        {
          grassRootColor: { value: p.grassRootColor },
          grassTipColor: { value: p.grassTipColor },
          grassDryColor: { value: p.grassDryColor },
          grassDryAmount: range(p, 'grassDryAmount', 0, 1, 0.01),
          grassAo: range(p, 'grassAo', 0, 1, 0.01),
          grassFacing: range(p, 'grassFacing', 0, 0.9, 0.01),
          grassVariation: range(p, 'grassVariation', 0, 1, 0.01),
          grassSheen: range(p, 'grassSheen', 0, 1.5, 0.01),
          grassLightWrap: range(p, 'grassLightWrap', 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Patches: folder(
        {
          grassPatchScale: range(p, 'grassPatchScale', 0.2, 8, 0.05),
          grassPatchHeight: range(p, 'grassPatchHeight', 0, 1, 0.01),
          grassPatchContrast: range(p, 'grassPatchContrast', 0, 0.6, 0.01),
        },
        { collapsed: true }
      ),
      grassWindStrength: range(p, 'grassWindStrength', 0, 1.5, 0.01),
      grassFlutter: range(p, 'grassFlutter', 0, 1, 0.01),
      grassEdgeFade: range(p, 'grassEdgeFade', 0.5, 12, 0.1),
      grassSeed: range(p, 'grassSeed', 0, 999, 1),
    },
    { collapsed: true }
  );
}
