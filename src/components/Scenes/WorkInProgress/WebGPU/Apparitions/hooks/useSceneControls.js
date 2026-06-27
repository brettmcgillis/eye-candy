import { button, folder, useControls } from 'leva';

import { useCallback, useEffect, useRef } from 'react';

import { BODY_TRACKING_MODE } from '../../../../../../hooks/pose/useMediaPipeBodyTracking';
import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  APPARITIONS_ENVIRONMENTS,
  APPARITIONS_PRESETS,
  DEFAULT_APPARITIONS_PRESET,
} from '../presets/apparitionsPresets';

function getPresetControls({ presetName, presetSnapshot }) {
  return { ...presetSnapshot, preset: presetName };
}

export default function useSceneControls() {
  const setControlsRef = useRef(null);
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_APPARITIONS_PRESET,
    getPresetControls,
    presets: APPARITIONS_PRESETS,
  });

  const initialSnapshot =
    APPARITIONS_PRESETS[initialPreset] ||
    APPARITIONS_PRESETS[DEFAULT_APPARITIONS_PRESET];

  const toggleInteractionMode = useCallback(() => {
    const currentMode = controlsSnapshotRef.current.interactionMode;
    setControlsRef.current?.({
      interactionMode: currentMode === 'attract' ? 'repel' : 'attract',
    });
  }, [controlsSnapshotRef]);

  const [controls, setControls] = useControls(
    'Apparitions',
    () => ({
      Presets: presetsFolder,
      Tracking: folder(
        {
          trackingMode: {
            label: 'Tracking Mode',
            options: {
              Pose: BODY_TRACKING_MODE.pose,
              Holistic: BODY_TRACKING_MODE.holistic,
            },
            value: initialSnapshot.trackingMode,
          },
          maxPeople: {
            label: 'People',
            value: initialSnapshot.maxPeople,
            min: 1,
            max: 4,
            step: 1,
          },
          showVideo: { label: 'Show Video', value: initialSnapshot.showVideo },
          showDebugSkeleton: {
            label: 'Show Skeleton',
            value: initialSnapshot.showDebugSkeleton,
          },
          videoSize: {
            label: 'Video Size',
            value: initialSnapshot.videoSize,
            min: 0.25,
            max: 2,
            step: 0.05,
          },
          minPoseDetectionConfidence: {
            label: 'Min Detection',
            value: initialSnapshot.minPoseDetectionConfidence,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          minPosePresenceConfidence: {
            label: 'Min Presence',
            value: initialSnapshot.minPosePresenceConfidence,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          minTrackingConfidence: {
            label: 'Min Tracking',
            value: initialSnapshot.minTrackingConfidence,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          minHandLandmarksConfidence: {
            label: 'Min Hands',
            value: initialSnapshot.minHandLandmarksConfidence,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          minFaceDetectionConfidence: {
            label: 'Min Face Detect',
            value: initialSnapshot.minFaceDetectionConfidence,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          minFacePresenceConfidence: {
            label: 'Min Face Presence',
            value: initialSnapshot.minFacePresenceConfidence,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Simulation: folder(
        {
          runSimulation: { label: 'Run', value: initialSnapshot.runSimulation },
          particles: {
            label: 'Particles',
            value: initialSnapshot.particles,
            min: 4096,
            max: initialSnapshot.maxParticles,
            step: 4096,
          },
          maxParticles: {
            label: 'Max Particles',
            value: initialSnapshot.maxParticles,
            min: 8192 * 4,
            max: 8192 * 16,
            step: 4096,
          },
          particleSize: {
            label: 'Particle Size',
            value: initialSnapshot.particleSize,
            min: 0.5,
            max: 2.25,
            step: 0.05,
          },
          speed: {
            label: 'Speed',
            value: initialSnapshot.speed,
            min: 0.1,
            max: 2,
            step: 0.1,
          },
          noise: {
            label: 'Noise',
            value: initialSnapshot.noise,
            min: 0,
            max: 2,
            step: 0.01,
          },
          stiffness: {
            label: 'Stiffness',
            value: initialSnapshot.stiffness,
            min: 0.5,
            max: 8,
            step: 0.1,
          },
          restDensity: {
            label: 'Rest Density',
            value: initialSnapshot.restDensity,
            min: 0.4,
            max: 2.5,
            step: 0.05,
          },
          dynamicViscosity: {
            label: 'Viscosity',
            value: initialSnapshot.dynamicViscosity,
            min: 0.01,
            max: 0.4,
            step: 0.01,
          },
          gravityY: {
            label: 'Gravity Y',
            value: initialSnapshot.gravityY,
            min: -0.6,
            max: 0.6,
            step: 0.01,
          },
          gravityZ: {
            label: 'Gravity Z',
            value: initialSnapshot.gravityZ,
            min: -0.6,
            max: 0.6,
            step: 0.01,
          },
          bloom: { label: 'Bloom', value: initialSnapshot.bloom },
        },
        { collapsed: true }
      ),
      Interactivity: folder(
        {
          interactivityEnabled: {
            label: 'Enabled',
            value: initialSnapshot.interactivityEnabled,
          },
          interactionMode: {
            label: 'Mode',
            options: { Attract: 'attract', Repel: 'repel' },
            value: initialSnapshot.interactionMode,
          },
          enableGestureToggle: {
            label: 'Gesture Toggle',
            value: initialSnapshot.enableGestureToggle,
          },
          baseStrength: {
            label: 'Strength',
            value: initialSnapshot.baseStrength,
            min: 0.1,
            max: 8,
            step: 0.1,
          },
          attractorRadius: {
            label: 'Radius',
            value: initialSnapshot.attractorRadius,
            min: 2,
            max: 20,
            step: 0.25,
          },
          landmarksPerPerson: {
            label: 'Landmarks/Person',
            value: initialSnapshot.landmarksPerPerson,
            min: 2,
            max: 13,
            step: 1,
          },
          xScale: {
            label: 'X Scale',
            value: initialSnapshot.xScale,
            min: 2,
            max: 40,
            step: 0.5,
          },
          yScale: {
            label: 'Y Scale',
            value: initialSnapshot.yScale,
            min: -40,
            max: -2,
            step: 0.5,
          },
          zScale: {
            label: 'Z Scale',
            value: initialSnapshot.zScale,
            min: 2,
            max: 40,
            step: 0.5,
          },
          yOffset: {
            label: 'Y Offset',
            value: initialSnapshot.yOffset,
            min: 8,
            max: 52,
            step: 0.5,
          },
          zOffset: {
            label: 'Z Offset',
            value: initialSnapshot.zOffset,
            min: 8,
            max: 52,
            step: 0.5,
          },
          toggleMode: button(toggleInteractionMode),
        },
        { collapsed: true }
      ),
      Stage: folder(
        {
          environmentMode: {
            label: 'Environment',
            options: {
              Flow: APPARITIONS_ENVIRONMENTS.flow,
              'Outside Space and Time':
                APPARITIONS_ENVIRONMENTS.outsideSpaceTime,
            },
            value: initialSnapshot.environmentMode,
          },
          flowEnvironmentIntensity: {
            label: 'Flow Env Intensity',
            value: initialSnapshot.flowEnvironmentIntensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          outsideBackgroundColor: {
            label: 'Outside BG',
            value: initialSnapshot.outsideBackgroundColor,
          },
          boundsLineColor: {
            label: 'Bounds Line Color',
            value: initialSnapshot.boundsLineColor,
          },
          boundsLineWeight: {
            label: 'Bounds Line Weight',
            value: initialSnapshot.boundsLineWeight,
            min: 0.5,
            max: 20,
            step: 0.1,
          },
          boundsSize: {
            label: 'Bounds Size',
            value: initialSnapshot.boundsSize,
            min: 0.2,
            max: 1.8,
            step: 0.01,
          },
          boundsCenterY: {
            label: 'Bounds Y',
            value: initialSnapshot.boundsCenterY,
            min: -1,
            max: 1,
            step: 0.01,
          },
          boundsCenterZ: {
            label: 'Bounds Z',
            value: initialSnapshot.boundsCenterZ,
            min: -1,
            max: 1,
            step: 0.01,
          },
          boundsDepth: {
            label: 'Bounds Depth',
            value: initialSnapshot.boundsDepth,
            min: 0.2,
            max: 1.8,
            step: 0.01,
          },
          particleDepthScale: {
            label: 'Particle Depth',
            value: initialSnapshot.particleDepthScale,
            min: 0.25,
            max: 1.5,
            step: 0.01,
          },
          particleZOffset: {
            label: 'Particle Z Offset',
            value: initialSnapshot.particleZOffset,
            min: -1,
            max: 1,
            step: 0.01,
          },
          autoOrbit: { label: 'Auto Orbit', value: initialSnapshot.autoOrbit },
          autoOrbitSpeed: {
            label: 'Orbit Speed',
            value: initialSnapshot.autoOrbitSpeed,
            min: 0.01,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    setControlsRef.current = setControls;
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  return {
    controls,
    setControls,
  };
}
