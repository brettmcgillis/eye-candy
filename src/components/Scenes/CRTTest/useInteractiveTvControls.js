import { folder, useControls } from 'leva';

const fonts = [
  /* ----------------- CRT / UI ----------------- */ 'Arial Black',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',

  /* ----------------- Terminal ----------------- */
  'Courier New',
  'Lucida Console',
  'Monaco',
  'Consolas',
  'Menlo',

  /* ----------------- Google (imported globally) ----------------- */
  'Orbitron',
  'VT323',
  'Press Start 2P',

  /* ----------------- Generic fallbacks ----------------- */
  'monospace',
  'sans-serif',
  'serif',
  'terminal',
];

export default function useInteractiveTvControls() {
  const smtpe = useControls(
    'CRT SMPTE RP-219',
    {
      staticAmount: { value: 0.35, min: 0, max: 1, step: 0.01 },
      staticScale: { value: 700, min: 50, max: 1400, step: 1 },
      staticSpeed: { value: 9, min: 0.1, max: 20, step: 0.1 },
      snap: { value: 24, min: 1, max: 60, step: 1 },

      glitchRate: { value: 0.18, min: 0, max: 1, step: 0.01 },

      scanlineStrength: { value: 0.55, min: 0, max: 1, step: 0.01 },
      colorBleed: { value: 0.14, min: 0, max: 0.5, step: 0.01 },

      curvature: { value: 0.12, min: 0, max: 0.4, step: 0.01 },
      vignette: { value: 0.75, min: 0.6, max: 0.98, step: 0.01 },
      maskStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },

      flybackStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
      convergenceDrift: { value: 0.4, min: 0, max: 1, step: 0.01 },
      bloomStrength: { value: 0.25, min: 0, max: 1, step: 0.01 },
      breathStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },

      retraceStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
      beamWidth: { value: 0.5, min: 0, max: 1, step: 0.01 },
      chromaDrift: { value: 0.3, min: 0, max: 1, step: 0.01 },
      humStrength: { value: 0.25, min: 0, max: 1, step: 0.01 },

      barrelConvergence: { value: 0.6, min: 0, max: 2, step: 0.01 },
      spotNoise: { value: 0.35, min: 0, max: 1, step: 0.01 },
      thermalDrift: { value: 0.15, min: 0, max: 1, step: 0.01 },
      maskMode: { value: 0, options: { shadow: 0, grille: 1 } },
    },
    { collapsed: true }
  );

  const tvStatic = useControls(
    'CRT Static',
    {
      snowAmount: { value: 1, min: 0, max: 1 },
      snowScale: { value: 180, min: 10, max: 800 },
      snowSpeed: { value: 1, min: 0, max: 5 },
      snowSize: { value: 240, min: 40, max: 1000 },
      curvature: { value: 0.12, min: 0, max: 0.4, step: 0.01 },
      vignette: { value: 0.75, min: 0.6, max: 0.98, step: 0.01 },
      bandStrength: { value: 0.35, min: 0, max: 1 },
      bandSpeed: { value: 0.6, min: 0, max: 3 },
      bandScale: { value: 8, min: 1, max: 40 },
      snap: { value: 24, min: 1, max: 60, step: 1 },

      rfStrength: { value: 0.25, min: 0, max: 1 },
      rfScale: { value: 22, min: 2, max: 80 },
      rfSpeed: { value: 0.4, min: 0, max: 3 },
    },
    { collapsed: true }
  );

  const noSignal = useControls(
    'No Signal',
    {
      Text: folder(
        {
          screenText: {
            value: '12:00 FEB. 28, 1986\r\nINSERT VHS',
            rows: true,
          },
          fontSize: { value: 28, min: 0, max: 48, step: 1 },
          fontName: { value: 'Press Start 2P', options: fonts },
          fontColor: { value: '#FFFFFF' },
          showCaret: { value: false },
          caretMode: {
            value: 'block',
            options: ['block', 'underscore', 'line'],
          },
          caretBlinkRate: { value: 2, min: 0.2, max: 5, step: 0.1 },

          horizontalPadding: { value: 100, min: 0, max: 1000, step: 1 },
          verticalPadding: { value: 95, min: 0, max: 1000, step: 1 },
        },
        { collapsed: true }
      ),

      Look: folder(
        {
          screenColor: { value: '#0b2fd8' },
          glowStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
          curvature: { value: 0.06, min: 0, max: 0.2, step: 0.001 },
          vignette: { value: 1.15, min: 0.5, max: 2, step: 0.01 },
        },
        { collapsed: true }
      ),

      Noise: folder(
        {
          noiseStrength: { value: 0.08, min: 0, max: 0.4, step: 0.001 },
          scanlineStrength: { value: 0.08, min: 0, max: 0.3, step: 0.001 },
          scanlineDensity: { value: 900, min: 200, max: 2000, step: 10 },
        },
        { collapsed: true }
      ),

      Roll: folder(
        {
          rollSpeed: { value: 0.4, min: 0, max: 2, step: 0.01 },
          rollStrength: { value: 0, min: 0, max: 2, step: 0.01 },
        },
        { collapsed: true }
      ),

      Chroma: folder(
        {
          chromaOffset: { value: 0.0025, min: 0, max: 0.01, step: 0.0001 },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const terminal = useControls(
    'Terminal',
    {
      Text: folder(
        {
          screenText: {
            value:
              'a:\\> ||TERMINAL ERROR||\r\n    - 0X666420 -\r\n    DATA CORRUPTED\r\na:\\> FULL SYSTEM FAILURE\na:\\> INSERT BOOT DISK',
            rows: true,
          },
          fontSize: { value: 26, min: 0, max: 48, step: 1 },
          fontName: { value: 'Press Start 2P', options: fonts },
          fontColor: { value: '#48ff00' },
          showCaret: { value: true },
          caretMode: {
            value: 'block',
            options: ['block', 'underscore', 'line'],
          },
          caretBlinkRate: { value: 2, min: 0.2, max: 5, step: 0.1 },

          horizontalPadding: { value: 100, min: 0, max: 1000, step: 1 },
          verticalPadding: { value: 95, min: 0, max: 1000, step: 1 },
        },
        { collapsed: true }
      ),

      Look: folder(
        {
          screenColor: { value: '#000000' },
          glowStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
          curvature: { value: 0.06, min: 0, max: 0.2, step: 0.001 },
          vignette: { value: 1.15, min: 0.5, max: 2, step: 0.01 },
        },
        { collapsed: true }
      ),

      Noise: folder(
        {
          noiseStrength: { value: 0.08, min: 0, max: 0.4, step: 0.001 },
          scanlineStrength: { value: 0.08, min: 0, max: 0.3, step: 0.001 },
          scanlineDensity: { value: 900, min: 200, max: 2000, step: 10 },
        },
        { collapsed: true }
      ),

      Roll: folder(
        {
          rollSpeed: { value: 0.4, min: 0, max: 2, step: 0.01 },
          rollStrength: { value: 0, min: 0, max: 2, step: 0.01 },
        },
        { collapsed: true }
      ),

      Chroma: folder(
        {
          chromaOffset: { value: 0.0025, min: 0, max: 0.01, step: 0.0001 },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const homeVideo = useControls(
    'HomeVideo',
    {
      /* ---------- Screen / Framing ---------- */
      padX: { value: 0.06, min: 0, max: 0.25, step: 0.001 },
      padY: { value: 0.08, min: 0, max: 0.25, step: 0.001 },

      curvature: { value: 0.12, min: 0, max: 0.4, step: 0.001 },
      vignette: { value: 0.75, min: 0.3, max: 1.2, step: 0.001 },

      /* ---------- Static / Noise ---------- */
      staticAmount: { value: 0.35, min: 0, max: 1, step: 0.001 },
      staticScale: { value: 700, min: 50, max: 2000, step: 1 },
      staticSpeed: { value: 9, min: 0, max: 30, step: 0.01 },
      snap: { value: 24, min: 1, max: 60, step: 1 },

      spotNoise: { value: 0.35, min: 0, max: 1, step: 0.001 },
      thermalDrift: { value: 0.15, min: 0, max: 1, step: 0.001 },

      /* ---------- Signal Damage ---------- */
      glitchRate: { value: 0.18, min: 0, max: 1, step: 0.001 },
      flybackStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },
      retraceStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },
      humStrength: { value: 0.25, min: 0, max: 1, step: 0.001 },

      breathStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },

      /* ---------- CRT Optics ---------- */
      scanlineStrength: { value: 0.55, min: 0, max: 1, step: 0.001 },
      beamWidth: { value: 0.5, min: 0, max: 1, step: 0.001 },
      bloomStrength: { value: 0.25, min: 0, max: 1, step: 0.001 },

      colorBleed: { value: 0.14, min: 0, max: 0.5, step: 0.001 },
      chromaDrift: { value: 0.3, min: 0, max: 1, step: 0.001 },
      convergenceDrift: { value: 0.4, min: 0, max: 1, step: 0.001 },
      barrelConvergence: { value: 0.6, min: 0, max: 2, step: 0.001 },

      /* ---------- Mask ---------- */
      maskStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },
      maskMode: { value: 0, options: { Triad: 0, Aperture: 1 } },
    },
    { collapsed: true }
  );

  const tv = useControls(
    'TV',
    {
      /* ---------- Screen / Framing ---------- */
      padX: { value: 0.06, min: 0, max: 0.25, step: 0.001 },
      padY: { value: 0.08, min: 0, max: 0.25, step: 0.001 },

      curvature: { value: 0.12, min: 0, max: 0.4, step: 0.001 },
      vignette: { value: 0.75, min: 0.3, max: 1.2, step: 0.001 },

      /* ---------- Static / Noise ---------- */
      staticAmount: { value: 0.35, min: 0, max: 1, step: 0.001 },
      staticScale: { value: 700, min: 50, max: 2000, step: 1 },
      staticSpeed: { value: 9, min: 0, max: 30, step: 0.01 },
      snap: { value: 24, min: 1, max: 60, step: 1 },

      spotNoise: { value: 0.35, min: 0, max: 1, step: 0.001 },
      thermalDrift: { value: 0.15, min: 0, max: 1, step: 0.001 },

      /* ---------- Signal Damage ---------- */
      glitchRate: { value: 0.18, min: 0, max: 1, step: 0.001 },
      flybackStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },
      retraceStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },
      humStrength: { value: 0.25, min: 0, max: 1, step: 0.001 },

      breathStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },

      /* ---------- CRT Optics ---------- */
      scanlineStrength: { value: 0.55, min: 0, max: 1, step: 0.001 },
      beamWidth: { value: 0.5, min: 0, max: 1, step: 0.001 },
      bloomStrength: { value: 0.25, min: 0, max: 1, step: 0.001 },

      colorBleed: { value: 0.14, min: 0, max: 0.5, step: 0.001 },
      chromaDrift: { value: 0.3, min: 0, max: 1, step: 0.001 },
      convergenceDrift: { value: 0.4, min: 0, max: 1, step: 0.001 },
      barrelConvergence: { value: 0.6, min: 0, max: 2, step: 0.001 },

      /* ---------- Mask ---------- */
      maskStrength: { value: 0.35, min: 0, max: 1, step: 0.001 },
      maskMode: { value: 0, options: { Triad: 0, Aperture: 1 } },
    },
    { collapsed: true }
  );

  const threeD = useControls(
    'Scene In Scene',
    {
      Render: folder(
        {
          resolution: {
            value: 1024,
            min: 256,
            max: 2048,
            step: 256,
          },
        },
        { collapsed: true }
      ),

      Static: folder(
        {
          staticAmount: {
            value: 0.12,
            min: 0,
            max: 0.5,
            step: 0.001,
          },
          staticScale: {
            value: 600,
            min: 50,
            max: 2000,
            step: 10,
          },
          staticSpeed: {
            value: 6,
            min: 0,
            max: 20,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),

      CRT: folder(
        {
          scanlineStrength: {
            value: 0.4,
            min: 0,
            max: 1,
            step: 0.01,
          },
          curvature: {
            value: 0.12,
            min: 0,
            max: 0.4,
            step: 0.005,
          },
          vignette: {
            value: 0.85,
            min: 0.4,
            max: 1.2,
            step: 0.005,
          },
          chromaDrift: {
            value: 0.25,
            min: 0,
            max: 1,
            step: 0.005,
          },
        },
        { collapsed: true }
      ),

      Post: folder(
        {
          bloom: {
            value: 0.25,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const pip = useControls(
    'Picture In Picture',
    {
      Render: folder(
        {
          resolution: {
            value: 1024,
            min: 256,
            max: 2048,
            step: 256,
          },
        },
        { collapsed: true }
      ),

      Feedback: folder(
        {
          decay: {
            value: 0.85,
            min: 0.7,
            max: 0.97,
            step: 0.001,
          },
          zoom: {
            value: 1.01,
            min: 1.0,
            max: 1.05,
            step: 0.0005,
          },
          warp: {
            value: 0.6,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      CRT: folder(
        {
          staticAmount: {
            value: 0.04,
            min: 0,
            max: 0.25,
            step: 0.001,
          },
          scanlineStrength: {
            value: 0.4,
            min: 0,
            max: 1,
            step: 0.01,
          },
          curvature: {
            value: 0.12,
            min: 0,
            max: 0.4,
            step: 0.005,
          },
          vignette: {
            value: 0.85,
            min: 0.4,
            max: 1.2,
            step: 0.005,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  return { smtpe, tvStatic, noSignal, terminal, homeVideo, tv, threeD, pip };
}
