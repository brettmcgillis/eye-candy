import * as THREE from 'three';
import {
  abs,
  attribute,
  cameraPosition,
  clamp,
  cross,
  float,
  length,
  mix,
  positionLocal,
  smoothstep,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  buildLightningBoltGeometry,
  getBoltLengthScale,
  getImpactTransform,
} from './lightningGeometry';
import {
  buildImpactCrackPaths,
  buildLightningCrackGeometry,
  createDebrisBurst,
  createSparkBurst,
  initializeDebrisMesh,
  updateDebrisBurst,
  updateSparkBurst,
} from './lightningStrikeEffects';
import { buildLightningStrands, getFlashEnvelope } from './lightningUtils';

function createBoltMaterial(config, strike) {
  const uniforms = {
    fadeDur: uniform(
      Math.max(strike.totalDuration - strike.strikeDuration, 0.001)
    ),
    spread: uniform(config.boltSpread),
    strikeDur: uniform(strike.strikeDuration),
    time: uniform(0),
  };

  const material = new THREE_WEBGPU.MeshBasicNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const ratio = attribute('aRatio', 'float');
  const direction = attribute('aDirection', 'vec3').normalize();
  const side = attribute('aSide', 'float');
  const strikeOffset = attribute('aStrikeOffset', 'float');
  const thickness = attribute('aThickness', 'float');
  const alphaAttr = attribute('aAlpha', 'float');
  const colorAttr = attribute('aColor', 'vec3');
  const fadeT = clamp(
    uniforms.time
      .sub(uniforms.strikeDur)
      .div(uniforms.fadeDur.max(float(0.0001))),
    0.0,
    1.0
  );
  const spreadFactor = fadeT.mul(fadeT).mul(uniforms.spread);
  const basePosition = vec3(
    positionLocal.x.add(positionLocal.x.mul(spreadFactor)),
    positionLocal.y,
    positionLocal.z.add(positionLocal.z.mul(spreadFactor))
  );
  const toCamera = cameraPosition.sub(basePosition).normalize();
  const tangent = cross(direction, toCamera).normalize();
  const strikeT = clamp(
    uniforms.time.div(uniforms.strikeDur.max(float(0.0001))),
    0.0,
    1.0
  );
  const revealWindow = float(1.0).sub(strikeOffset).max(float(0.001));
  const localT = clamp(strikeT.sub(strikeOffset).div(revealWindow), 0.0, 1.0);
  const reveal = step(ratio, localT);
  const alpha = reveal.mul(float(1.0).sub(fadeT.mul(fadeT))).mul(alphaAttr);

  material.positionNode = basePosition.add(tangent.mul(side).mul(thickness));
  material.colorNode = colorAttr.toVec4(alpha);

  return { material, uniforms };
}

function createCrackMaterial(config, strike) {
  const uniforms = {
    coreColor: uniform(config.coreColor.clone()),
    delay: uniform(strike.strikeDuration),
    edgeColor: uniform(config.edgeColor.clone()),
    fadeDuration: uniform(Math.max(config.fadeDuration, 0.001)),
    midColor: uniform(config.midColor.clone()),
    revealDuration: uniform(Math.max(config.revealDuration, 0.001)),
    time: uniform(0),
  };
  const ratio = attribute('aRatio', 'float');
  const side = attribute('aSide', 'float');
  const alphaAttr = attribute('aAlpha', 'float');
  const fadeMult = attribute('aFadeMult', 'float');
  const localTime = uniforms.time.sub(uniforms.delay).max(float(0.0));
  const revealT = clamp(
    localTime.div(uniforms.revealDuration.max(float(0.0001))),
    0.0,
    1.0
  );
  const fadeT = clamp(
    localTime
      .sub(uniforms.revealDuration)
      .div(uniforms.fadeDuration.mul(fadeMult).max(float(0.0001))),
    0.0,
    1.0
  );
  const edge = float(1.0).sub(abs(side));
  const core = smoothstep(0.0, 0.25, edge);
  const glow = smoothstep(0.0, 0.85, edge);
  const colorNode = mix(
    uniforms.edgeColor,
    mix(uniforms.midColor, uniforms.coreColor, core),
    glow
  );
  const alpha = step(ratio, revealT)
    .mul(glow)
    .mul(float(1.0).sub(fadeT.mul(fadeT)))
    .mul(alphaAttr);

  const material = new THREE_WEBGPU.MeshBasicNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.colorNode = colorNode.toVec4(alpha);

  return { material, uniforms };
}

function createImpactMaterial(config) {
  const uniforms = {
    color: uniform(config.groundFlash.color.clone()),
    duration: uniform(config.groundFlash.duration),
    intensity: uniform(config.groundFlash.intensity),
    time: uniform(-1),
  };
  const radial = float(1.0)
    .sub(length(uv().sub(vec2(0.5, 0.5))).mul(2.0))
    .max(float(0.0));
  const t = clamp(
    uniforms.time.div(uniforms.duration.max(float(0.0001))),
    0.0,
    1.0
  );
  const alpha = radial
    .mul(radial)
    .mul(float(1.0).sub(t))
    .mul(float(1.0).sub(t))
    .mul(uniforms.intensity);

  const material = new THREE_WEBGPU.MeshBasicNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.colorNode = uniforms.color.toVec4(alpha);

  return { material, uniforms };
}

