import * as THREE from 'three';

import React, { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useMediaPipeBodyTracking from '../../../../../../hooks/pose/useMediaPipeBodyTracking';
import useApparitionAudio from '../hooks/useApparitionAudio';
import usePresenceState from '../hooks/usePresenceState';
import { createAttractorBus } from '../layers/attractorBus';
import createAutonomousLfo from '../layers/autonomousLfo';
import createGhostSource from '../layers/ghostSource';
import createMotionEnergy from '../layers/motionEnergy';
import createViewerSource from '../layers/viewerSource';
import { ENVIRONMENTS, FLOW_VOLUME_BOUNDS } from '../presets/presets';
import MlsMpmSimulator from '../utils/MlsMpmSimulator';
import ParticleRenderer from '../utils/ParticleRenderer';
import {
  MAX_ATTRACTORS,
  detectModeToggleGesture,
} from '../utils/trackingAttractors';
import AttractorDebug from './AttractorDebug';
import ParticleBounds from './ParticleBounds';

const PRESENCE_INDEX = {
  off: -1,
  dormant: 0,
  sensed: 1,
  forming: 2,
  dissolving: 3,
};

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function fieldBlendFor(controls, elapsed) {
  if (controls.fieldMode === 'negative') return -1;
  if (controls.fieldMode === 'auto') {
    return Math.sin(elapsed * controls.fieldAutoRate * Math.PI * 2);
  }
  return 1;
}

function ParticleSystem({ controls, setControls, statsRef }) {
  const { gl } = useThree();
  const simRef = useRef(null);
  const particleRendererRef = useRef(null);
  const systemGroupRef = useRef(new THREE.Group());
  const modeToggleCooldownRef = useRef(0);
  const elapsedRef = useRef(0);
  // Live combined attractor list for the debug overlay (one-frame lag is fine).
  const debugRef = useRef({ list: [], count: 0 });

  // ---- composable capability layers (created once) ----
  const ghostRef = useRef(null);
  if (!ghostRef.current) ghostRef.current = createGhostSource(8);
  const viewerRef = useRef(null);
  if (!viewerRef.current) viewerRef.current = createViewerSource();
  const lfoRef = useRef(null);
  if (!lfoRef.current) lfoRef.current = createAutonomousLfo();
  const motionRef = useRef(null);
  if (!motionRef.current) motionRef.current = createMotionEnergy();
  const busRef = useRef(null);
  if (!busRef.current) busRef.current = createAttractorBus(MAX_ATTRACTORS);

  // ---- reused scratch (no per-frame allocation) ----
  const sourceListsRef = useRef([null, null, null]);
  const gravityRef = useRef(new THREE.Vector3());
  const configRef = useRef({ gravity: null });
  const rendererCfgRef = useRef({});
  const attractorOptsRef = useRef({ mode: 'attract', radius: 8 });
  const musicInputsRef = useRef({
    comHeight: 0.5,
    density: 0.5,
    bodyEnergy: 0,
    peopleCount: 0,
  });

  const presence = usePresenceState();
  const audio = useApparitionAudio({ controls, musicInputsRef });

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
      if (particleRenderer?.object) group.remove(particleRenderer.object);
      simRef.current = null;
      particleRendererRef.current = null;
    };
  }, [controls.maxParticles, gl]);

  useFrame((_, rawDelta) => {
    const sim = simRef.current;
    const particleRenderer = particleRendererRef.current;
    if (!sim || !particleRenderer) return;

    const delta = Math.min(rawDelta, 1 / 30);
    elapsedRef.current += delta;

    // Tracking may be null (camera optional / denied / still loading) — every
    // layer below degrades to the as-is performance when it is.
    const peopleCount = tracking?.worldLandmarks?.length ?? 0;
    const gains = presence.update(delta, peopleCount, controls);

    const stats = statsRef.current;
    stats.bodyEnergy = 0;
    stats.agitate = 0;

    // ---- base config + summed modulator deltas ----
    const gravity = gravityRef.current;
    gravity.set(controls.gravityX, controls.gravityY, controls.gravityZ);
    let { noise, speed, restDensity, stiffness } = controls;

    if (controls.autonomousMotion) {
      const d = lfoRef.current.update(delta, {
        rate: controls.autonomousRate,
        depth: controls.autonomousDepth,
      });
      gravity.add(d.gravity);
      noise += d.noise;
      restDensity += d.restDensity;
      speed += d.speed;
    }

    let impulseList = null;
    if (controls.interactivityEnabled) {
      const d = motionRef.current.update(tracking, delta, controls, {
        gain: gains.motionGain,
      });
      gravity.add(d.gravity);
      noise += d.noise;
      speed += d.speed;
      restDensity += d.restDensity;
      stiffness += d.stiffness;
      impulseList = motionRef.current.impulses;

      const mi = motionRef.current.getMusicInputs();
      musicInputsRef.current.comHeight = mi.comHeight;
      musicInputsRef.current.bodyEnergy = mi.bodyEnergy;
      stats.bodyEnergy = mi.bodyEnergy;
      stats.agitate = mi.agitate;
    }

    if (controls.audioInEnabled) {
      const b = audio.bandsRef.current;
      restDensity += b.bass * controls.audioBassGain;
      noise +=
        b.high * controls.audioHighGain + b.beat * controls.audioBeatGain;
      speed += b.beat * controls.audioBeatGain * 0.5;
    }

    // WS3 sensed ripple → a brief shimmer when someone is noticed.
    noise += gains.sensedPulse * controls.sensedPulseStrength;
    speed += gains.sensedPulse * controls.sensedPulseStrength * 0.5;

    // ---- attractor sources ----
    let ghostList = null;
    if (controls.ghostApparitions) {
      ghostList = ghostRef.current.update(delta, {
        count: controls.ghostCount,
        strength: controls.ghostStrength,
        radius: controls.ghostRadius,
        gain: gains.ghostGain,
      });
    }

    let viewerList = null;
    if (controls.interactivityEnabled) {
      viewerList = viewerRef.current.build(tracking, controls, {
        gain: gains.viewerGain,
        fieldBlend: fieldBlendFor(controls, elapsedRef.current),
      });
    }

    // Priority order in the combined list: viewer field, then hand impulses,
    // then ambient ghosts (first to be evicted under the budget).
    const lists = sourceListsRef.current;
    lists[0] = viewerList;
    lists[1] = impulseList;
    lists[2] = ghostList;
    const combined = busRef.current.combine(lists);

    debugRef.current.list = combined;
    debugRef.current.count = combined.length;
    stats.people = peopleCount;
    stats.attractors = combined.length;
    stats.presence = PRESENCE_INDEX[gains.state] ?? -1;

    // ---- clamp summed config, push to sim ----
    noise = clamp(noise, 0, 3);
    speed = clamp(speed, 0.05, 3);
    restDensity = clamp(restDensity, 0.2, 3);
    stiffness = clamp(stiffness, 0.2, 10);
    musicInputsRef.current.density = clamp(restDensity / 2.5, 0, 1);
    musicInputsRef.current.peopleCount = peopleCount;

    const attractorOpts = attractorOptsRef.current;
    attractorOpts.mode = controls.interactionMode;
    attractorOpts.radius = controls.attractorRadius;
    sim.setAttractors(combined, attractorOpts);

    const particles = Math.max(
      4096,
      Math.round(controls.particles * gains.particleScale)
    );

    const config = configRef.current;
    config.delta = delta;
    config.dynamicViscosity = controls.dynamicViscosity;
    config.gravity = gravity;
    config.noise = noise;
    config.particles = particles;
    config.restDensity = restDensity;
    config.speed = speed;
    config.stiffness = stiffness;
    config.hueBlend = controls.perPersonHue ? controls.hueBlend : 0;
    sim.updateConfig(config);

    if (controls.runSimulation) sim.step();

    const rendererCfg = rendererCfgRef.current;
    rendererCfg.bloom = controls.bloom;
    rendererCfg.depthScale = controls.particleDepthScale;
    rendererCfg.particles = particles;
    rendererCfg.size = controls.particleSize;
    rendererCfg.zOffset = controls.particleZOffset;
    rendererCfg.colorMode = controls.colorMode;
    rendererCfg.colorScale = controls.colorScale;
    rendererCfg.colorA = controls.colorA;
    rendererCfg.colorB = controls.colorB;
    particleRenderer.update(rendererCfg);

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
      {controls.showBounds && (
        <ParticleBounds
          centerY={bounds.boundsCenterY}
          centerZ={bounds.boundsCenterZ}
          depth={bounds.boundsDepth}
          size={bounds.boundsSize}
          lineColor={controls.boundsLineColor}
          lineWeight={controls.boundsLineWeight}
        />
      )}
      <AttractorDebug debugRef={debugRef} controls={controls} />
    </>
  );
}

export default React.memo(ParticleSystem);
