import { levaStore } from 'leva';

import { getOverlayIgPreset, normalizeOverlayIgPreset } from '../overlayParams';

const IG_LEVA_KEYS = ['App.Overlay.ig', 'App.ig', 'Scene Select.ig'];

function readLevaValue(state, keys) {
  const values = keys.map((key) => state.data?.[key]?.value);
  return values.find((value) => value !== undefined);
}

export default function useOverlayIgPreset() {
  const levaIgPreset = levaStore.useStore((state) =>
    readLevaValue(state, IG_LEVA_KEYS)
  );

  return levaIgPreset === undefined
    ? getOverlayIgPreset()
    : normalizeOverlayIgPreset(levaIgPreset);
}
