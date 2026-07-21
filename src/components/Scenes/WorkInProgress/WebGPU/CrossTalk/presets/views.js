import CloudsView from '../components/CloudsView';
import FeathersView from '../components/FeathersView';
import FluidSimView from '../components/FluidSimView';
import GravityRoomsView from '../components/GravityRoomsView';
import RadianceCascadesView from '../components/RadianceCascadesView';
import { DEFAULT_PRESET } from './presets';

// One entry per preset: the component that renders it, plus what this
// window should broadcast as its `meta` payload over windowSync (see
// CrossTalk.jsx — useWindowSync is called once, at the orchestrator level,
// shared across every preset so this window's registry identity doesn't
// churn on a preset switch). Adding preset N+1 means adding a view component
// + one entry here — CrossTalk.jsx itself doesn't change.
export const PRESET_VIEWS = {
  'Cloud Connected': {
    Component: CloudsView,
    getMeta: (c) => ({
      spread: c.spread,
      bobAmount: c.bobAmount,
      bobSpeed: c.bobSpeed,
    }),
  },
  Waterworks: {
    Component: FluidSimView,
    // The water body is broadcast whole, separately, by useFluidSim's own
    // BroadcastChannel — there's nothing per-window to put in meta.
    getMeta: () => undefined,
  },
  'Gravity Rooms': {
    Component: GravityRoomsView,
    getMeta: (c) => ({ gravityAngle: c.gravityAngle }),
  },
  'Particles & Attractors': {
    Component: FeathersView,
    getMeta: (c) => ({ attractorStrength: c.attractorStrength }),
  },
  'Radiance Cascades': {
    Component: RadianceCascadesView,
    getMeta: (c) => ({
      light: {
        color: c.lightColor,
        intensity: c.lightIntensity,
        offsetX: c.lightOffset.x,
        offsetY: c.lightOffset.y,
        radius: c.lightRadius,
      },
      occluder: {
        offsetX: c.occluderOffset.x,
        offsetY: c.occluderOffset.y,
        rotation: (c.occluderRotation * Math.PI) / 180,
        shape: c.occluderShape,
        size: c.occluderSize,
      },
    }),
  },
};

export function getPresetView(presetName) {
  return PRESET_VIEWS[presetName] || PRESET_VIEWS[DEFAULT_PRESET];
}
