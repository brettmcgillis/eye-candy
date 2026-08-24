import { RETILE_PATH } from './controlPaths';

const isRetileOn = (get) => get(`${RETILE_PATH}.retileEnabled`) === true;

// Ambient retile animation — the whole folder is hidden for field mode
// (see useSceneControls.js), since retiling there would mean reshuffling
// the connectivity graph, not just swapping a per-tile motif. Keys must
// match presets/presets.js 1:1.
export default function getRetileControls(snapshot = {}) {
  return {
    retileEnabled: {
      label: 'Retile Enabled',
      value: snapshot.retileEnabled ?? true,
    },
    animMode: {
      label: 'Retile Mode',
      options: ['ySpin', 'zSpin', 'scale'],
      render: isRetileOn,
      value: snapshot.animMode ?? 'ySpin',
    },
    animSpeed: {
      label: 'Flip Duration (s)',
      max: 4,
      min: 0.2,
      render: isRetileOn,
      step: 0.05,
      value: snapshot.animSpeed ?? 0.9,
    },
    retileRate: {
      label: 'Retile Rate (tiles/s)',
      max: 30,
      min: 0.1,
      render: isRetileOn,
      step: 0.1,
      value: snapshot.retileRate ?? 4,
    },
    animStagger: {
      label: 'Stagger',
      max: 1,
      min: 0,
      render: isRetileOn,
      step: 0.01,
      value: snapshot.animStagger ?? 0.6,
    },
  };
}
