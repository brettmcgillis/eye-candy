import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  buildLightningBoltGeometry,
  getBoltLengthScale,
  getImpactTransform,
} from './lightningGeometry';
import {
  BOLT_FRAGMENT_SHADER,
  BOLT_VERTEX_SHADER,
  CRACK_FRAGMENT_SHADER,
  CRACK_VERTEX_SHADER,
  IMPACT_FRAGMENT_SHADER,
  IMPACT_VERTEX_SHADER,
  SHOCKWAVE_FRAGMENT_SHADER,
  SHOCKWAVE_VERTEX_SHADER,
  SPARK_FRAGMENT_SHADER,
  SPARK_VERTEX_SHADER,
} from './lightningShaders';
import {
  buildImpactCrackPaths,
  buildLightningCrackGeometry,
  createDebrisBurst,
  createShaderSparkGeometry,
  initializeDebrisMesh,
  updateDebrisBurst,
} from './lightningStrikeEffects';
import { buildLightningStrands, getFlashEnvelope } from './lightningUtils';

function createStrikeObject(strike, config) {
  const group = new THREE.Group();
  group.name = 'LightningStrikeGL';
  group.userData.lightningIgnore = true;
  const impactRoot = new THREE.Group();
  impactRoot.userData.lightningIgnore = true;
  group.add(impactRoot);

  const lastSource = new THREE.Vector3();
  const lastTarget = new THREE.Vector3();
  const showImpactEffects = strike.surfaceType !== 'air';

  const boltMaterial = new THREE.ShaderMaterial({
    vertexShader: BOLT_VERTEX_SHADER,
    fragmentShader: BOLT_FRAGMENT_SHADER,
    uniforms: {
      uFadeDur: {
        value: Math.max(strike.totalDuration - strike.strikeDuration, 0.001),
      },
      uSpread: { value: config.boltSpread },
      uStrikeDur: { value: strike.strikeDuration },
      uTime: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const boltMesh = new THREE.Mesh(new THREE.BufferGeometry(), boltMaterial);
  boltMesh.renderOrder = 26;
  boltMesh.userData.lightningIgnore = true;
  group.add(boltMesh);

  const impactMaterial =
    showImpactEffects && config.groundFlash.enabled
      ? new THREE.ShaderMaterial({
          vertexShader: IMPACT_VERTEX_SHADER,
          fragmentShader: IMPACT_FRAGMENT_SHADER,
          uniforms: {
            uColor: { value: config.groundFlash.color.clone() },
            uDur: { value: config.groundFlash.duration },
            uFadePow: { value: config.groundFlash.fadePower },
            uIntensity: { value: config.groundFlash.intensity },
            uRadialPow: { value: config.groundFlash.radialPower },
            uTime: { value: -1 },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        })
      : null;
  const impactMesh = impactMaterial
    ? new THREE.Mesh(
        new THREE.PlaneGeometry(
          config.groundFlash.size,
          config.groundFlash.size
        ),
        impactMaterial
      )
    : null;

  if (impactMesh) {
    impactMesh.renderOrder = 23;
    impactMesh.userData.lightningIgnore = true;
    impactRoot.add(impactMesh);
  }

  const shockwaveMaterial =
    showImpactEffects && config.shockwave.enabled
      ? new THREE.ShaderMaterial({
          vertexShader: SHOCKWAVE_VERTEX_SHADER,
          fragmentShader: SHOCKWAVE_FRAGMENT_SHADER,
          uniforms: {
            uAlphaMult: { value: config.shockwave.alphaMultiplier },
            uColorA: { value: config.shockwave.colorA.clone() },
            uColorB: { value: config.shockwave.colorB.clone() },
            uDelay: { value: strike.strikeDuration },
            uDur: { value: config.shockwave.duration },
            uTime: { value: 0 },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        })
      : null;
  const shockwaveMesh = shockwaveMaterial
    ? new THREE.Mesh(
        new THREE.PlaneGeometry(config.shockwave.size, config.shockwave.size),
        shockwaveMaterial
      )
    : null;

  if (shockwaveMesh) {
    shockwaveMesh.renderOrder = 22;
    shockwaveMesh.userData.lightningIgnore = true;
    impactRoot.add(shockwaveMesh);
  }

  const crackPaths =
    showImpactEffects && config.crack.enabled
      ? buildImpactCrackPaths(strike.seed, config.crack)
      : [];
  const crackGlowGeometry =
    showImpactEffects && config.crack.enabled
      ? buildLightningCrackGeometry(crackPaths, config.crack)
      : null;
  const crackGlowMaterial = crackGlowGeometry
    ? new THREE.ShaderMaterial({
        vertexShader: CRACK_VERTEX_SHADER,
        fragmentShader: CRACK_FRAGMENT_SHADER,
        uniforms: {
          uCoreColor: { value: config.crack.coreColor.clone() },
          uDelay: { value: config.crack.delay },
          uFadeDur: { value: config.crack.fadeDuration },
          uEdgeColor: { value: config.crack.edgeColor.clone() },
          uMidColor: { value: config.crack.midColor.clone() },
          uRevealDur: { value: config.crack.revealDuration },
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    : null;
  const crackGlowMesh =
    crackGlowGeometry && crackGlowMaterial
      ? new THREE.Mesh(crackGlowGeometry, crackGlowMaterial)
      : null;

  if (crackGlowMesh) {
    crackGlowMesh.renderOrder = 24;
    crackGlowMesh.userData.lightningIgnore = true;
    impactRoot.add(crackGlowMesh);
  }

  const sparkGeometry =
    showImpactEffects && config.sparks.enabled
      ? createShaderSparkGeometry(strike.seed, config.sparks)
      : null;
  const sparkMaterial = sparkGeometry
    ? new THREE.ShaderMaterial({
        vertexShader: SPARK_VERTEX_SHADER,
        fragmentShader: SPARK_FRAGMENT_SHADER,
        uniforms: {
          uDelay: { value: config.sparks.delay },
          uDepthScale: { value: config.sparks.depthScale },
          uGravity: { value: config.sparks.gravity },
          uSize: { value: config.sparks.size },
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    : null;
  const sparkPoints =
    sparkGeometry && sparkMaterial
      ? new THREE.Points(sparkGeometry, sparkMaterial)
      : null;

  if (sparkPoints) {
    sparkPoints.renderOrder = 25;
    sparkPoints.userData.lightningIgnore = true;
    impactRoot.add(sparkPoints);
  }

  const debrisState =
    showImpactEffects && config.debris.enabled
      ? createDebrisBurst(strike.seed, config.debris)
      : null;
  const debrisMaterial = debrisState
    ? new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: true,
        vertexColors: true,
      })
    : null;
  const debrisMesh =
    debrisState && debrisMaterial
      ? new THREE.InstancedMesh(
          new THREE.PlaneGeometry(1, 1),
          debrisMaterial,
          debrisState.count
        )
      : null;

  if (debrisMesh && debrisState) {
    debrisMesh.renderOrder = 24;
    debrisMesh.userData.lightningIgnore = true;
    initializeDebrisMesh(debrisState, debrisMesh);
    impactRoot.add(debrisMesh);
  }

  function rebuild(source, target) {
    const boltLengthScale = getBoltLengthScale(source, target);
    const strands = buildLightningStrands({
      branchCount: strike.branchCount ?? config.branchCount,
      mainFractalDepth: strike.mainFractalDepth ?? config.mainFractalDepth,
      roughness: strike.roughness ?? config.roughness,
      seed: strike.seed,
      source,
      target,
      ...(strike.strandOptions ?? null),
    });
    const nextGeometry = buildLightningBoltGeometry({
      coreColor: config.coreColor,
      glowColor: config.glowColor,
      layers: config.boltLayers.map((layer) => ({
        ...layer,
        thickness: layer.thickness * boltLengthScale,
      })),
      strands,
      thickness: config.thickness,
    });

    boltMesh.geometry.dispose();
    boltMesh.geometry = nextGeometry;
    lastSource.copy(source);
    lastTarget.copy(target);
  }

  function update(elapsed, target, normal) {
    const impactTime = elapsed - strike.strikeDuration;
    const { position, quaternion } = getImpactTransform(target, normal, 0.04);

    boltMaterial.uniforms.uTime.value = elapsed;

    if (impactMaterial) {
      impactMaterial.uniforms.uTime.value = impactTime;
    }

    if (shockwaveMaterial) {
      shockwaveMaterial.uniforms.uTime.value = elapsed;
    }

    if (crackGlowMaterial) {
      crackGlowMaterial.uniforms.uTime.value = elapsed;
    }

    if (sparkMaterial) {
      sparkMaterial.uniforms.uTime.value = elapsed;
    }

    if (showImpactEffects) {
      impactRoot.position.copy(position);
      impactRoot.quaternion.copy(quaternion);
    }
  }

  function updateImpactParticles(delta, elapsed) {
    if (debrisState && debrisMesh) {
      updateDebrisBurst(
        debrisState,
        debrisMesh,
        delta,
        elapsed >= strike.strikeDuration
      );
    }
  }

  function dispose() {
    boltMesh.geometry.dispose();
    boltMaterial.dispose();

    if (impactMesh && impactMaterial) {
      impactMesh.geometry.dispose();
      impactMaterial.dispose();
    }

    if (shockwaveMesh && shockwaveMaterial) {
      shockwaveMesh.geometry.dispose();
      shockwaveMaterial.dispose();
    }

    if (crackGlowMesh && crackGlowMaterial) {
      crackGlowMesh.geometry.dispose();
      crackGlowMaterial.dispose();
    }

    if (sparkPoints && sparkMaterial && sparkGeometry) {
      sparkGeometry.dispose();
      sparkMaterial.dispose();
    }

    if (debrisMesh && debrisMaterial) {
      debrisMesh.geometry.dispose();
      debrisMaterial.dispose();
    }
  }

  return {
    dispose,
    group,
    lastSource,
    lastTarget,
    rebuild,
    updateImpactParticles,
    update,
  };
}

export default function LightningStrikeGL({ config, onComplete, strike }) {
  const finishedRef = useRef(false);
  const lightRef = useRef(null);
  const strikeObject = useMemo(
    () => createStrikeObject(strike, config),
    [config, strike]
  );

  useEffect(() => {
    const source = strike.sourceResolver();
    const target = strike.targetResolver();
    strikeObject.rebuild(source, target);

    return () => {
      strikeObject.dispose();
    };
  }, [strike, strikeObject]);

  useFrame(({ clock }, delta) => {
    if (finishedRef.current) {
      return;
    }

    const elapsed = clock.elapsedTime - strike.startTime;
    const progress = elapsed / strike.totalDuration;

    if (progress >= 1) {
      finishedRef.current = true;
      onComplete(strike.id);
      return;
    }

    const target = strike.targetResolver();
    const normal = strike.normalResolver();

    if (strike.follow) {
      const source = strike.sourceResolver();

      if (
        source.distanceToSquared(strikeObject.lastSource) > 0.0004 ||
        target.distanceToSquared(strikeObject.lastTarget) > 0.0004
      ) {
        strikeObject.rebuild(source, target);
      }
    }

    strikeObject.update(elapsed, target, normal);
    strikeObject.updateImpactParticles(delta, elapsed);

    if (!lightRef.current) {
      return;
    }

    const flashEnvelope = getFlashEnvelope(progress);
    lightRef.current.position.copy(target).addScaledVector(normal, 0.16);
    lightRef.current.intensity = flashEnvelope * config.pointLight.intensity;
  });

  const showPointLight =
    config.pointLight.enabled && config.pointLight.intensity > 0;

  return (
    <>
      <primitive object={strikeObject.group} />
      {showPointLight ? (
        <pointLight
          ref={lightRef}
          castShadow={false}
          color={config.pointLight.color}
          decay={config.pointLight.decay}
          distance={
            config.pointLight.radius * config.pointLight.distanceMultiplier
          }
          intensity={0}
        />
      ) : null}
    </>
  );
}
