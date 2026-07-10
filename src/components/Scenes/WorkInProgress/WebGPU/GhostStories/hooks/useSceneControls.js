import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import GHOST_SKINS from '../presets/skins';

const SCENE_LABEL = 'Ghost Stories';

// No CameraRig here on purpose: Ecctrl owns the camera (third-person follow
// with its own collision + zoom), which is the point of a playable scene.
export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,

    World: folder(
      {
        seed: { value: 7, min: 1, max: 9999, step: 1 },
        hillAmplitude: { value: 2.2, min: 0, max: 8, step: 0.1 },
        hillFrequency: { value: 0.045, min: 0.005, max: 0.2, step: 0.001 },
        valleyAmplitude: { value: 2.6, min: 0, max: 10, step: 0.1 },
        valleyFrequency: { value: 0.012, min: 0.002, max: 0.05, step: 0.001 },
        waterLevel: { value: -0.4, min: -6, max: 2, step: 0.1 },
        chunkRadius: { value: 2, min: 1, max: 4, step: 1 },
        terrainSegments: { value: 48, min: 16, max: 96, step: 8 },
      },
      { collapsed: true }
    ),

    Paths: folder(
      {
        pathEnabled: true,
        pathFrequency: { value: 0.016, min: 0.004, max: 0.06, step: 0.001 },
        pathWidth: { value: 0.05, min: 0.01, max: 0.2, step: 0.005 },
        pathDepth: { value: 0.18, min: 0, max: 0.8, step: 0.01 },
      },
      { collapsed: true }
    ),

    Terrain: folder(
      {
        groundColor: '#24371f',
        groundColorAlt: '#1b2a2e',
        pathColor: '#4a3b2c',
        shoreColor: '#3a3428',
      },
      { collapsed: true }
    ),

    Grass: folder(
      {
        bladesPerChunk: { value: 60000, min: 0, max: 150000, step: 1000 },
        grassRingDensity: { value: 0.4, min: 0, max: 1, step: 0.05 },
        grassChunkRadius: { value: 1, min: 0, max: 3, step: 1 },
        clumpSize: { value: 0.9, min: 0.2, max: 3, step: 0.05 },
        bladeHeight: { value: 0.85, min: 0.1, max: 2.5, step: 0.02 },
        bladeWidth: { value: 0.06, min: 0.01, max: 0.2, step: 0.002 },
        bladeBend: { value: 0.35, min: 0, max: 1, step: 0.02 },
        grassRootColor: '#17301c',
        grassTipColor: '#5d9158',
        backlightStrength: { value: 0.8, min: 0, max: 2, step: 0.05 },
        windDirX: { value: 1, min: -1, max: 1, step: 0.05 },
        windDirZ: { value: 0.35, min: -1, max: 1, step: 0.05 },
        windScale: { value: 0.22, min: 0.01, max: 0.6, step: 0.005 },
        windSpeed: { value: 1.1, min: 0, max: 4, step: 0.05 },
        windStrength: { value: 1, min: 0, max: 2, step: 0.02 },
        touchRadius: { value: 2.6, min: 0.2, max: 8, step: 0.1 },
        touchStrength: { value: 0.9, min: 0, max: 2, step: 0.05 },
      },
      { collapsed: true }
    ),

    Flowers: folder(
      {
        flowersPerChunk: { value: 16, min: 0, max: 80, step: 1 },
        flowerScale: { value: 0.22, min: 0.05, max: 1, step: 0.01 },
      },
      { collapsed: true }
    ),

    Sky: folder(
      {
        skyTint: '#b8c4e6',
        skyTextureRepeat: { value: 1, min: 1, max: 8, step: 1 },
        moonAzimuth: { value: 40, min: -180, max: 180, step: 1 },
        moonElevation: { value: 32, min: 5, max: 85, step: 1 },
        moonSize: { value: 26, min: 4, max: 80, step: 1 },
        moonColor: '#e8ecff',
        moonEmissiveIntensity: { value: 1.6, min: 0, max: 6, step: 0.1 },
        moonLightColor: '#8fa4d9',
        moonLightIntensity: { value: 1.6, min: 0, max: 4, step: 0.05 },
        ambientColor: '#4a5a8a',
        ambientIntensity: { value: 0.9, min: 0, max: 2, step: 0.05 },
        skyGlowColor: '#2c3a5c',
        groundGlowColor: '#16231a',
        hemisphereIntensity: { value: 0.6, min: 0, max: 2, step: 0.05 },
      },
      { collapsed: true }
    ),

    Fog: folder(
      {
        fogEnabled: true,
        fogColor: '#1a2438',
        fogTop: { value: 1.2, min: -4, max: 6, step: 0.1 },
        fogBottom: { value: -0.8, min: -8, max: 2, step: 0.1 },
        fogPoolDensity: { value: 0.8, min: 0, max: 1, step: 0.02 },
        fogNoiseScale: { value: 0.03, min: 0.005, max: 0.3, step: 0.005 },
        fogNoiseAmount: { value: 0.7, min: 0, max: 1, step: 0.05 },
        fogWindSpeed: { value: 0.6, min: 0, max: 4, step: 0.05 },
        fogDistanceNear: { value: 60, min: 10, max: 300, step: 5 },
        fogDistanceFar: { value: 170, min: 40, max: 600, step: 5 },
        fogHazeStrength: { value: 0.7, min: 0, max: 1, step: 0.02 },
      },
      { collapsed: true }
    ),

    Mountains: folder(
      {
        mountainsEnabled: true,
        mountainRadius: { value: 320, min: 120, max: 700, step: 10 },
        mountainHeight: { value: 60, min: 10, max: 200, step: 5 },
        mountainColor: '#111c33',
      },
      { collapsed: true }
    ),

    Water: folder(
      {
        waterEnabled: true,
        waterColor: '#16283a',
        waterOpacity: { value: 0.78, min: 0.1, max: 1, step: 0.02 },
        waterViscosity: { value: 0.96, min: 0.9, max: 0.985, step: 0.001 },
        waterDisturbSize: { value: 2.2, min: 0.2, max: 6, step: 0.05 },
        waterDisturbDepth: { value: 0.3, min: 0, max: 1, step: 0.02 },
        waterWaveAmp: { value: 0.035, min: 0, max: 0.2, step: 0.005 },
        waterSkyColor: '#31415f',
        waterSimSpeed: { value: 5, min: 1, max: 6, step: 1 },
        waterTouchHeight: { value: 1.4, min: 0.2, max: 4, step: 0.1 },
      },
      { collapsed: true }
    ),

    Trees: folder(
      {
        treesEnabled: true,
        treesPerChunk: { value: 7, min: 0, max: 30, step: 1 },
        treeScale: { value: 1, min: 0.3, max: 3, step: 0.05 },
      },
      { collapsed: true }
    ),

    Settings: folder(
      {
        settingsEnabled: true,
        settingDensity: { value: 0.45, min: 0, max: 1, step: 0.05 },
      },
      { collapsed: true }
    ),

    Fireflies: folder(
      {
        firefliesEnabled: true,
        fireflyCount: { value: 220, min: 0, max: 1000, step: 10 },
        fireflyColor: '#ffe28a',
        fireflyIntensity: { value: 3, min: 0, max: 10, step: 0.1 },
        fireflySize: { value: 0.06, min: 0.01, max: 0.3, step: 0.005 },
        fireflySpeed: { value: 0.7, min: 0, max: 3, step: 0.05 },
      },
      { collapsed: true }
    ),

    Audio: folder(
      {
        windVolume: { value: 0.5, min: 0, max: 1, step: 0.05 },
        ambienceVolume: { value: 0.35, min: 0, max: 1, step: 0.05 },
        frogVolume: { value: 0.6, min: 0, max: 1, step: 0.05 },
      },
      { collapsed: true }
    ),

    Character: folder(
      {
        ghostSkin: { value: 'Hero', options: Object.keys(GHOST_SKINS) },
        ghostScale: { value: 2.5, min: 0.5, max: 6, step: 0.1 },
        clothSegments: { value: 40, min: 16, max: 56, step: 2 },
        ghostEmissiveIntensity: { value: 0.35, min: 0, max: 3, step: 0.05 },
        ghostGlowColor: '#88ccff',
        ghostGlowIntensity: { value: 0.6, min: 0, max: 4, step: 0.05 },
        maxVelLimit: { value: 3, min: 0.5, max: 12, step: 0.5 },
        sprintMult: { value: 2, min: 1, max: 4, step: 0.1 },
        jumpVel: { value: 4, min: 0, max: 12, step: 0.5 },
        floatHeight: { value: 0.55, min: 0, max: 2, step: 0.05 },
        camInitDis: { value: -8, min: -30, max: -0.5, step: 0.1 },
        camMaxDis: { value: -14, min: -30, max: -1, step: 0.1 },
        camMinDis: { value: -0.8, min: -5, max: -0.1, step: 0.1 },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(() => ({ ...controls }), [controls]);
}
