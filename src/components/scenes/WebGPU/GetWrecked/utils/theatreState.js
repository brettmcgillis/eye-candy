// A starting sequence, shipped as project state so the scene opens with
// something on the dopesheet instead of an empty timeline.
//
// Core seeds a project from this ONLY when the browser has no saved state for
// it yet (see the loading logic in @theatre/core: browser state wins whenever
// it exists and is based on the same revision). So this is a starting point,
// not a source of truth — once you touch anything in studio, your edits live in
// localStorage and this file stops mattering. Clearing the project's browser
// state re-seeds from here; changing THIS file after you've edited will make
// studio offer a conflict prompt rather than silently overwriting your work.
//
// Prop paths are encoded exactly the way core encodes them — JSON.stringify of
// the path array — and the object keys are the names passed to sheet.object().
const SLIT_SCAN_TRACK = 'getWreckedSlitScanStretch';

// Theatre's own default keyframe handles, so the curve looks native the moment
// you open it rather than subtly different from anything you add by hand.
const HANDLES = [0.5, 1, 0.5, 0];

export const SEQUENCE_LENGTH = 6;

const THEATRE_STATE = {
  sheetsById: {
    Showcase: {
      staticOverrides: {
        byObject: {
          Glitch: {
            slitScan: { glitchSlitScanEnabled: true },
          },
          'Post FX': {
            pixelBleed: { postPixelBleedEnabled: true },
          },
        },
      },
      sequence: {
        type: 'PositionalSequence',
        length: SEQUENCE_LENGTH,
        subUnitsPerUnit: 30,
        tracksByObject: {
          Glitch: {
            trackIdByPropPath: {
              '["slitScan","glitchSlitScanStretch"]': SLIT_SCAN_TRACK,
            },
            trackData: {
              [SLIT_SCAN_TRACK]: {
                type: 'BasicKeyframedTrack',
                __debugName: 'Glitch:["slitScan","glitchSlitScanStretch"]',
                keyframes: [
                  {
                    id: 'getWreckedSlitScanStretchStart',
                    position: 0,
                    value: 0,
                    handles: HANDLES,
                    connectedRight: true,
                    type: 'bezier',
                  },
                  {
                    id: 'getWreckedSlitScanStretchEnd',
                    position: SEQUENCE_LENGTH,
                    value: 0.6,
                    handles: HANDLES,
                    connectedRight: false,
                    type: 'bezier',
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  definitionVersion: '0.4.0',
  revisionHistory: ['get-wrecked-seed-1'],
};

export default THEATRE_STATE;
