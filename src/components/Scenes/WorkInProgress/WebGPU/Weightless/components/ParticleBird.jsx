import * as THREE from 'three/webgpu';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createParticleSimulation from '../utils/createParticleSimulation';
import measureSkinnedBounds from '../utils/measureSkinnedBounds';
import sampleBird from '../utils/sampleBird';
import BirdRig from './BirdRig';
import PointerInput from './PointerInput';

const COLOR_MODES = { solid: 0, gradient: 1, velocity: 2 };
const EMIT_WARMUP_SECONDS = 0.5;
const SAMPLE_SEED = 7;
// The GLTF places the bird off-origin at an arbitrary scale. On the first
// simulated frame we measure its real skinned bounds and normalize a
// wrapper group so the bird sits at the origin at this diameter — the
// scene's focal point, matching the orbit camera pivot in utils/camera.js.
const TARGET_DIAMETER = 2.2;

const invUser = new THREE.Matrix4();

function classify(mesh) {
  // userData.materialName is tagged by BirdRig before ghost mode swaps the
  // real materials out — never read the live material's name here.
  const name = mesh.userData.materialName ?? mesh.material?.name ?? '';
  return {
    mesh,
    emitter: /feather/i.test(name),
    body: /body/i.test(name),
  };
}

function ParticleBird({ config, birdStateRef, onMeshes }) {
  const { gl } = useThree();
  const [meshes, setMeshes] = useState(null);
  const simRef = useRef(null);
  const groupRef = useRef(new THREE.Group());
  // userGroup carries the birdScale/birdYaw controls; normGroup inside it
  // holds the one-time auto-fit so the controls stay meaningful.
  const userGroupRef = useRef(null);
  const normGroupRef = useRef(null);
  const elapsedRef = useRef(0);
  // World-space bird bounds, refreshed each frame for pointer hit tests.
  const birdSphereRef = useRef({
    center: new THREE.Vector3(),
    radius: 0,
  });

  const handleReady = useCallback(
    (list) => {
      setMeshes(list);
      onMeshes?.(list);
    },
    [onMeshes]
  );

  // Debounce sim rebuilds — count is a draggable number control and each
  // rebuild re-samples the mesh and recreates the compute pipeline.
  const [simParams, setSimParams] = useState({
    count: config.particleCount,
    surfaceRatio: config.surfaceRatio,
  });
  useEffect(() => {
    const id = setTimeout(
      () =>
        setSimParams((prev) =>
          prev.count === config.particleCount &&
          prev.surfaceRatio === config.surfaceRatio
            ? prev
            : {
                count: config.particleCount,
                surfaceRatio: config.surfaceRatio,
              }
        ),
      300
    );
    return () => clearTimeout(id);
  }, [config.particleCount, config.surfaceRatio]);

  useEffect(() => {
    if (!meshes) return undefined;

    const group = groupRef.current;
    const samples = sampleBird(
      meshes.map(classify),
      simParams.count,
      simParams.surfaceRatio,
      SAMPLE_SEED
    );
    const sim = createParticleSimulation(samples, meshes[0].skeleton);
    group.add(sim.mesh);
    simRef.current = {
      sim,
      samples,
      reference: meshes[0],
      armatureRoot: null,
      fitted: false,
      preNormCenter: new THREE.Vector3(),
      preNormRadius: 0,
    };

    return () => {
      group.remove(sim.mesh);
      sim.dispose();
      simRef.current = null;
    };
  }, [meshes, simParams]);

  useFrame((_, rawDelta) => {
    const entry = simRef.current;
    const norm = normGroupRef.current;
    const user = userGroupRef.current;
    if (!entry || !norm || !user) return;

    const dt = Math.min(Math.max(rawDelta, 1e-4), 1 / 30);
    elapsedRef.current += dt;

    const { sim, reference } = entry;

    // Bring bone world matrices up to date for this frame (the renderer
    // won't do it for us when the source bird is hidden).
    if (!entry.armatureRoot) {
      let root = reference.skeleton.bones[0] ?? reference;
      while (root.parent && !root.parent.isScene) root = root.parent;
      entry.armatureRoot = root;
    }
    entry.armatureRoot.updateMatrixWorld(true);
    reference.skeleton.update();

    // One-time auto-fit (re-measured from identity after sim rebuilds, so
    // it never compounds): CPU-skin a subset of samples against the live
    // bone matrices, measured in userGroup space so the birdScale/birdYaw
    // controls stay on top of the normalization.
    if (!entry.fitted) {
      norm.position.set(0, 0, 0);
      norm.scale.setScalar(1);
      norm.updateMatrixWorld(true);
      reference.skeleton.update();

      invUser.copy(user.matrixWorld).invert();
      const { center, radius } = measureSkinnedBounds(
        entry.samples,
        reference.skeleton,
        invUser
      );

      if (radius > 0 && Number.isFinite(radius)) {
        const s = TARGET_DIAMETER / (radius * 2);
        norm.scale.setScalar(s);
        norm.position.copy(center).multiplyScalar(-s);
        norm.updateMatrixWorld(true);
        reference.skeleton.update();
        entry.preNormCenter.copy(center);
        entry.preNormRadius = radius;
        entry.fitted = true;
      }
    }

    // Publish shared rig state for sibling systems (CurlTrails) — they run
    // in later useFrame subscriptions this same frame.
    if (birdStateRef) {
      const pub = birdStateRef.current;
      pub.fitted = entry.fitted;
      pub.skeleton = reference.skeleton;
      pub.boneMatrices = reference.skeleton.boneMatrices;
      pub.normMatrix.copy(norm.matrixWorld);
      pub.normScale = norm.matrixWorld.getMaxScaleOnAxis();
    }

    // Pointer hit-test sphere: pre-norm center carried through the live
    // norm transform (norm.matrixWorld includes the user group).
    const sphere = birdSphereRef.current;
    sphere.center.copy(entry.preNormCenter).applyMatrix4(norm.matrixWorld);
    sphere.radius = entry.preNormRadius * norm.matrixWorld.getMaxScaleOnAxis();

    // When particles are disabled the rig/fit/publish above still run (the
    // trail systems depend on them), but the particle sim itself idles.
    sim.mesh.visible = config.particlesEnabled;
    if (!config.particlesEnabled) return;

    sim.setBoneMatrices();

    const u = sim.uniforms;
    u.dt.value = dt;
    u.time.value = elapsedRef.current;
    u.emitGate.value =
      config.emissionEnabled && elapsedRef.current > EMIT_WARMUP_SECONDS
        ? 1
        : 0;

    u.boundFlow.value = config.boundFlow;
    u.boundFreq.value = config.boundFreq;
    u.boundSpring.value = config.boundSpring;
    u.shell.value = config.shell;
    u.evolve.value = config.evolve;

    u.emitRate.value = config.emitRate;
    u.emitMinSpeed.value = config.emitMinSpeed;
    u.emitMaxSpeed.value = config.emitMaxSpeed;
    u.feathersOnly.value = config.feathersOnly ? 1 : 0;
    u.inherit.value = config.inherit;
    u.kick.value = config.kick;
    u.lifeSpan.value = config.lifeSpan;
    u.freeCurl.value = config.freeCurl;
    u.freeFreq.value = config.freeFreq;
    u.freeDrag.value = config.freeDrag;
    u.gravity.value = config.gravity;

    u.size.value = config.particleSize;
    u.emittedSize.value = config.emittedParticleSize;
    u.intensity.value = config.intensity;
    u.boundAlpha.value = config.boundAlpha;
    u.freeAlpha.value = config.freeAlpha;
    u.colorMode.value = COLOR_MODES[config.colorMode] ?? 0;
    u.colorA.value.set(config.colorA);
    u.colorB.value.set(config.colorB);
    u.speedMin.value = config.speedMin;
    u.speedMax.value = config.speedMax;

    gl.compute(sim.computeKernel);
  });

  return (
    <>
      <group
        ref={userGroupRef}
        scale={config.birdScale}
        rotation={[0, config.birdYaw, 0]}
      >
        <group ref={normGroupRef}>
          <BirdRig
            visible={config.birdVisible}
            ghost={config.ghostBody}
            ghostColor={config.ghostColor}
            ghostOpacity={config.ghostOpacity}
            timeScale={config.animationSpeed}
            onReady={handleReady}
          />
        </group>
      </group>
      <primitive object={groupRef.current} />
      <PointerInput
        simRef={simRef}
        birdSphereRef={birdSphereRef}
        enabled={config.interactionEnabled}
        mode={config.attractorMode}
        strength={config.attractorStrength}
        radius={config.attractorRadius}
        touchBoost={config.touchBoost}
        touchRadiusScale={config.touchRadiusScale}
      />
    </>
  );
}

export default memo(ParticleBird);