function createShockwaveMaterial(config, strike) {
  const uniforms = {
    alphaMult: uniform(config.shockwave.alphaMultiplier),
    colorA: uniform(config.shockwave.colorA.clone()),
    colorB: uniform(config.shockwave.colorB.clone()),
    delay: uniform(strike.strikeDuration),
    duration: uniform(config.shockwave.duration),
    time: uniform(0),
  };
  const centeredUv = uv().sub(vec2(0.5, 0.5));
  const t = clamp(
    uniforms.time.sub(uniforms.delay).div(uniforms.duration.max(float(0.0001))),
    0.0,
    1.0
  );
  const radius = length(centeredUv).mul(2.0);
  const ring = abs(radius.sub(t));
  const oneMinusT = float(1.0).sub(t);
  const alpha = smoothstep(0.12, 0.0, ring)
    .mul(oneMinusT)
    .mul(oneMinusT)
    .mul(uniforms.alphaMult);
  const colorNode = mix(uniforms.colorA, uniforms.colorB, t);

  const material = new THREE_WEBGPU.MeshBasicNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.colorNode = colorNode.toVec4(alpha);

  return { material, uniforms };
}

function createStrikeObject(strike, config) {
  const group = new THREE.Group();
  group.name = 'LightningStrikeGPU';
  group.userData.lightningIgnore = true;
  const impactRoot = new THREE.Group();
  impactRoot.userData.lightningIgnore = true;
  group.add(impactRoot);

  const lastSource = new THREE.Vector3();
  const lastTarget = new THREE.Vector3();
  const showImpactEffects = strike.surfaceType !== 'air';
  const bolt = createBoltMaterial(config, strike);
  const boltMesh = new THREE.Mesh(new THREE.BufferGeometry(), bolt.material);
  boltMesh.renderOrder = 26;
  boltMesh.userData.lightningIgnore = true;
  group.add(boltMesh);

  const impact =
    showImpactEffects && config.groundFlash.enabled
      ? createImpactMaterial(config)
      : null;
  const impactMesh = impact
    ? new THREE.Mesh(
        new THREE.PlaneGeometry(
          config.groundFlash.size,
          config.groundFlash.size
        ),
        impact.material
      )
    : null;

  if (impactMesh) {
    impactMesh.renderOrder = 23;
    impactMesh.userData.lightningIgnore = true;
    impactRoot.add(impactMesh);
  }

  const shockwave =
    showImpactEffects && config.shockwave.enabled
      ? createShockwaveMaterial(config, strike)
      : null;
  const shockwaveMesh = shockwave
    ? new THREE.Mesh(
        new THREE.PlaneGeometry(config.shockwave.size, config.shockwave.size),
        shockwave.material
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
  const crackGlow = crackGlowGeometry
    ? createCrackMaterial(config.crack, strike)
    : null;
  const crackGlowMesh =
    crackGlowGeometry && crackGlow
      ? new THREE.Mesh(crackGlowGeometry, crackGlow.material)
      : null;

  if (crackGlowMesh) {
    crackGlowMesh.renderOrder = 24;
    crackGlowMesh.userData.lightningIgnore = true;
    impactRoot.add(crackGlowMesh);
  }

  const sparkState =
    showImpactEffects && config.sparks.enabled
      ? createSparkBurst(strike.seed, config.sparks)
      : null;
  const sparkMaterial = sparkState
    ? new THREE.PointsMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        size: config.sparks.size,
        sizeAttenuation: true,
        toneMapped: false,
        transparent: true,
        vertexColors: true,
      })
    : null;
  const sparkPoints =
    sparkState && sparkMaterial
      ? new THREE.Points(sparkState.geometry, sparkMaterial)
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

    bolt.uniforms.time.value = elapsed;

    if (impact) {
      impact.uniforms.time.value = impactTime;
    }

    if (shockwave) {
      shockwave.uniforms.time.value = elapsed;
    }

    if (crackGlow) {
      crackGlow.uniforms.time.value = elapsed;
    }

    if (showImpactEffects) {
      impactRoot.position.copy(position);
      impactRoot.quaternion.copy(quaternion);
    }
  }

  function updateImpactParticles(delta) {
    if (sparkState) {
      updateSparkBurst(sparkState, delta, config.sparks);
    }

    if (debrisState && debrisMesh) {
      updateDebrisBurst(
        debrisState,
        debrisMesh,
        delta,
        delta >= 0 && bolt.uniforms.time.value >= strike.strikeDuration
      );
    }
  }

  function dispose() {
    boltMesh.geometry.dispose();
    bolt.material.dispose();

    if (impactMesh && impact) {
      impactMesh.geometry.dispose();
      impact.material.dispose();
    }

    if (shockwaveMesh && shockwave) {
      shockwaveMesh.geometry.dispose();
      shockwave.material.dispose();
    }

    if (crackGlowMesh && crackGlow) {
      crackGlowMesh.geometry.dispose();
      crackGlow.material.dispose();
    }

    if (sparkPoints && sparkMaterial && sparkState) {
      sparkState.geometry.dispose();
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

export default function LightningStrikeGPU({ config, onComplete, strike }) {
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
    strikeObject.updateImpactParticles(delta);

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
