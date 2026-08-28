// The scene controls Theatre is allowed to drive, grouped and labelled the way
// the Leva folders are so the studio panel reads the same as the tweak panel.
// Plain data with no imports, so the sheet definition, the driver and the
// preset checker all read one list.
//
// Group keys are identifiers (Theatre uses them as prop path segments); the
// human name is the group's `label`. Leaf keys are the flat scene control keys
// verbatim, which is what lets the driver flatten a group's values straight
// back onto config with no name mapping.
//
// Leaves carry only a label. Whether a prop is a number and what its range is
// both come from the matching Leva control at sheet-build time, so the two can
// never drift apart — a slider retuned in getGlitchControls retunes here too.
// Keys with no Leva control (the per-vehicle glitch toggles) fall back to
// boolean. Booleans step rather than interpolate, which is exactly what a hard
// cut between techniques wants.
//
// Anything not listed here stays Leva's alone — the two never write the same
// key, which is what keeps "Leva is the source of truth" true while a sequence
// plays.

export const THEATRE_GROUPS = {
  glitch: {
    vehicles: {
      label: 'Vehicles',
      props: {
        vehicleCarGlitch: { label: 'Car' },
        vehicleVanGlitch: { label: 'Van' },
        vehicleSedanGlitch: { label: 'Sedan' },
        glitchWireframe: { label: 'Wireframe' },
      },
    },
    cutPaste: {
      label: 'Cut & Paste',
      props: {
        glitchCutPasteEnabled: { label: 'Enabled' },
        glitchCutPasteDensity: { label: 'Density' },
      },
    },
    hopscotch: {
      label: 'Hopscotch',
      props: {
        glitchHopscotchEnabled: { label: 'Enabled' },
        glitchHopscotchDensity: { label: 'Density' },
      },
    },
    findReplace: {
      label: 'Find & Replace',
      props: {
        glitchFindReplaceEnabled: { label: 'Enabled' },
        glitchDensity: { label: 'Density' },
        glitchMagnitude: { label: 'Magnitude' },
      },
    },
    textureScramble: {
      label: 'Texture Scramble',
      props: {
        glitchUvEnabled: { label: 'Enabled' },
        glitchUvBlend: { label: 'Blend' },
      },
    },
    slitScan: {
      label: 'Slit Scan',
      props: {
        glitchSlitScanEnabled: { label: 'Enabled' },
        glitchSlitScanPosition: { label: 'Slit Position' },
        glitchSlitScanStretch: { label: 'Stretch' },
      },
    },
    scrollTear: {
      label: 'Scroll Tear',
      props: {
        glitchScrollTearEnabled: { label: 'Enabled' },
        glitchScrollTearPosition: { label: 'Tear Position' },
        glitchScrollTearStrength: { label: 'Smear Strength' },
      },
    },
    rowJitter: {
      label: 'Row Jitter',
      props: {
        glitchRowJitterEnabled: { label: 'Enabled' },
        glitchRowJitterStrength: { label: 'Strength' },
      },
    },
    resolutionLoss: {
      label: 'Resolution Loss',
      props: {
        glitchDegradeEnabled: { label: 'Enabled' },
        glitchDegradeDensity: { label: 'Density' },
      },
    },
    tornOpen: {
      label: 'Torn Open',
      props: {
        glitchTornEnabled: { label: 'Enabled' },
        glitchTornDensity: { label: 'Density' },
        glitchTornWireIntensity: { label: 'Wire Glow' },
      },
    },
    blockDeconstruct: {
      label: 'Block Deconstruct',
      props: {
        glitchBlockDeconstructEnabled: { label: 'Enabled' },
        glitchBlockDeconstructAmount: { label: 'Amount' },
        glitchBlockDeconstructTransition: { label: 'Transition' },
      },
    },
    sliceSuite: {
      label: 'Slice Suite',
      props: {
        glitchSliceSuiteEnabled: { label: 'Enabled' },
        glitchSliceSuiteAmount: { label: 'Amount' },
        glitchSliceSuitePushApart: { label: 'Gap (slices)' },
        glitchSliceSuiteTransition: { label: 'Transition' },
      },
    },
    voxelSnap: {
      label: 'Voxel Snap',
      props: {
        glitchVoxelSnapEnabled: { label: 'Enabled' },
        glitchVoxelSnapAmount: { label: 'Amount' },
        glitchVoxelSnapTransition: { label: 'Transition' },
      },
    },
    innerStretch: {
      label: 'Inner Stretch',
      props: {
        glitchInnerStretchEnabled: { label: 'Enabled' },
        glitchInnerStretchDensity: { label: 'Density' },
        glitchInnerStretchStretch: { label: 'Stretch' },
      },
    },
    warpField: {
      label: 'Warp Field',
      props: {
        glitchWarpFieldEnabled: { label: 'Enabled' },
        glitchWarpFieldAmount: { label: 'Amount' },
      },
    },
  },

  post: {
    godrays: {
      label: 'Godrays',
      props: {
        postGodraysDensity: { label: 'Density' },
      },
    },
    chromaticAberration: {
      label: 'Chromatic Aberration',
      props: {
        postChromaticAberrationEnabled: { label: 'Enabled' },
        postChromaticAberrationStrength: { label: 'Strength' },
      },
    },
    pixelSort: {
      label: 'Pixel Sort',
      props: {
        postPixelSortEnabled: { label: 'Enabled' },
        postPixelSortThreshold: { label: 'Threshold' },
      },
    },
    slitScan: {
      label: 'Slit Scan',
      props: {
        postSlitScanEnabled: { label: 'Enabled' },
        postSlitScanPosition: { label: 'Slit Position' },
        postSlitScanStretch: { label: 'Stretch' },
      },
    },
    datamosh: {
      label: 'Datamosh',
      props: {
        postDatamoshEnabled: { label: 'Enabled' },
        postDatamoshCorruption: { label: 'Corruption' },
        postDatamoshDisplace: { label: 'Displace' },
      },
    },
    pixelBleed: {
      label: 'Pixel Bleed',
      props: {
        postPixelBleedEnabled: { label: 'Enabled' },
        postPixelBleedReach: { label: 'Reach (px)' },
        postPixelBleedStrength: { label: 'Strength' },
        postPixelBleedAngle: { label: 'Angle' },
        postPixelBleedHighlights: { label: 'Highlights Only' },
        postPixelBleedTintAmount: { label: 'Tint Amount' },
      },
    },
  },
};

export const THEATRE_DRIVEN_KEYS = Object.values(THEATRE_GROUPS).flatMap(
  (object) => Object.values(object).flatMap((group) => Object.keys(group.props))
);
