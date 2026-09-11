import { DEBUG_VIEWS } from '../utils/debugView';
import { VIEW_MODES, isMesh, isRaymarch } from './controlPaths';

export default function getRenderControls(snapshot = {}) {
  return {
    viewMode: {
      label: 'View',
      options: VIEW_MODES,
      value: snapshot.viewMode ?? VIEW_MODES[0],
    },
    renderScale: {
      label: 'Render Scale',
      max: 1.5,
      min: 0.25,
      render: isRaymarch,
      step: 0.05,
      value: snapshot.renderScale ?? 1,
    },
    raymarchQuality: {
      label: 'March Quality',
      options: [1, 1.5, 2, 3],
      render: isRaymarch,
      value: snapshot.raymarchQuality ?? 2,
    },
    meshResolution: {
      label: 'Mesh Resolution',
      max: 1024,
      min: 64,
      render: isMesh,
      step: 32,
      value: snapshot.meshResolution ?? 512,
    },
    fieldResolution: {
      label: 'Field Resolution',
      options: [256, 512, 768, 1024],
      value: snapshot.fieldResolution ?? 768,
    },
    debugView: {
      label: 'Debug Layer',
      options: DEBUG_VIEWS,
      render: isRaymarch,
      value: snapshot.debugView ?? DEBUG_VIEWS[0],
    },
    shadows: {
      label: 'Shadows',
      render: isRaymarch,
      value: snapshot.shadows ?? true,
    },
    water: { label: 'Water', value: snapshot.water ?? true },
    trees: { label: 'Trees', value: snapshot.trees ?? true },
    drainage: { label: 'Drainage', value: snapshot.drainage ?? true },
    detailAmount: {
      label: 'Detail Texture',
      max: 2,
      min: 0,
      step: 0.05,
      value: snapshot.detailAmount ?? 1,
    },
    timeScale: {
      label: 'Time Scale',
      max: 4,
      min: 0,
      step: 0.05,
      value: snapshot.timeScale ?? 1,
    },
  };
}
