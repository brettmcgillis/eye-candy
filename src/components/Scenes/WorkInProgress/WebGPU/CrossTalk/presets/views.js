import CloudsView from '../components/CloudsView';
import FluidSimView from '../components/FluidSimView';
import GravityRoomsView from '../components/GravityRoomsView';
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
};

export function getPresetView(presetName) {
  return PRESET_VIEWS[presetName] || PRESET_VIEWS[DEFAULT_PRESET];
}
