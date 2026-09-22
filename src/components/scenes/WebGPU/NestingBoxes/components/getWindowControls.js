import { folder } from 'leva';

export const WINDOW_DEFAULTS = {
  windowsEnabled: false,
  windowFloorHeight: 0.045,
  windowWidth: 0.04,
  windowPaneWidth: 0.65,
  windowPaneHeight: 0.6,
  windowMargin: 0.012,
  windowFrame: 0.002,
  windowSlab: 0.0015,
  windowEdge: 0.004,
  windowFrameColor: '#050505',
  windowGlassColor: '#0b0f16',
  windowGlassRoughness: 0.15,
  windowLit: 0.45,
  windowBlinkRate: 0.02,
  windowGlow: 4,
  windowCoolChance: 0.5,
  windowGreen: 0.35,
  windowPaletteMatch: 0.6,
};

const slider = (value, label, min, max, step) => ({
  value,
  label,
  min,
  max,
  step,
});

export default function getWindowControls(defaultValues = {}) {
  const v = { ...WINDOW_DEFAULTS, ...defaultValues };

  return {
    Windows: folder(
      {
        windowsEnabled: { value: v.windowsEnabled, label: 'Enabled' },
        Layout: folder(
          {
            windowFloorHeight: slider(
              v.windowFloorHeight,
              'Floor Height',
              0.005,
              0.5,
              0.001
            ),
            windowWidth: slider(v.windowWidth, 'Bay Width', 0.005, 0.5, 0.001),
            windowPaneWidth: slider(
              v.windowPaneWidth,
              'Pane Width',
              0,
              1,
              0.01
            ),
            windowPaneHeight: slider(
              v.windowPaneHeight,
              'Pane Height',
              0,
              1,
              0.01
            ),
            windowMargin: slider(v.windowMargin, 'Face Margin', 0, 0.2, 0.001),
          },
          { collapsed: true }
        ),
        Lines: folder(
          {
            windowFrame: slider(v.windowFrame, 'Frame', 0, 0.02, 0.0001),
            windowSlab: slider(v.windowSlab, 'Floor Slab', 0, 0.02, 0.0001),
            windowEdge: slider(v.windowEdge, 'Box Edge', 0, 0.05, 0.0001),
            windowFrameColor: { value: v.windowFrameColor, label: 'Color' },
          },
          { collapsed: true }
        ),
        Glass: folder(
          {
            windowGlassColor: { value: v.windowGlassColor, label: 'Color' },
            windowGlassRoughness: slider(
              v.windowGlassRoughness,
              'Roughness',
              0,
              1,
              0.01
            ),
          },
          { collapsed: true }
        ),
        Lights: folder(
          {
            windowLit: slider(v.windowLit, 'Fraction Lit', 0, 1, 0.01),
            windowBlinkRate: slider(
              v.windowBlinkRate,
              'Switch Rate',
              0,
              0.5,
              0.001
            ),
            windowGlow: slider(v.windowGlow, 'Glow', 0, 20, 0.01),
            windowCoolChance: slider(
              v.windowCoolChance,
              'Cool Boxes',
              0,
              1,
              0.01
            ),
            windowGreen: slider(v.windowGreen, 'Green Shift', 0, 1, 0.01),
            windowPaletteMatch: slider(
              v.windowPaletteMatch,
              'Match Structure',
              0,
              1,
              0.01
            ),
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
  };
}
