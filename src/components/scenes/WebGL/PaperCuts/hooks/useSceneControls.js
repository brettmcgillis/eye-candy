import { useEffect } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';

import { getFrames } from '../data/FrameData';
import { DEFAULT_PRESET_NAME, FOLDED_FRAME_PRESETS } from '../presets/presets';

function getPresetControls({ presetName, presetSnapshot }) {
  return {
    ...presetSnapshot,
    preset: presetName,
  };
}

export default function useSceneControls() {
  const frames = getFrames();

  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET_NAME,
    getPresetControls,
    presets: FOLDED_FRAME_PRESETS,
  });

  const initialPresetSnapshot =
    FOLDED_FRAME_PRESETS[initialPreset] ||
    FOLDED_FRAME_PRESETS[DEFAULT_PRESET_NAME];

  const [controls, setControls] = useControls(
    'Paper Cuts',
    () => ({
      Presets: presetsFolder,

      Data: folder(
        {
          frame: {
            label: 'Select Frame',
            value: initialPresetSnapshot.frame || frames[0].name,
            options: frames.map((f) => f.name),
          },
        },
        { collapsed: true }
      ),
      Colors: folder(
        {
          backgroundColor: {
            label: 'Background',
            value: initialPresetSnapshot.backgroundColor,
          },
          colorRangeStart: {
            label: 'Start',
            value: initialPresetSnapshot.colorRangeStart,
          },
          colorRangeEnd: {
            label: 'End',
            value: initialPresetSnapshot.colorRangeEnd,
          },
        },
        { collapsed: true }
      ),
      Art: folder(
        {
          rotate: {
            value: initialPresetSnapshot.rotate,
            label: 'Rotate 45°',
          },
          dataScale: {
            label: 'Scale',
            value: initialPresetSnapshot.dataScale,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          dataPosition: {
            label: 'Position',
            value: initialPresetSnapshot.dataPosition,
          },
        },
        { collapsed: true }
      ),
      Frame: folder(
        {
          frameVisible: {
            label: 'Visible',
            value: initialPresetSnapshot.frameVisible,
          },
          framePosition: {
            label: 'Position',
            value: initialPresetSnapshot.framePosition,
          },
          frameScale: {
            label: 'Scale',
            value: initialPresetSnapshot.frameScale,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          frameColor: {
            label: 'Color',
            value: initialPresetSnapshot.frameColor,
          },
          frameRoughness: {
            label: 'Roughness',
            value: initialPresetSnapshot.frameRoughness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          frameWatercolor: {
            label: 'Watercolor Texture',
            value: initialPresetSnapshot.frameWatercolor,
          },
        },
        { collapsed: true }
      ),
      Surface: folder(
        {
          squareRoughness: {
            label: 'Square Roughness',
            value: initialPresetSnapshot.squareRoughness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          squareMetalness: {
            label: 'Square Metalness',
            value: initialPresetSnapshot.squareMetalness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          squareFlatShading: {
            label: 'Square Flat Shading',
            value: initialPresetSnapshot.squareFlatShading,
          },
          squareWatercolor: {
            label: 'Square Watercolor',
            value: initialPresetSnapshot.squareWatercolor,
          },
        },
        { collapsed: true }
      ),
      Animation: folder(
        {
          animationMode: {
            label: 'Mode',
            value: initialPresetSnapshot.animationMode,
            options: {
              None: 'none',
              'Layer Fade': 'layerFade',
              'Morse Code': 'morseCode',
            },
          },
          LayerFade: folder(
            {
              layerFadeLoopSeconds: {
                label: 'Loop (s)',
                value: initialPresetSnapshot.layerFadeLoopSeconds,
                min: 1,
                max: 60,
                step: 0.25,
              },
              layerFadeStartA: {
                label: 'Start A',
                value: initialPresetSnapshot.layerFadeStartA,
              },
              layerFadeStartB: {
                label: 'Start B',
                value: initialPresetSnapshot.layerFadeStartB,
              },
              layerFadeStartC: {
                label: 'Start C',
                value: initialPresetSnapshot.layerFadeStartC,
              },
              layerFadeEndA: {
                label: 'End A',
                value: initialPresetSnapshot.layerFadeEndA,
              },
              layerFadeEndB: {
                label: 'End B',
                value: initialPresetSnapshot.layerFadeEndB,
              },
              layerFadeEndC: {
                label: 'End C',
                value: initialPresetSnapshot.layerFadeEndC,
              },
            },
            { collapsed: true }
          ),
          MorseCode: folder(
            {
              morseText: {
                label: 'Text',
                value: initialPresetSnapshot.morseText,
              },
              morseUnitSeconds: {
                label: 'Unit (s)',
                value: initialPresetSnapshot.morseUnitSeconds,
                min: 0.05,
                max: 1,
                step: 0.01,
              },
              morsePauseUnits: {
                label: 'Pause Units',
                value: initialPresetSnapshot.morsePauseUnits,
                min: 0,
                max: 40,
                step: 1,
              },
              morseColor: {
                label: 'Pulse Color',
                value: initialPresetSnapshot.morseColor,
              },
              morseEmissiveIntensity: {
                label: 'Emissive',
                value: initialPresetSnapshot.morseEmissiveIntensity,
                min: 0,
                max: 8,
                step: 0.1,
              },
              morseSeed: {
                label: 'Seed',
                value: initialPresetSnapshot.morseSeed,
                min: 1,
                max: 999,
                step: 1,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  return [controls, setControls];
}
