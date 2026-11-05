import seededFolder from '../utils/seededFolder';

export default function getFeedControls(snapshot) {
  return seededFolder(
    {
      channel: { label: 'Channel', value: 1, min: 1, max: 24, step: 1 },
      autoCycle: { label: 'Auto Cycle', value: true },
      cycleSeconds: {
        label: 'Cycle Seconds',
        value: 6,
        min: 1,
        max: 30,
        step: 0.5,
      },
      feedFps: { label: 'Feed FPS', value: 15, min: 4, max: 60, step: 1 },
      feedResolution: {
        label: 'Feed Resolution',
        value: 512,
        options: { Low: 256, Medium: 384, High: 512, Ultra: 768 },
      },
      feedFov: { label: 'Feed FOV', value: 44, min: 12, max: 80, step: 1 },
      screenStatic: {
        label: 'Idle Static',
        value: 0.06,
        min: 0,
        max: 0.6,
        step: 0.01,
      },
      switchStatic: {
        label: 'Switch Static (s)',
        value: 0.45,
        min: 0,
        max: 2,
        step: 0.05,
      },
      screenCurvature: {
        label: 'Tube Curvature',
        value: 0.14,
        min: 0,
        max: 0.5,
        step: 0.01,
      },
      screenScanlines: {
        label: 'Tube Scanlines',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
      screenBrightness: {
        label: 'Tube Brightness',
        value: 0.92,
        min: 0.3,
        max: 1.5,
        step: 0.01,
      },
      screenHud: { label: 'Feed HUD', value: 0.7, min: 0, max: 1, step: 0.01 },
    },
    snapshot
  );
}
