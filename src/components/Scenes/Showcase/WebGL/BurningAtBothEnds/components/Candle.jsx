import * as THREE from 'three';
import { MarchingCubes as ThreeMarchingCubes } from 'three-stdlib';

import React, { useMemo, useRef, useState } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import Flame from '../../../../../elements/flame/Flame';
import Smoke2D from '../../../../../elements/smoke/Smoke2D';
import VolumetricSmokeParticles from '../../../../../elements/smoke/VolumetricSmokeParticles';
import VolumetricFire from '../../../../../elements/volumetricFire/VolumetricFire';
import Candlewick from './Candlewick';

function createSeededRandom(startSeed) {
  let seed = startSeed;

  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function createWaxMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#fff6e8',
    roughness: 0.34,
    metalness: 0,
    transmission: 0.05,
    thickness: 0.45,
    ior: 1.45,
    attenuationDistance: 0.65,
    attenuationColor: new THREE.Color('#fff0d6'),
  });
}

const DRIP_ROOT_Y = 0.92;

function WaxMetaballCap({ radius, y, inverted = false, config }) {
  const waxSizing = useMemo(() => {
    const spreadBase = Math.max(0.7, config.waxMetaSpread);
    const minOuter = config.waxMetaMinOuter ?? 1;
    const maxOuter = config.waxMetaMaxOuter ?? 1.28;
    const subtract = Math.max(0.001, config.waxMetaSubtract ?? 10);
    const strengthScale = config.waxMetaStrength ?? 1;

    // Approximate max metaball influence radius in the scalar field. Keep a
    // margin so generated surfaces never touch the hard [0,1] cube boundary.
    const maxBaseStrength = 0.6;
    const influenceRadius =
      Math.sqrt((maxBaseStrength * strengthScale) / subtract) * 1.08;
    const safeRadialCeiling = THREE.MathUtils.clamp(
      1 - influenceRadius * 2,
      0.62,
      0.88
    );

    // If spread is too small to satisfy minimum outer diameter without hitting
    // the MC boundary, increase only the internal spread used by this cap.
    const spreadMinForCoverage =
      minOuter / Math.max(0.01, safeRadialCeiling - 0.02);
    const effectiveSpread = Math.max(spreadBase, spreadMinForCoverage);

    const minRingRadius = THREE.MathUtils.clamp(
      minOuter / effectiveSpread,
      0.52,
      safeRadialCeiling - 0.05
    );
    const maxRingRadius = THREE.MathUtils.clamp(
      maxOuter / effectiveSpread,
      minRingRadius + 0.03,
      safeRadialCeiling
    );

    return {
      effectiveSpread,
      minRingRadius,
      maxRingRadius,
    };
  }, [
    config.waxMetaSpread,
    config.waxMetaMinOuter,
    config.waxMetaMaxOuter,
    config.waxMetaStrength,
    config.waxMetaSubtract,
  ]);

  // Build blob ring positions in [0,1] local-grid space (0.5 = center).
  // Using [0,1] coords passed directly to addBall avoids the drei wrapper's
  // world-position mapping (0.5 + worldY * 0.5) which breaks for candle ends
  // at world Y > 1.
  const blobs = useMemo(() => {
    const rand = createSeededRandom(inverted ? 9001 : 1337);

    const nodes = [];
    const ringCount = Math.max(12, Math.floor(config.waxMetaBlobCount));
    const { minRingRadius, maxRingRadius } = waxSizing;
    const sizeVariation = config.waxMetaSizeVariation ?? 0.55;

    // Dense guard ring guarantees a minimum silhouette around the full circumference.
    const guardCount = Math.max(32, Math.floor(ringCount * 1.75));
    for (let i = 0; i < guardCount; i += 1) {
      const t = i / guardCount;
      const angle = t * Math.PI * 2 + (rand() - 0.5) * 0.08;
      const radial = minRingRadius + rand() * 0.035;
      nodes.push({
        id: `g-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.07,
        strength: (0.12 + rand() * 0.08) * (1 + (rand() - 0.5) * sizeVariation),
      });
    }

    const clusterCount = Math.max(3, Math.floor(ringCount * 0.3));
    for (let i = 0; i < clusterCount; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radial = minRingRadius + rand() * (maxRingRadius - minRingRadius);
      const heroScale = 1 + rand() * (0.8 + sizeVariation * 0.9);

      nodes.push({
        id: `hero-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.53 + (rand() - 0.5) * 0.16,
        strength: (0.34 + rand() * 0.2) * heroScale,
      });

      nodes.push({
        id: `hero-support-a-${i}`,
        x: 0.5 + Math.cos(angle + 0.18) * (radial - 0.03) * 0.5,
        z: 0.5 + Math.sin(angle + 0.18) * (radial - 0.03) * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.14,
        strength: (0.18 + rand() * 0.16) * (0.9 + sizeVariation * 0.35),
      });

      nodes.push({
        id: `hero-support-b-${i}`,
        x: 0.5 + Math.cos(angle - 0.16) * (radial + 0.025) * 0.5,
        z: 0.5 + Math.sin(angle - 0.16) * (radial + 0.025) * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.18,
        strength: (0.16 + rand() * 0.14) * (0.85 + sizeVariation * 0.3),
      });
    }

    for (let i = 0; i < ringCount; i += 1) {
      const t = i / ringCount;
      const angle = t * Math.PI * 2 + (rand() - 0.5) * 0.22;
      // Primary ring runs between min/max outer targets, with slight jitter.
      const radial = minRingRadius + rand() * (maxRingRadius - minRingRadius);
      const scaleBias = Math.max(
        0.45,
        1 + (rand() - 0.5) * (0.8 + sizeVariation * 1.1)
      );
      nodes.push({
        id: `r-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.2,
        strength: (0.22 + rand() * 0.34) * scaleBias,
      });
    }

    // Inner fill ring to cover the crater area.
    for (let i = 0; i < Math.floor(ringCount * 0.5); i += 1) {
      const angle = rand() * Math.PI * 2;
      const radial = 0.25 + rand() * 0.3;
      const scaleBias = Math.max(
        0.5,
        1 + (rand() - 0.5) * (0.65 + sizeVariation * 0.8)
      );
      nodes.push({
        id: `f-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.14,
        strength: (0.14 + rand() * 0.22) * scaleBias,
      });
    }

    // Secondary small blobs to break uniformity and fill visible gaps.
    for (let i = 0; i < Math.floor(ringCount * 0.7); i += 1) {
      const angle = rand() * Math.PI * 2;
      const radial = 0.4 + rand() * 0.28;
      const scaleBias = Math.max(
        0.45,
        1 + (rand() - 0.5) * (0.9 + sizeVariation)
      );
      nodes.push({
        id: `s-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.2,
        strength: (0.1 + rand() * 0.26) * scaleBias,
      });
    }

    return nodes;
  }, [
    config.waxMetaBlobCount,
    config.waxMetaSizeVariation,
    inverted,
    waxSizing,
  ]);

  const waxMaterial = useMemo(() => createWaxMaterial(), []);

  const mc = useMemo(
    () =>
      new ThreeMarchingCubes(
        Math.floor(config.waxMetaResolution),
        waxMaterial,
        false,
        false,
        Math.floor(config.waxMetaMaxPolyCount)
      ),
    [config.waxMetaResolution, config.waxMetaMaxPolyCount, waxMaterial]
  );

  useFrame(() => {
    mc.reset();
    blobs.forEach((blob) => {
      mc.addBall(
        blob.x,
        blob.y,
        blob.z,
        blob.strength * config.waxMetaStrength,
        config.waxMetaSubtract
      );
    });
    mc.update();
  });

  return (
    <primitive
      object={mc}
      position={[0, y, 0]}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
      scale={[
        radius * waxSizing.effectiveSpread,
        radius * config.waxMetaHeight,
        radius * waxSizing.effectiveSpread,
      ]}
    />
  );
}

function WaxSideDrips({ radius, y, inverted = false, config }) {
  const drips = useMemo(() => {
    const rand = createSeededRandom(inverted ? 7331 : 4242);
    const nodes = [];
    const dripCount = Math.max(0, Math.floor(config.waxDripCount ?? 3));
    const sizeVariation = config.waxMetaSizeVariation ?? 0.55;

    for (let i = 0; i < dripCount; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radial = 0.68 + rand() * 0.16;
      // Factor 0.375 (vs original 0.5) keeps blob centres ≤0.83 in [0,1]
      // space so typical-strength blobs don't clip the field boundary. The XZ
      // scale compensates (radius*1.6 vs 1.2) to preserve world positions.
      const rootX = 0.5 + Math.cos(angle) * radial * 0.375;
      const rootZ = 0.5 + Math.sin(angle) * radial * 0.375;
      const segmentCount = 3 + Math.floor(rand() * 4);
      const chainDepth = 0.45 + rand() * 0.3;
      const rootStrength = 0.22 + rand() * 0.12;

      nodes.push({
        id: `drip-root-${i}`,
        x: rootX,
        y: DRIP_ROOT_Y + (rand() - 0.5) * 0.015,
        z: rootZ,
        strength: rootStrength * (1.05 + rand() * 0.45),
      });

      nodes.push({
        id: `drip-shoulder-${i}`,
        x: 0.5 + Math.cos(angle + 0.12) * (radial + 0.02) * 0.375,
        y: 0.84 + (rand() - 0.5) * 0.03,
        z: 0.5 + Math.sin(angle + 0.12) * (radial + 0.02) * 0.375,
        strength: rootStrength * (0.8 + rand() * 0.25),
      });

      for (let segment = 0; segment < segmentCount; segment += 1) {
        const t = (segment + 1) / segmentCount;
        const wobble = (rand() - 0.5) * 0.05;
        const lateral = 1 + (rand() - 0.5) * 0.12;
        const neckStrength =
          rootStrength *
          Math.max(0.45, 0.95 - t * (0.42 + sizeVariation * 0.22));

        nodes.push({
          id: `drip-chain-${i}-${segment}`,
          x: 0.5 + Math.cos(angle + wobble) * radial * lateral * 0.375,
          y: 0.84 - t * chainDepth,
          z: 0.5 + Math.sin(angle + wobble) * radial * lateral * 0.375,
          strength: neckStrength,
        });
      }

      nodes.push({
        id: `drip-bulb-${i}`,
        x: 0.5 + Math.cos(angle) * (radial - 0.015) * 0.375,
        y: 0.14 + rand() * 0.14,
        z: 0.5 + Math.sin(angle) * (radial - 0.015) * 0.375,
        strength:
          rootStrength *
          (0.95 + rand() * 0.6 + sizeVariation * (0.35 + rand() * 0.25)),
      });
    }

    return nodes;
  }, [config.waxDripCount, config.waxMetaSizeVariation, inverted]);

  const waxMaterial = useMemo(() => createWaxMaterial(), []);

  const mc = useMemo(
    () =>
      new ThreeMarchingCubes(
        Math.floor(config.waxMetaResolution),
        waxMaterial,
        false,
        false,
        Math.floor(config.waxMetaMaxPolyCount)
      ),
    [config.waxMetaResolution, config.waxMetaMaxPolyCount, waxMaterial]
  );

  useFrame(() => {
    mc.reset();
    drips.forEach((blob) => {
      mc.addBall(
        blob.x,
        blob.y,
        blob.z,
        blob.strength * config.waxMetaStrength,
        config.waxMetaSubtract
      );
    });
    mc.update();
  });

  return (
    <primitive
      object={mc}
      position={[0, y, 0]}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
      scale={[radius * 1.6, config.waxDripLength, radius * 1.6]}
    />
  );
}

export default function Candle({ config, position = [0, 0, 0], firePreset }) {
  const { height, radius, tilt } = config;
  const presetSplines = firePreset?.splines ?? [];
  const topFireSpline = useMemo(
    () => presetSplines.find((spline) => spline.name === 'Top Wick Fire'),
    [presetSplines]
  );
  const bottomFireSpline = useMemo(
    () => presetSplines.find((spline) => spline.name === 'Bottom Wick Fire'),
    [presetSplines]
  );
  const topSmokeSpline = useMemo(
    () => presetSplines.find((spline) => spline.name === 'Top Wick Smoke'),
    [presetSplines]
  );
  const bottomSmokeSpline = useMemo(
    () => presetSplines.find((spline) => spline.name === 'Bottom Wick Smoke'),
    [presetSplines]
  );
  const lit = config.candleLit !== false;
  const wickHot = config.wickHot !== false;
  const useVolumetric = config.flameType === 'Volumetric';
  const useVolumetricSmoke = config.smokeType === 'Volumetric';
  const volShowSpline = config.volShowSpline ?? false;
  const topFireOrigin = topFireSpline?.points?.[0]?.position?.toArray() ?? [
    0.06,
    height / 2 + 0.21,
    0.06,
  ];
  const bottomFireOrigin =
    bottomFireSpline?.points?.[0]?.position?.toArray() ?? [
      0.06,
      -(height / 2 + 0.21),
      0.06,
    ];
  const topSmokeOrigin = topSmokeSpline?.points?.[0]?.position?.toArray() ?? [
    0.18,
    height / 2 + 0.34,
    0.088,
  ];
  const bottomSmokeOrigin =
    bottomSmokeSpline?.points?.[0]?.position?.toArray() ?? [
      0.18,
      -(height / 2 + 0.34),
      0.088,
    ];
  const vfProps = {
    width: config.vfWidth ?? topFireSpline?.fireWidth ?? 0.8,
    height: config.vfHeight ?? topFireSpline?.fireHeight ?? 2.0,
    depth: config.vfDepth ?? topFireSpline?.fireDepth ?? 0.725,
    sliceSpacing:
      config.vfSliceSpacing ?? topFireSpline?.fireSliceSpacing ?? 0.05,
    bendX: config.vfBendX ?? 0,
    bendZ: config.vfBendZ ?? 0,
    animated: config.vfAnimated ?? topFireSpline?.fireAnimated ?? true,
    animSpeed: config.vfAnimSpeed ?? topFireSpline?.fireAnimSpeed ?? 0.5,
    showSpline: config.vfShowSpline ?? false,
    magnitude: config.vfMagnitude ?? topFireSpline?.fireMagnitude ?? 0.5,
    lacunarity: config.vfLacunarity ?? topFireSpline?.fireLacunarity ?? 4.0,
    gain: config.vfGain ?? topFireSpline?.fireGain ?? 0,
    tintColor: config.vfTintColor ?? topFireSpline?.fireTintColor ?? '#ffffff',
    saturation: config.vfSaturation ?? topFireSpline?.fireSaturation ?? 1.0,
    brightness: config.vfBrightness ?? topFireSpline?.fireBrightness ?? 1.5,
  };
  const flameMotion = {
    baseSpeed: config.flameBaseSpeed,
    minSpeed: config.flameMinSpeed,
    slowFreq: config.flameSlowFreq,
    slowAmp: config.flameSlowAmp,
    fastFreq: config.flameFastFreq,
    fastAmp: config.flameFastAmp,
    microFreq: config.flameMicroFreq,
    microAmp: config.flameMicroAmp,
    swayX: config.flameSwayX,
    swayZ: config.flameSwayZ,
    pulseFreq: config.flamePulseFreq,
    pulseAmp: config.flamePulseAmp,
    scaleX: config.flameScaleX ?? 1,
    scaleY: config.flameScaleY ?? 1,
  };
  const waxMeta = {
    enabled: config.waxUseMetaballs ?? true,
    waxMetaResolution: config.waxMetaResolution ?? 30,
    waxMetaMaxPolyCount: config.waxMetaMaxPolyCount ?? 24000,
    waxMetaBlobCount: config.waxMetaBlobCount ?? 22,
    waxMetaStrength: config.waxMetaStrength ?? 1,
    waxMetaSubtract: config.waxMetaSubtract ?? 10,
    waxMetaSpread: config.waxMetaSpread ?? 1.3,
    waxMetaHeight: config.waxMetaHeight ?? 0.72,
    waxMetaMinOuter: config.waxMetaMinOuter ?? 1,
    waxMetaMaxOuter: config.waxMetaMaxOuter ?? 1.28,
    waxMetaSizeVariation: config.waxMetaSizeVariation ?? 0.55,
    waxDripCount: config.waxDripCount ?? 3,
    waxDripLength: config.waxDripLength ?? 1.2,
  };
  const smokeConfig = {
    timeFrequency: config.smokeTimeFrequency ?? 0.45,
    uvFrequencyX: config.smokeUvFrequencyX ?? 4,
    uvFrequencyY: config.smokeUvFrequencyY ?? 5,
    riseSpeed: config.smokeRiseSpeed ?? 0.35,
    spreadStrength: config.smokeSpreadStrength ?? 0.15,
    opacity: config.smokeOpacity ?? 0.6,
    color: config.smokeColor ?? '#b8b8b8',
    width: config.smokeWidth ?? 0.5,
    height: config.smokeHeight ?? 3.0,
  };
  const volSmokeConfig = useMemo(
    () => ({
      volParticleCount:
        config.volParticleCount ?? topSmokeSpline?.volParticleCount ?? 8000,
      volColor: config.smokeColor ?? topSmokeSpline?.volColor ?? '#b8b8b8',
      volOpacity: config.volOpacity ?? topSmokeSpline?.volOpacity ?? 0.01,
      volSize: config.volSize ?? topSmokeSpline?.volSize ?? 1,
      volBlendMode:
        config.volBlendMode ?? topSmokeSpline?.volBlendMode ?? 'Normal',
      volSpread: config.volSpread ?? topSmokeSpline?.volSpread ?? 0.35,
      volSpringK: config.volSpringK ?? topSmokeSpline?.volSpringK ?? 1.2,
      volDamping: config.volDamping ?? topSmokeSpline?.volDamping ?? 0.06,
      volTurbulence: config.volTurbulence ?? topSmokeSpline?.volTurbulence ?? 2,
      volTurbulenceSpeed:
        config.volTurbulenceSpeed ?? topSmokeSpline?.volTurbulenceSpeed ?? 0.25,
      volMaxDrift: config.volMaxDrift ?? topSmokeSpline?.volMaxDrift ?? 2.4,
      flowSpeed: config.volFlowSpeed ?? topSmokeSpline?.flowSpeed ?? 0.04,
      fadeRate: config.volFadeRate ?? topSmokeSpline?.fadeRate ?? 4,
      closed: false,
      tension: config.volTension ?? topSmokeSpline?.tension ?? 0.3,
      volNoiseScale: config.volNoiseScale ?? 80,
    }),
    [
      topSmokeSpline,
      config.smokeColor,
      config.volParticleCount,
      config.volOpacity,
      config.volSize,
      config.volBlendMode,
      config.volSpread,
      config.volSpringK,
      config.volDamping,
      config.volTurbulence,
      config.volTurbulenceSpeed,
      config.volMaxDrift,
      config.volFlowSpeed,
      config.volFadeRate,
      config.volTension,
      config.volNoiseScale,
    ]
  );
  const smokeHeight = config.smokeHeight ?? 3.0;
  const topSmokePoints = useMemo(() => {
    if (topSmokeSpline?.points) {
      const origin = topSmokeSpline.points[0].position;
      return topSmokeSpline.points.map((point) =>
        point.position.clone().sub(origin)
      );
    }
    return [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, smokeHeight * 0.25, 0),
      new THREE.Vector3(0, smokeHeight * 0.5, 0),
      new THREE.Vector3(0, smokeHeight * 0.75, 0),
      new THREE.Vector3(0, smokeHeight, 0),
    ];
  }, [smokeHeight, topSmokeSpline]);
  const bottomSmokePoints = useMemo(() => {
    if (bottomSmokeSpline?.points) {
      const origin = bottomSmokeSpline.points[0].position;
      return bottomSmokeSpline.points.map((point) =>
        point.position.clone().sub(origin)
      );
    }
    return [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -smokeHeight * 0.25, 0),
      new THREE.Vector3(0, -smokeHeight * 0.5, 0),
      new THREE.Vector3(0, -smokeHeight * 0.75, 0),
      new THREE.Vector3(0, -smokeHeight, 0),
    ];
  }, [bottomSmokeSpline, smokeHeight]);
  const topLightRef = useRef();
  const bottomLightRef = useRef();

  // Transition refs: 0 = fully hidden, 1 = fully visible
  const flameTRef = useRef(lit ? 1 : 0);
  const smokeTRef = useRef(lit ? 0 : 1);
  const topFlameGroupRef = useRef();
  const bottomFlameGroupRef = useRef();
  // Smoke is conditionally mounted (not just hidden) so the particle system
  // resets fresh and particles flow naturally from the spline origin.
  const [smokeActive, setSmokeActive] = useState(!lit);

  const candleGeo = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, height, 64),
    [radius, height]
  );
  const craterGeo = useMemo(() => new THREE.SphereGeometry(1, 84, 56), []);
  const craterCuts = useMemo(
    () => [
      {
        id: 'core',
        offset: [0, 0, 0],
        scale: [0.56, 0.32, 0.56],
      },
      {
        id: 'east',
        offset: [0.11, 0.015, 0.02],
        scale: [0.2, 0.14, 0.17],
      },
      {
        id: 'southwest',
        offset: [-0.08, -0.005, -0.09],
        scale: [0.16, 0.1, 0.2],
      },
      {
        id: 'south',
        offset: [0.035, 0.01, -0.11],
        scale: [0.13, 0.09, 0.16],
      },
      {
        id: 'northwest',
        offset: [-0.12, 0, 0.055],
        scale: [0.12, 0.08, 0.13],
      },
    ],
    []
  );
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // --- Lit/unlit transition (sequential: one fades out, then the other fades in) ---
    // Linear speed (units/sec) with smoothstep easing for a steady, natural feel.
    const SPEED = 1.8;
    const step = SPEED * delta;
    let ft = flameTRef.current;
    let st = smokeTRef.current;

    if (lit) {
      // Lighting: smoke unmounts instantly, flame grows up from ember
      if (st > 0) {
        st = 0;
        setSmokeActive(false);
      }
      ft = Math.min(1, ft + step);
    } else if (ft > 0) {
      // Extinguishing: flame shrinks to nothing first
      ft = Math.max(0, ft - step);
    } else {
      // Once flame is gone, mount smoke system (particles flow from origin)
      ft = 0;
      if (st === 0 && !smokeActive) setSmokeActive(true);
      st = 1;
    }

    flameTRef.current = ft;
    smokeTRef.current = st;

    // Smoothstep easing: 3t² - 2t³ (accelerate then decelerate)
    const flameT = ft * ft * (3 - 2 * ft);

    // Apply transition scale to flame groups
    [topFlameGroupRef, bottomFlameGroupRef].forEach((r) => {
      const g = r.current;
      if (g) {
        g.visible = flameT > 0.001;
        g.scale.setScalar(flameT);
      }
    });

    // Flickering point lights (modulated by flame transition)
    if (topLightRef.current) {
      topLightRef.current.position.x = 0.06 + Math.sin(t * Math.PI) * 0.05;
      topLightRef.current.position.z =
        0.06 + Math.cos(t * Math.PI * 0.75) * 0.05;
      topLightRef.current.intensity =
        (2 + Math.sin(t * Math.PI * 2) * Math.cos(t * Math.PI * 1.5) * 0.25) *
        flameT;
      topLightRef.current.visible = flameT > 0.001;
    }
    if (bottomLightRef.current) {
      bottomLightRef.current.position.x =
        0.06 + Math.sin(t * Math.PI * 1.1) * 0.05;
      bottomLightRef.current.position.z =
        0.06 + Math.cos(t * Math.PI * 0.85) * 0.05;
      bottomLightRef.current.intensity =
        (2 + Math.cos(t * Math.PI * 2.2) * Math.sin(t * Math.PI * 1.3) * 0.25) *
        flameT;
      bottomLightRef.current.visible = flameT > 0.001;
    }
  });

  const halfH = height / 2;

  return (
    <group
      position={position}
      rotation={[0, 0, THREE.MathUtils.degToRad(tilt)]}
    >
      {/* Candle body */}
      <mesh>
        <Geometry computeVertexNormals>
          <Base geometry={candleGeo} />

          {craterCuts.map((cut) => (
            <Subtraction
              key={`top-crater-${cut.id}`}
              geometry={craterGeo}
              position={[
                cut.offset[0] * radius,
                halfH - radius * 0.24 + cut.offset[1] * radius,
                cut.offset[2] * radius,
              ]}
              scale={[
                radius * cut.scale[0],
                radius * cut.scale[1],
                radius * cut.scale[2],
              ]}
            />
          ))}
          {craterCuts.map((cut) => (
            <Subtraction
              key={`bottom-crater-${cut.id}`}
              geometry={craterGeo}
              position={[
                cut.offset[0] * radius,
                -halfH + radius * 0.24 - cut.offset[1] * radius,
                cut.offset[2] * radius,
              ]}
              scale={[
                radius * cut.scale[0],
                radius * cut.scale[1],
                radius * cut.scale[2],
              ]}
            />
          ))}
        </Geometry>
        <meshPhysicalMaterial
          color="#f8f6f1"
          roughness={0.46}
          metalness={0}
          transmission={0.08}
          thickness={0.7}
          ior={1.45}
          attenuationDistance={0.8}
          attenuationColor="#fff1d8"
          clearcoat={0.08}
          clearcoatRoughness={0.55}
        />
      </mesh>

      {waxMeta.enabled && (
        <>
          <WaxMetaballCap
            radius={radius}
            y={halfH + radius * 0.02}
            config={waxMeta}
          />
          <WaxMetaballCap
            radius={radius}
            y={-halfH - radius * 0.02}
            config={waxMeta}
            inverted
          />
          {waxMeta.waxDripCount > 0 && (
            <>
              <WaxSideDrips
                radius={radius}
                y={halfH - waxMeta.waxDripLength * DRIP_ROOT_Y}
                config={waxMeta}
              />
              <WaxSideDrips
                radius={radius}
                y={-halfH + waxMeta.waxDripLength * DRIP_ROOT_Y}
                config={waxMeta}
                inverted
              />
            </>
          )}
        </>
      )}

      {/* Top flame assembly */}
      <Candlewick position={[0, halfH, 0]} hot={wickHot} />
      <group ref={topFlameGroupRef} position={topFireOrigin}>
        {useVolumetric ? (
          <VolumetricFire {...vfProps} />
        ) : (
          <Flame
            motion={flameMotion}
            phaseOffset={config.topFlamePhaseOffset ?? 0}
          />
        )}
      </group>
      {smokeActive && (
        <group position={topSmokeOrigin}>
          {useVolumetricSmoke ? (
            <>
              <VolumetricSmokeParticles
                points={topSmokePoints}
                config={volSmokeConfig}
              />
              {volShowSpline && (
                <Line points={topSmokePoints} color="cyan" lineWidth={2} />
              )}
            </>
          ) : (
            <Smoke2D smoke={smokeConfig} />
          )}
        </group>
      )}
      <pointLight
        ref={topLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0.06, halfH + 0.23, 0.06]}
      />

      {/* Bottom flame assembly (inverted) */}
      <Candlewick position={[0, -halfH, 0]} inverted hot={wickHot} />
      <group ref={bottomFlameGroupRef} position={bottomFireOrigin}>
        {useVolumetric ? (
          <VolumetricFire inverted {...vfProps} />
        ) : (
          <Flame
            inverted
            motion={flameMotion}
            phaseOffset={config.bottomFlamePhaseOffset ?? 0}
          />
        )}
      </group>
      {smokeActive && (
        <group position={bottomSmokeOrigin}>
          {useVolumetricSmoke ? (
            <>
              <VolumetricSmokeParticles
                points={bottomSmokePoints}
                config={volSmokeConfig}
              />
              {volShowSpline && (
                <Line points={bottomSmokePoints} color="cyan" lineWidth={2} />
              )}
            </>
          ) : (
            <Smoke2D inverted smoke={smokeConfig} />
          )}
        </group>
      )}
      <pointLight
        ref={bottomLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0.06, -halfH - 0.23, 0.06]}
      />
    </group>
  );
}
