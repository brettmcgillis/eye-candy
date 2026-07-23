import { Mesh } from 'three';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { DifferentialGrowthEngine } from '../growth/differentialGrowthEngine';
import prepareLogoGeometry from '../growth/prepareLogoGeometry';

// Fixed growth increment per recorded step so a snapshot represents the same
// amount of growth regardless of framerate.
const FIXED_DT = 1 / 60;
// Timeline length cap (snapshots = full geometry clones, so this bounds memory).
const MAX_STEPS = 160;
// Recording is the only expensive phase; cap steps/frame so a big "surge" paces
// its growth over frames instead of hitching on one frame.
const MAX_STEPS_PER_FRAME = 1;

function simSignature(sim) {
  return [
    sim.growthStep,
    sim.targetEdgeLength,
    sim.splitThreshold,
    sim.repulsion,
    sim.smoothing,
    sim.shapeRetention,
    sim.maxVertices,
    sim.seed,
    sim.seedInfluence,
    sim.growthSpeed,
    sim.gradientBlur,
  ].join('|');
}

// Maps the driver's accumulated phase to a 0..1 growth amount. 'grow' is a
// one-way ramp that holds at full; 'surge' (triangle) and 'breathe' (eased)
// grow then rewind on a loop; 'manual' is driven directly by the scrub control.
function growthAmount(mode, phase, offset, scrub) {
  if (mode === 'manual') {
    return Math.min(1, Math.max(0, scrub));
  }
  if (mode === 'grow') {
    return Math.min(1, Math.max(0, phase));
  }
  const cycle = phase + offset - Math.floor(phase + offset);
  if (mode === 'breathe') {
    return 0.5 - 0.5 * Math.cos(cycle * Math.PI * 2);
  }
  return cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;
}

export default function useDifferentialGrowth({
  sourceGeometry,
  material,
  enabled,
  sim,
  driver,
  baseVertexCount = 3000,
}) {
  const mesh = useMemo(() => new Mesh(), []);

  const preparedRef = useRef(null);
  const engineRef = useRef(null);
  const timelineRef = useRef([]);
  const recordedMaxRef = useRef(0);
  const cappedRef = useRef(false);
  const displayedStepRef = useRef(0);
  const phaseRef = useRef(0);
  const signatureRef = useRef(null);
  const restoreRef = useRef(null);
  const engagedRef = useRef(false);

  const disposeTimeline = () => {
    for (let i = 0; i < timelineRef.current.length; i += 1) {
      timelineRef.current[i].dispose();
    }
    timelineRef.current = [];
  };

  const buildEngine = () => {
    const prepared = preparedRef.current;
    if (!prepared) return;
    disposeTimeline();
    const engine = new DifferentialGrowthEngine(
      prepared.geometry.clone(),
      { ...sim },
      sim.seed
    );
    engine.setGradientBlur(sim.gradientBlur);
    engineRef.current = engine;
    const baseGeometry = engine.getGeometry().clone();
    timelineRef.current = [baseGeometry];
    recordedMaxRef.current = 0;
    cappedRef.current = false;
    displayedStepRef.current = 0;
    phaseRef.current = 0;
    mesh.geometry = baseGeometry;
    signatureRef.current = simSignature(sim);
  };

  useEffect(() => {
    if (!enabled || !sourceGeometry) return undefined;
    if (!preparedRef.current) {
      try {
        preparedRef.current = prepareLogoGeometry(
          sourceGeometry,
          baseVertexCount
        );
        restoreRef.current = preparedRef.current.restore;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[LoGlow] differential-growth prepare failed', error);
        return undefined;
      }
    }
    buildEngine();
    return () => {
      disposeTimeline();
      engineRef.current = null;
    };
  }, [enabled, sourceGeometry, baseVertexCount]);

  useFrame((_, delta) => {
    if (material) {
      mesh.material = material;
    }
    const engine = engineRef.current;
    if (!enabled || !engine) {
      engagedRef.current = false;
      return;
    }

    if (signatureRef.current !== simSignature(sim)) {
      buildEngine();
    }

    const windowSteps = Math.max(
      1,
      Math.min(MAX_STEPS, Math.round(driver.reach))
    );

    // 'grow' ramps over windowSteps/tempo seconds; the looping modes take twice
    // that for a full grow-and-rewind cycle.
    if (driver.mode === 'grow') {
      phaseRef.current += (driver.tempo * delta) / windowSteps;
    } else if (driver.mode !== 'manual') {
      phaseRef.current += (driver.tempo * delta) / (2 * windowSteps);
    }
    const amount = growthAmount(
      driver.mode,
      phaseRef.current,
      driver.phase,
      driver.scrub
    );
    const targetStep = Math.round(amount * windowSteps);

    let stepsThisFrame = 0;
    while (
      recordedMaxRef.current < targetStep &&
      recordedMaxRef.current < MAX_STEPS &&
      !cappedRef.current &&
      stepsThisFrame < MAX_STEPS_PER_FRAME
    ) {
      const before = engine.getGeometry().getAttribute('position').count;
      engine.step(FIXED_DT, sim.growthSpeed, sim.seedInfluence);
      const after = engine.getGeometry().getAttribute('position').count;
      timelineRef.current.push(engine.getGeometry().clone());
      recordedMaxRef.current += 1;
      stepsThisFrame += 1;
      if (after >= sim.maxVertices && after === before) {
        cappedRef.current = true;
      }
    }

    const displayStep = Math.min(targetStep, recordedMaxRef.current);
    if (displayStep !== displayedStepRef.current) {
      mesh.geometry = timelineRef.current[displayStep];
      displayedStepRef.current = displayStep;
    }
    engagedRef.current = displayStep > 0;
  });

  return { mesh, restoreRef, engagedRef };
}
