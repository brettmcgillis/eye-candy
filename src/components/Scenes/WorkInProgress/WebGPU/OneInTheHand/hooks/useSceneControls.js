import { folder, useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useSceneCameraControls } from '../../../../../../modules/cameraRig';
import PRESETS, { DEFAULT_PRESET } from '../presets/presets';

const SCENE_LABEL = 'One In The Hand';
const COLLAPSED = { collapsed: true };

const BIRD_MODEL_OPTIONS = {
  Hummingbird: 'hummingbird',
  Kingfisher: 'kingfisher',
  Robin: 'robin',
};

const BIRD1_CLIP_OPTIONS = {
  Robin_Bird_Idle2: 'Robin_Bird_Idle2',
  idleA1_bird: 'idleA1_bird',
  idleA2_bird: 'idleA2_bird',
  idleB1: 'idleB1',
  'take 001': 'take 001',
};

const BIRD2_CLIP_OPTIONS = {
  Robin_Bird_Idle2: 'Robin_Bird_Idle2',
  idleA1_bird: 'idleA1_bird',
  idleA2_bird: 'idleA2_bird',
  idleB1: 'idleB1',
  'take 001': 'take 001',
};

const SKELETON_POSE_OPTIONS = {
  one_in_the_hand: 'one_in_the_hand',
  two_in_the_chest: 'two_in_the_chest',
};

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

function buildBirdControls(prefix, preset) {
  return folder(
    {
      [`${prefix}Model`]: {
        label: 'Model',
        options: BIRD_MODEL_OPTIONS,
        value: preset[`${prefix}Model`],
      },
      [`${prefix}Clip`]: {
        label: 'Clip',
        options: prefix === 'bird1' ? BIRD1_CLIP_OPTIONS : BIRD2_CLIP_OPTIONS,
        value: preset[`${prefix}Clip`],
      },
      [`${prefix}Position`]: {
        label: 'Position',
        value: preset[`${prefix}Position`],
        step: 0.01,
      },
      [`${prefix}Rotation`]: {
        label: 'Rotation',
        value: preset[`${prefix}Rotation`],
        step: 0.01,
      },
      [`${prefix}Scale`]: {
        label: 'Scale',
        min: 0.002,
        max: 2,
        step: 0.001,
        value: preset[`${prefix}Scale`],
      },
      [`${prefix}Color`]: { label: 'Color', value: preset[`${prefix}Color`] },
    },
    COLLAPSED
  );
}

export default function useSceneControls() {
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

  const cameraDeclaration = useMemo(() => {
    return {
      autoFit: p.cameraAutoFit,
      defaultMode: p.cameraMode,
      far: p.cameraFar,
      near: p.cameraNear,
      orbit: p.cameraOrbit,
      spline: p.cameraSpline,
    };
  }, [
    p.cameraAutoFit,
    p.cameraFar,
    p.cameraMode,
    p.cameraNear,
    p.cameraOrbit,
    p.cameraSpline,
  ]);

  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: cameraDeclaration,
    cameraFolderPath: `${SCENE_LABEL}.Camera`,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, COLLAPSED),
    Scene: folder(
      {
        backgroundColor: { label: 'Background', value: p.backgroundColor },
        fogColor: { label: 'Fog Color', value: p.fogColor },
        fogNear: {
          label: 'Fog Near',
          value: p.fogNear,
          min: 0,
          max: 12,
          step: 0.1,
        },
        fogFar: {
          label: 'Fog Far',
          value: p.fogFar,
          min: 1,
          max: 30,
          step: 0.1,
        },
      },
      COLLAPSED
    ),
    Lighting: folder(
      {
        ambientColor: { label: 'Ambient Color', value: p.ambientColor },
        ambientIntensity: {
          label: 'Ambient Intensity',
          value: p.ambientIntensity,
          min: 0,
          max: 8,
          step: 0.05,
        },
        directionalColor: {
          label: 'Directional Color',
          value: p.directionalColor,
        },
        directionalIntensity: {
          label: 'Directional Intensity',
          value: p.directionalIntensity,
          min: 0,
          max: 12,
          step: 0.05,
        },
        directionalPosition: {
          label: 'Directional Position',
          value: p.directionalPosition,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    Skeleton: folder(
      {
        skeletonPose: {
          label: 'Pose',
          options: SKELETON_POSE_OPTIONS,
          value: p.skeletonPose,
        },
        skeletonPosition: {
          label: 'Position',
          value: p.skeletonPosition,
          step: 0.01,
        },
        skeletonRotation: {
          label: 'Rotation',
          value: p.skeletonRotation,
          step: 0.01,
        },
        skeletonScale: {
          label: 'Scale',
          value: p.skeletonScale,
          min: 0.1,
          max: 3,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    Branch: folder(
      {
        branchPosition: {
          label: 'Position',
          value: p.branchPosition,
          step: 0.01,
        },
        branchRotation: {
          label: 'Rotation',
          value: p.branchRotation,
          step: 0.01,
        },
        branchScale: { label: 'Scale', value: p.branchScale, step: 0.01 },
      },
      COLLAPSED
    ),
    Bird1: buildBirdControls('bird1', p),
    Bird2: buildBirdControls('bird2', p),
  }));

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  const cameraControlsKey = useMemo(() => {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(controls).filter(([key]) => {
          return (
            key === 'preset' ||
            key.startsWith('camera') ||
            key.startsWith('orbit') ||
            key.startsWith('fixed') ||
            key.startsWith('spline') ||
            key.startsWith('operator')
          );
        })
      )
    );
  }, [controls]);

  const camera = useMemo(() => {
    return buildCamera(controls);
  }, [buildCamera, cameraControlsKey]);

  return useMemo(() => {
    return {
      ...controls,
      camera,
    };
  }, [camera, controls]);
}
