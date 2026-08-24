import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

function getDefaultRecordingStartDate() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function buildPostControls(snapshot) {
  return {
    Bloom: folder(
      {
        bloomEnabled: {
          label: 'Enabled',
          value: snapshot.bloomEnabled ?? false,
        },
        bloomStrength: {
          label: 'Strength',
          value: snapshot.bloomStrength ?? 0.217,
          min: 0,
          max: 4,
          step: 0.001,
        },
        bloomRadius: {
          label: 'Radius',
          value: snapshot.bloomRadius ?? 0,
          min: 0,
          max: 2,
          step: 0.001,
        },
        bloomThreshold: {
          label: 'Threshold',
          value: snapshot.bloomThreshold ?? 0,
          min: 0,
          max: 2,
          step: 0.001,
        },
        bloomToneMappingExposure: {
          label: 'Exposure',
          value: snapshot.bloomToneMappingExposure ?? 1.2,
          min: 0,
          max: 3,
          step: 0.001,
        },
      },
      COLLAPSED
    ),
    Retro: folder(
      {
        retroEnabled: {
          label: 'Enabled',
          value: snapshot.retroEnabled ?? false,
        },
        retroCurvature: {
          label: 'Curvature',
          value: snapshot.retroCurvature ?? 0.02,
          min: 0,
          max: 0.2,
          step: 0.01,
        },
        retroColorDepthSteps: {
          label: 'Color Depth',
          value: snapshot.retroColorDepthSteps ?? 32,
          min: 4,
          max: 64,
          step: 1,
        },
        retroScanlineIntensity: {
          label: 'Scanlines',
          value: snapshot.retroScanlineIntensity ?? 0.3,
          min: 0,
          max: 1,
          step: 0.01,
        },
        retroScanlineDensity: {
          label: 'Scanline Density',
          value: snapshot.retroScanlineDensity ?? 1,
          min: 0.02,
          max: 1,
          step: 0.01,
        },
        retroScanlineSpeed: {
          label: 'Scanline Speed',
          value: snapshot.retroScanlineSpeed ?? 0,
          min: 0,
          max: 0.1,
          step: 0.01,
        },
        retroVignetteIntensity: {
          label: 'Vignette',
          value: snapshot.retroVignetteIntensity ?? 0.3,
          min: 0,
          max: 1,
          step: 0.01,
        },
        retroColorBleeding: {
          label: 'Color Bleeding',
          value: snapshot.retroColorBleeding ?? 0.001,
          min: 0,
          max: 0.005,
          step: 0.0001,
        },
        retroAffineDistortion: {
          label: 'Affine Distortion',
          value: snapshot.retroAffineDistortion ?? 0,
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    'Chromatic Aberration': folder(
      {
        chromaticAberrationEnabled: {
          label: 'Enabled',
          value: snapshot.chromaticAberrationEnabled ?? false,
        },
        chromaticAberrationStrength: {
          label: 'Strength',
          value: snapshot.chromaticAberrationStrength ?? 1.2,
          min: 0,
          max: 8,
          step: 0.01,
        },
        chromaticAberrationScale: {
          label: 'Scale',
          value: snapshot.chromaticAberrationScale ?? 1.25,
          min: 1,
          max: 3,
          step: 0.01,
        },
        chromaticAberrationCenterX: {
          label: 'Center X',
          value: snapshot.chromaticAberrationCenterX ?? 0.5,
          min: 0,
          max: 1,
          step: 0.001,
        },
        chromaticAberrationCenterY: {
          label: 'Center Y',
          value: snapshot.chromaticAberrationCenterY ?? 0.5,
          min: 0,
          max: 1,
          step: 0.001,
        },
      },
      COLLAPSED
    ),
    CCTV: folder(
      {
        surveillanceOverlayEnabled: {
          label: 'Enabled',
          value: snapshot.surveillanceOverlayEnabled,
        },
        surveillanceCameraLabel: {
          label: 'Label',
          value: snapshot.surveillanceCameraLabel || 'CAM 01',
        },
        recordingOverrideEnabled: {
          label: 'Override Time',
          value: snapshot.recordingOverrideEnabled ?? false,
        },
        recordingStartDate: {
          label: 'Start Date',
          value: snapshot.recordingStartDate || getDefaultRecordingStartDate(),
        },
        recordingStartTime: {
          label: 'Start Time',
          value: snapshot.recordingStartTime || '00:00:00',
        },
      },
      COLLAPSED
    ),
  };
}
