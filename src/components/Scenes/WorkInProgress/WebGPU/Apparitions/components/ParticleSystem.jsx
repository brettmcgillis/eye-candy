import * as THREE from 'three';

import React, { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useMediaPipeBodyTracking from '../../../../../../hooks/pose/useMediaPipeBodyTracking';
import { ENVIRONMENTS, FLOW_VOLUME_BOUNDS } from '../presets/presets';
import MlsMpmSimulator from '../utils/MlsMpmSimulator';
import ParticleRenderer from '../utils/ParticleRenderer';
import {
  MAX_ATTRACTORS,
  buildAttractorsFromTracking,
  detectModeToggleGesture,
} from '../utils/trackingAttractors';
import ParticleBounds from './ParticleBounds';

export default function ParticleSystem({ controls, setControls }) {
  const { gl } = useThree();
  const simRef = useRef(null);
  const particleRendererRef = useRef(null);
  const systemGroupRef = useRef(new THREE.Group());
  const modeToggleCooldownRef = useRef(0);

  const tracking = useMediaPipeBodyTracking({
    enabled: controls.interactivityEnabled,
    mode: controls.trackingMode,
    maxPoses: controls.maxPeople,
    minPoseDetectionConfidence: controls.minPoseDetectionConfidence,
    minPosePresenceConfidence: controls.minPosePresenceConfidence,
    minTrackingConfidence: controls.minTrackingConfidence,
    minHandLandmarksConfidence: controls.minHandLandmarksConfidence,
    minFaceDetectionConfidence: controls.minFaceDetectionConfidence,
    minFacePresenceConfidence: controls.minFacePresenceConfidence,
    showVideo: controls.showVideo,
    showDebugSkeleton: controls.showDebugSkeleton,
    videoSize: controls.videoSize,
  });

  const bounds =
    controls.environmentMode === ENVIRONMENTS.outsideSpaceTime
      ? controls
      : FLOW_VOLUME_BOUNDS;

  useEffect(() => {
    const { backend } = gl;
    if (!backend || typeof backend.trackTimestamp !== 'boolean') {
      return undefined;
    }

    const previousTrackTimestamp = backend.trackTimestamp;
    backend.trackTimestamp = false;

    return () => {
      backend.trackTimestamp = previousTrackTimestamp;
    };
  }, [gl]);

  useEffect(() => {
    const group = systemGroupRef.current;
    let cancelled = false;

    const setup = async () => {
      const sim = new MlsMpmSimulator(gl, {
        maxAttractors: MAX_ATTRACTORS,
        maxParticles: controls.maxParticles,
      });
      await sim.init();

      if (cancelled) return;

      const particleRenderer = new ParticleRenderer(sim);
      simRef.current = sim;
      particleRendererRef.current = particleRenderer;
      group.add(particleRenderer.object);
    };

    setup();

    return () => {
      cancelled = true;

      const particleRenderer = particleRendererRef.current;
      if (particleRenderer?.object) {
        group.remove(particleRenderer.object);
      }

      simRef.current = null;
      particleRendererRef.current = null;
    };
  }, [controls.maxParticles, gl]);

  useFrame((_, delta) => {
    const sim = simRef.current;
    const particleRenderer = particleRendererRef.current;
    if (!sim || !particleRenderer) return;

    const attractors = controls.interactivityEnabled
      ? buildAttractorsFromTracking(tracking, controls)
      : [];
    sim.setAttractors(
      attractors,
      controls.interactionMode,
      controls.attractorRadius
    );

    sim.updateConfig({
      delta,
      dynamicViscosity: controls.dynamicViscosity,
      gravity: new THREE.Vector3(0, controls.gravityY, controls.gravityZ),
      noise: controls.noise,
      particles: controls.particles,
      restDensity: controls.restDensity,
      speed: controls.speed,
      stiffness: controls.stiffness,
    });

    if (controls.runSimulation) {
      sim.step();
    }

    particleRenderer.update({
      bloom: controls.bloom,
      depthScale: controls.particleDepthScale,
      particles: controls.particles,
      size: controls.particleSize,
      zOffset: controls.particleZOffset,
    });

    if (
      controls.interactivityEnabled &&
      controls.enableGestureToggle &&
      modeToggleCooldownRef.current <= 0 &&
      detectModeToggleGesture(tracking)
    ) {
      setControls({
        interactionMode:
          controls.interactionMode === 'attract' ? 'repel' : 'attract',
      });
      modeToggleCooldownRef.current = 1;
    }

    modeToggleCooldownRef.current = Math.max(
      0,
      modeToggleCooldownRef.current - delta
    );
  });

  return (
    <>
      <primitive object={systemGroupRef.current} />
      <ParticleBounds
        centerY={bounds.boundsCenterY}
        centerZ={bounds.boundsCenterZ}
        depth={bounds.boundsDepth}
        size={bounds.boundsSize}
        lineColor={controls.boundsLineColor}
        lineWeight={controls.boundsLineWeight}
      />
    </>
  );
}
