import { useMemo, useState } from 'react';

import { useFrame } from '@react-three/fiber';

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return {
    r: Math.floor(value / 65536),
    g: Math.floor(value / 256) % 256,
    b: value % 256,
  };
}

function rgbToHex({ r, g, b }) {
  const rr = Math.max(0, Math.min(255, Math.round(r)));
  const gg = Math.max(0, Math.min(255, Math.round(g)));
  const bb = Math.max(0, Math.min(255, Math.round(b)));

  const value = rr * 65536 + gg * 256 + bb;
  return `#${value.toString(16).padStart(6, '0')}`;
}

function lerpColor(a, b, t) {
  const clamped = clamp01(t);
  return rgbToHex({
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  });
}

function triPalette(colorA, colorB, colorC, t) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  const rgbC = hexToRgb(colorC);

  if (t < 0.5) {
    return lerpColor(rgbA, rgbB, t * 2);
  }
  return lerpColor(rgbB, rgbC, (t - 0.5) * 2);
}

function buildMorseSegments(text) {
  const MORSE = {
    A: '.-',
    B: '-...',
    C: '-.-.',
    D: '-..',
    E: '.',
    F: '..-.',
    G: '--.',
    H: '....',
    I: '..',
    J: '.---',
    K: '-.-',
    L: '.-..',
    M: '--',
    N: '-.',
    O: '---',
    P: '.--.',
    Q: '--.-',
    R: '.-.',
    S: '...',
    T: '-',
    U: '..-',
    V: '...-',
    W: '.--',
    X: '-..-',
    Y: '-.--',
    Z: '--..',
    1: '.----',
    2: '..---',
    3: '...--',
    4: '....-',
    5: '.....',
    6: '-....',
    7: '--...',
    8: '---..',
    9: '----.',
    0: '-----',
  };

  const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);

  const segments = [];

  words.forEach((word, wordIndex) => {
    word.split('').forEach((char, charIndex) => {
      const symbols = MORSE[char] || '';
      symbols.split('').forEach((symbol, symbolIndex) => {
        segments.push({
          on: true,
          units: symbol === '-' ? 3 : 1,
        });
        if (symbolIndex < symbols.length - 1) {
          segments.push({ on: false, units: 1 });
        }
      });
      if (charIndex < word.length - 1) {
        segments.push({ on: false, units: 3 });
      }
    });
    if (wordIndex < words.length - 1) {
      segments.push({ on: false, units: 7 });
    }
  });

  return segments;
}

function pickPulseTarget(pulseIndex, pulseTargets, seed) {
  if (!pulseTargets.length) return null;
  const n = Math.max(1, pulseTargets.length);
  const safePulseIndex = Math.max(0, Math.floor(pulseIndex));
  const safeSeed = Math.max(1, Math.floor(seed || 1));
  const offset = safeSeed % n;
  return pulseTargets[(safePulseIndex + offset) % n];
}

function pulseEnvelope(phase, segmentUnits) {
  const attack = segmentUnits <= 1 ? 0.2 : 0.12;
  const release = segmentUnits <= 1 ? 0.3 : 0.2;
  const inRamp = clamp01(phase / attack);
  const outRamp = clamp01((1 - phase) / release);
  return Math.min(inRamp, outRamp);
}

export default function useSceneAnimation({ controls, frameLayers }) {
  const [animationState, setAnimationState] = useState({
    depthBuffer: 1,
    colorRangeStart: null,
    colorRangeEnd: null,
    highlightedLayerIndex: -1,
    highlightedSquareIndex: -1,
    morsePulseStrength: 0,
  });

  const morseSegments = useMemo(
    () => buildMorseSegments(controls.morseText || 'SOS'),
    [controls.morseText]
  );

  const morseOnSegmentCount = useMemo(
    () => morseSegments.filter((segment) => segment.on).length,
    [morseSegments]
  );

  const pulseTargets = useMemo(() => {
    const targets = [];
    frameLayers.forEach((layer, layerIndex) => {
      layer.forEach((_, squareIndex) => {
        targets.push({ layerIndex, squareIndex });
      });
    });

    if (!targets.length) return [];

    const seed = Math.max(1, Math.floor(controls.morseSeed || 1));
    const shuffled = [...targets];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = (seed * (i + 31) * 1103515245 + 12345) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [frameLayers, controls.morseSeed]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const depthBuffer = 1;

    let colorRangeStart = null;
    let colorRangeEnd = null;
    let highlightedLayerIndex = -1;
    let highlightedSquareIndex = -1;
    let morsePulseStrength = 0;

    if (controls.animationMode === 'layerFade') {
      const loopSeconds = Math.max(0.2, controls.layerFadeLoopSeconds || 10);
      const fullCycle = loopSeconds * 2;
      const cycleT = (t % fullCycle) / loopSeconds;
      const phase = cycleT <= 1 ? cycleT : 2 - cycleT;

      colorRangeStart = triPalette(
        controls.layerFadeStartA,
        controls.layerFadeStartB,
        controls.layerFadeStartC,
        phase
      );
      colorRangeEnd = triPalette(
        controls.layerFadeEndA,
        controls.layerFadeEndB,
        controls.layerFadeEndC,
        phase
      );
    }

    if (controls.animationMode === 'morseCode' && morseSegments.length) {
      const unitSeconds = Math.max(0.05, controls.morseUnitSeconds || 0.2);
      const sequenceUnits = morseSegments.reduce(
        (acc, segment) => acc + segment.units,
        0
      );
      const holdUnits = Math.max(0, controls.morsePauseUnits || 7);
      const totalUnits = sequenceUnits + holdUnits;

      if (totalUnits > 0) {
        const totalUnitsElapsed = t / unitSeconds;
        const cycleUnits = totalUnitsElapsed % totalUnits;
        const cycleIndex = Math.floor(totalUnitsElapsed / totalUnits);
        let cursor = 0;
        let onSegmentIndex = -1;
        let onSegmentCounter = -1;
        let activeSegment = null;
        let segmentPhase = 0;

        for (let i = 0; i < morseSegments.length; i += 1) {
          const segment = morseSegments[i];
          const next = cursor + segment.units;
          if (segment.on) onSegmentCounter += 1;
          if (cycleUnits >= cursor && cycleUnits < next) {
            if (segment.on) {
              onSegmentIndex = onSegmentCounter;
              activeSegment = segment;
              segmentPhase = (cycleUnits - cursor) / segment.units;
            }
            break;
          }
          cursor = next;
        }

        if (onSegmentIndex >= 0) {
          const globalPulseIndex =
            cycleIndex * Math.max(1, morseOnSegmentCount) + onSegmentIndex;
          const target = pickPulseTarget(
            globalPulseIndex,
            pulseTargets,
            Math.max(1, Math.floor(controls.morseSeed || 1))
          );
          if (target) {
            highlightedLayerIndex = target.layerIndex;
            highlightedSquareIndex = target.squareIndex;
            morsePulseStrength = pulseEnvelope(
              segmentPhase,
              activeSegment?.units || 1
            );
          }
        }
      }
    }

    setAnimationState({
      depthBuffer,
      colorRangeStart,
      colorRangeEnd,
      highlightedLayerIndex,
      highlightedSquareIndex,
      morsePulseStrength,
    });
  });

  return animationState;
}
