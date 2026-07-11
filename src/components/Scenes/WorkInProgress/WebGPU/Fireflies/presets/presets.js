export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    backgroundColor: '#02050d',
    toneMappingExposure: 3,
    fireflyCount: 700,
    fireflySize: 5,
    fireflyGlow: 2.5,
    // fireflySpeed/separationRadius/neighborRadius/hunterSpeed are Floids'
    // own literal defaults (Agents.js DESIRED_SPEED/PROTECTED_RADIUS/
    // VISIBLE_RADIUS, Hunter.js DESIRED_SPEED) — see the comments in
    // components/getFireflyControls.js, getFlockingControls.js, and
    // getHunterControls.js for exactly which constant each one is.
    fireflySpeed: 0.2,
    fireCycle: 3,
    separationRadius: 0.5,
    neighborRadius: 1.5,
    cursorMode: 'flee',
    cursorRadius: 230,
    hunterSpeed: 0.25,
    hunterRadius: 22,
    hunterCount: 1,
    lightIntensity: 3,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
