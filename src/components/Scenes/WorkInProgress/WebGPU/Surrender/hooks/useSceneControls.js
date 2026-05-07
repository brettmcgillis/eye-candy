import { button, folder, useControls } from 'leva';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { imageFile } from '../../../../../../utils/appUtils';
import { OUTLINE_MODES } from '../../../../../postprocessing/webGPU/outline/Outline';
import PRESETS from '../presets/presets';

export const TEXTURE_OPTIONS = {
  None: 'None',
  'Turbo Flex': imageFile('turbo_flex.png'),
  Squares: imageFile('squares.png'),
  FYC: imageFile('fyc.png'),
  'FYC 2': imageFile('fyc2.png'),
  Bret: imageFile('bret.png'),
  'Bret (circled)': imageFile('bret-circled.png'),
  Reversal: imageFile('reversal.png'),
  'Reversal Inner': imageFile('reversal-inner.png'),
  'Reversal Outer': imageFile('reversal-outer-empty.png'),
};

const DEFAULT_PRESET = 'Surrender';

const C = { collapsed: true };

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

export default function useSceneControls({ onResetSim } = {}) {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(
    'Surrender',
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          Camera: folder(
            {
              orbitControls: {
                value: p.orbitControls,
                label: 'Orbit Controls',
              },
            },
            C
          ),
          Background: folder(
            {
              bgColor: { value: p.bgColor, label: 'Background' },
              fogNear: {
                value: p.fogNear,
                min: 0,
                max: 20,
                step: 0.5,
                label: 'Fog Near',
              },
              fogFar: {
                value: p.fogFar,
                min: 1,
                max: 30,
                step: 0.5,
                label: 'Fog Far',
              },
            },
            C
          ),
          Lighting: folder(
            {
              ambientIntensity: {
                value: p.ambientIntensity,
                min: 0,
                max: 2,
                step: 0.01,
                label: 'Ambient',
              },
              ambientColor: { value: p.ambientColor, label: 'Ambient Color' },
              keyIntensity: {
                value: p.keyIntensity,
                min: 0,
                max: 3,
                step: 0.01,
                label: 'Key Light',
              },
              keyColor: { value: p.keyColor, label: 'Key Color' },
              keyPosX: {
                value: p.keyPosX,
                min: -10,
                max: 10,
                step: 0.1,
                label: 'Key Pos X',
              },
              keyPosY: {
                value: p.keyPosY,
                min: 0,
                max: 10,
                step: 0.1,
                label: 'Key Pos Y',
              },
              keyPosZ: {
                value: p.keyPosZ,
                min: -10,
                max: 10,
                step: 0.1,
                label: 'Key Pos Z',
              },
              keyShadow: { value: p.keyShadow, label: 'Key Shadows' },
              fillIntensity: {
                value: p.fillIntensity,
                min: 0,
                max: 2,
                step: 0.01,
                label: 'Fill Light',
              },
              fillColor: { value: p.fillColor, label: 'Fill Color' },
              fillPosX: {
                value: p.fillPosX,
                min: -10,
                max: 10,
                step: 0.1,
                label: 'Fill Pos X',
              },
              fillPosY: {
                value: p.fillPosY,
                min: 0,
                max: 10,
                step: 0.1,
                label: 'Fill Pos Y',
              },
              fillPosZ: {
                value: p.fillPosZ,
                min: -10,
                max: 10,
                step: 0.1,
                label: 'Fill Pos Z',
              },
            },
            C
          ),
        },
        C
      ),

      Flag: folder(
        {
          Orientation: folder(
            {
              rotateX: {
                value: p.rotateX,
                min: -180,
                max: 180,
                step: 1,
                label: 'Rotate X (deg)',
              },
              rotateY: {
                value: p.rotateY,
                min: -180,
                max: 180,
                step: 1,
                label: 'Rotate Y (deg)',
              },
              rotateZ: {
                value: p.rotateZ,
                min: -90,
                max: 90,
                step: 1,
                label: 'Rotate Z (deg)',
              },
              posX: {
                value: p.posX,
                min: -2,
                max: 2,
                step: 0.01,
                label: 'Position X',
              },
              posY: {
                value: p.posY,
                min: -2,
                max: 2,
                step: 0.01,
                label: 'Position Y',
              },
            },
            C
          ),
          Cloth: folder(
            {
              clothWidth: {
                value: p.clothWidth,
                min: 0.2,
                max: 3.0,
                step: 0.05,
                label: 'Width',
              },
              clothHeight: {
                value: p.clothHeight,
                min: 0.2,
                max: 3.0,
                step: 0.05,
                label: 'Height',
              },
              segmentsX: {
                value: p.segmentsX,
                min: 5,
                max: 80,
                step: 1,
                label: 'Segments X',
              },
              segmentsY: {
                value: p.segmentsY,
                min: 5,
                max: 80,
                step: 1,
                label: 'Segments Y',
              },
              stiffness: {
                value: p.stiffness,
                min: 0.1,
                max: 0.5,
                step: 0.01,
                label: 'Stiffness',
              },
              dampening: {
                value: p.dampening,
                min: 0.9,
                max: 1.0,
                step: 0.001,
                label: 'Dampening',
              },
              Alpha: folder(
                {
                  alphaSeed: {
                    value: p.alphaSeed,
                    min: 0,
                    max: 200,
                    step: 1,
                    label: 'Seed',
                  },
                  alphaScale: {
                    value: p.alphaScale,
                    min: 0.5,
                    max: 10,
                    step: 0.1,
                    label: 'Scale',
                  },
                  edgeFade: {
                    value: p.edgeFade,
                    min: 0,
                    max: 0.5,
                    step: 0.01,
                    label: 'Edge Fade',
                  },
                  holeAmount: {
                    value: p.holeAmount,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    label: 'Holes Amount',
                  },
                  tatterEdge: {
                    value: p.tatterEdge,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    label: 'Tatter Edge',
                  },
                  smoothEdges: { value: p.smoothEdges, label: 'Smooth Edges' },
                },
                C
              ),
            },
            C
          ),
          Material: folder(
            {
              textureUrl: {
                value: p.textureUrl,
                options: TEXTURE_OPTIONS,
                label: 'Texture',
              },
              textureTile: { value: p.textureTile, label: 'Tile' },
              textureScaleX: {
                value: p.textureScaleX,
                min: 0.1,
                max: 5,
                step: 0.05,
                label: 'Texture Scale X',
              },
              textureScaleY: {
                value: p.textureScaleY,
                min: 0.1,
                max: 5,
                step: 0.05,
                label: 'Texture Scale Y',
              },
              textureRotation: {
                value: p.textureRotation,
                min: -180,
                max: 180,
                step: 1,
                label: 'Texture Rotation',
              },
              flagColor: { value: p.flagColor, label: 'Color' },
              roughness: {
                value: p.roughness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Roughness',
              },
              metalness: {
                value: p.metalness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Metalness',
              },
              opacity: {
                value: p.opacity,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Opacity',
              },
              sheen: {
                value: p.sheen,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Sheen',
              },
              sheenRoughness: {
                value: p.sheenRoughness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Sheen Roughness',
              },
              sheenColor: { value: p.sheenColor, label: 'Sheen Color' },
              clearcoat: {
                value: p.clearcoat,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Clearcoat',
              },
              clearcoatRoughness: {
                value: p.clearcoatRoughness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Clearcoat Roughness',
              },
              transmission: {
                value: p.transmission,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Transmission',
              },
              ior: {
                value: p.ior,
                min: 1.0,
                max: 2.5,
                step: 0.01,
                label: 'IOR',
              },
              materialThickness: {
                value: p.materialThickness,
                min: 0,
                max: 2,
                step: 0.01,
                label: 'Thickness',
              },
            },
            C
          ),
          Pole: folder(
            {
              poleColor: { value: p.poleColor, label: 'Color' },
              poleMetalness: {
                value: p.poleMetalness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Metalness',
              },
              poleRoughness: {
                value: p.poleRoughness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Roughness',
              },
            },
            C
          ),
          Finial: folder(
            {
              finialColor: { value: p.finialColor, label: 'Color' },
              finialMetalness: {
                value: p.finialMetalness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Metalness',
              },
              finialRoughness: {
                value: p.finialRoughness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Roughness',
              },
            },
            C
          ),
          Rings: folder(
            {
              ringColor: { value: p.ringColor, label: 'Color' },
              ringMetalness: {
                value: p.ringMetalness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Metalness',
              },
              ringRoughness: {
                value: p.ringRoughness,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Roughness',
              },
            },
            C
          ),
        },
        C
      ),

      Wind: folder(
        {
          wind: {
            value: p.wind,
            min: 0,
            max: 10,
            step: 0.1,
            label: 'Strength',
          },
          windDirX: {
            value: p.windDirX,
            min: -1,
            max: 1,
            step: 0.01,
            label: 'Direction X',
          },
          windDirZ: {
            value: p.windDirZ,
            min: -1,
            max: 1,
            step: 0.01,
            label: 'Direction Z',
          },
        },
        C
      ),

      Postprocessing: folder(
        {
          Outline: folder(
            {
              enabled: { value: p.enabled, label: 'Enabled' },
              mode: { value: p.mode, options: OUTLINE_MODES, label: 'Mode' },
              strength: {
                value: p.strength,
                min: 0,
                max: 10,
                step: 0.1,
                label: 'Strength',
              },
              thickness: {
                value: p.thickness,
                min: 0.1,
                max: 80,
                step: 0.1,
                label: 'Thickness',
              },
              color: { value: p.color, label: 'Color' },
              hiddenColor: { value: p.hiddenColor, label: 'Hidden Color' },
              hiddenStrength: {
                value: p.hiddenStrength,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Hidden Strength',
              },
              glow: {
                value: p.glow,
                min: 0,
                max: 2,
                step: 0.01,
                label: 'Glow',
              },
              inside: { value: p.inside, label: 'Inside' },
              downSampleRatio: {
                value: p.downSampleRatio,
                min: 1,
                max: 4,
                step: 1,
                label: 'Downsample',
              },
              patternScale: {
                value: p.patternScale,
                min: 0.25,
                max: 120,
                step: 0.1,
                label: 'Pattern Scale',
              },
              patternOctaves: {
                value: p.patternOctaves,
                min: 1,
                max: 8,
                step: 1,
                label: 'Octaves',
              },
              patternLacunarity: {
                value: p.patternLacunarity,
                min: 1,
                max: 4,
                step: 0.1,
                label: 'Lacunarity',
              },
              ringStride: {
                value: p.ringStride,
                min: 2,
                max: 80,
                step: 1,
                label: 'Ring Stride',
              },
              halftoneScale: {
                value: p.halftoneScale,
                min: 0.25,
                max: 4,
                step: 0.05,
                label: 'Dot Size',
              },
            },
            C
          ),
        },
        C
      ),

      Debug: folder(
        {
          paused: { value: p.paused, label: 'Pause Sim' },
          wireframe: { value: p.wireframe, label: 'Wireframe' },
          cursorCollider: { value: p.cursorCollider, label: 'Cursor Sphere' },
          debugColliders: {
            value: p.debugColliders,
            label: 'Debug Wireframes',
          },
          debugColor: { value: p.debugColor, label: 'Debug Color' },
          cursorRadius: {
            value: p.cursorRadius,
            min: 0.02,
            max: 0.4,
            step: 0.01,
            label: 'Cursor Radius',
          },
          ...(onResetSim ? { 'Reset Sim': button(onResetSim) } : {}),
        },
        C
      ),
    }),
    { collapsed: true }
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  return controls;
}
