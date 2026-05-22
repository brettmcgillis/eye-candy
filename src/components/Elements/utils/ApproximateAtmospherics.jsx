import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const hslValues = { h: 0, s: 0, l: 0 };

function createSoftParticleTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createRadialGradient(
    size * 0.5,
    size * 0.5,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.48
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.78)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  context.clearRect(0, 0, size, size);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useSoftParticleTexture() {
  const texture = useMemo(() => createSoftParticleTexture(), []);

  useEffect(
    () => () => {
      texture.dispose();
    },
    [texture]
  );

  return texture;
}

function tuneColor(baseColor, saturation = 1, brightness = 1) {
  const color = new THREE.Color(baseColor);
  color.getHSL(hslValues);
  color.setHSL(
    hslValues.h,
    THREE.MathUtils.clamp(hslValues.s * saturation, 0, 1),
    hslValues.l
  );
  color.multiplyScalar(Math.max(0.05, brightness));
  return color;
}

function positionFromControlPoint(point) {
  if (point?.pos?.isVector3) return point.pos.clone();
  if (point?.position?.isVector3) return point.position.clone();
  if (Array.isArray(point?.pos)) return new THREE.Vector3(...point.pos);
  if (Array.isArray(point?.position))
    return new THREE.Vector3(...point.position);
  return new THREE.Vector3();
}

function scaleFromControlPoint(point) {
  if (point?.scale?.isVector3) return point.scale;
  if (Array.isArray(point?.scale)) {
    return new THREE.Vector3(...point.scale);
  }
  return null;
}

function makeDefaultVolumeControlPoints({
  width,
  height,
  depth,
  bendX,
  bendZ,
}) {
  const baseRadius = Math.max(0.12, ((width ?? 0.6) + (depth ?? 0.6)) * 0.35);

  return [
    {
      position: new THREE.Vector3(0, 0, 0),
      radius: baseRadius,
    },
    {
      position: new THREE.Vector3(bendX * 0.18, height * 0.3, bendZ * 0.12),
      radius: baseRadius * 0.86,
    },
    {
      position: new THREE.Vector3(bendX * 0.62, height * 0.68, bendZ * 0.42),
      radius: baseRadius * 0.62,
    },
    {
      position: new THREE.Vector3(bendX, height, bendZ),
      radius: baseRadius * 0.28,
    },
  ];
}

function normalizeVolumeControlPoints(controlPoints, volumeConfig) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 2) {
    return makeDefaultVolumeControlPoints(volumeConfig);
  }

  const fallbackRadius =
    Math.max(
      0.12,
      ((volumeConfig.width ?? 0.6) + (volumeConfig.depth ?? 0.6)) * 0.35
    ) || 0.2;

  return controlPoints.map((point, index) => {
    const scale = scaleFromControlPoint(point);
    const widthScale = scale?.x ?? 1;
    const depthScale = scale?.z ?? widthScale;
    const radius = Math.max(
      0.05,
      index === controlPoints.length - 1
        ? fallbackRadius * 0.3 * widthScale
        : fallbackRadius * ((widthScale + depthScale) * 0.5)
    );

    return {
      position: positionFromControlPoint(point),
      radius,
    };
  });
}

function sampleRadius(controlPoints, t) {
  if (controlPoints.length === 1) return controlPoints[0].radius;

  const span = controlPoints.length - 1;
  const scaled = THREE.MathUtils.clamp(t, 0, 1) * span;
  const index = Math.min(Math.floor(scaled), span - 1);
  const weight = scaled - index;
  const start = controlPoints[index].radius;
  const end = controlPoints[index + 1].radius;
  return THREE.MathUtils.lerp(start, end, weight);
}

function buildVolumeSamples(controlPoints, sampleCount) {
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map((point) => point.position),
    false,
    'centripetal'
  );

  const points = curve.getPoints(sampleCount - 1);

  return points.map((point, index) => {
    const t = sampleCount === 1 ? 0 : index / (sampleCount - 1);
    return {
      position: point,
      radius: sampleRadius(controlPoints, t),
      t,
    };
  });
}

function computeBounds(points) {
  const bounds = new THREE.Box3();
  points.forEach((point) => bounds.expandByPoint(point.position));
  return bounds;
}

function sampleKey(sample, prefix = 'sample') {
  return `${prefix}-${sample.t.toFixed(4)}`;
}

function SoftBillboard({ position, scale, color, opacity, texture, blending }) {
  return (
    <Billboard
      position={position}
      follow
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh scale={scale}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
          blending={blending}
        />
      </mesh>
    </Billboard>
  );
}

export function ApproximateVolumeFire({
  position = [0, 0, 0],
  inverted = false,
  width = 0.6,
  height = 1.5,
  depth = 0.6,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  showSpline = false,
  showVolume = false,
  tintColor = '#ffffff',
  saturation = 1,
  brightness = 1.5,
  controlPoints = null,
  coreColor,
  borderColor,
  smokeColor,
  emberDensity = 0,
  emberSize = 0.25,
  emberColor = '#ff4400',
}) {
  const texture = useSoftParticleTexture();
  const groupRef = useRef();

  const normalizedControlPoints = useMemo(
    () =>
      normalizeVolumeControlPoints(controlPoints, {
        width,
        height,
        depth,
        bendX,
        bendZ,
      }),
    [controlPoints, width, height, depth, bendX, bendZ]
  );

  const volumeSamples = useMemo(
    () =>
      buildVolumeSamples(
        normalizedControlPoints,
        Math.max(10, normalizedControlPoints.length * 7)
      ),
    [normalizedControlPoints]
  );

  const splinePoints = useMemo(
    () => volumeSamples.map((sample) => sample.position.clone()),
    [volumeSamples]
  );

  const splineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(splinePoints);
    return geometry;
  }, [splinePoints]);

  const volumeBounds = useMemo(
    () => computeBounds(normalizedControlPoints),
    [normalizedControlPoints]
  );

  const edgeGeometry = useMemo(() => {
    const size = volumeBounds.getSize(new THREE.Vector3());
    const box = new THREE.BoxGeometry(
      Math.max(size.x + width, width * 1.2),
      Math.max(size.y, height),
      Math.max(size.z + depth, depth * 1.2)
    );
    return new THREE.EdgesGeometry(box);
  }, [volumeBounds, width, height, depth]);

  const edgePosition = useMemo(
    () => volumeBounds.getCenter(new THREE.Vector3()),
    [volumeBounds]
  );

  const innerColor = useMemo(
    () =>
      tuneColor(coreColor ?? tintColor ?? '#ffe7a3', saturation, brightness),
    [coreColor, tintColor, saturation, brightness]
  );

  const outerColor = useMemo(
    () =>
      tuneColor(
        borderColor ?? tintColor ?? '#ff6b1a',
        saturation * 1.1,
        brightness * 0.8
      ),
    [borderColor, tintColor, saturation, brightness]
  );

  const emberTint = useMemo(
    () => tuneColor(emberColor, saturation * 1.2, brightness),
    [emberColor, saturation, brightness]
  );

  const smokeTint = useMemo(
    () =>
      tuneColor(smokeColor ?? '#330000', saturation * 0.6, brightness * 0.45),
    [smokeColor, saturation, brightness]
  );

  useEffect(
    () => () => {
      splineGeometry.dispose();
      edgeGeometry.dispose();
    },
    [splineGeometry, edgeGeometry]
  );

  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;

    const t = clock.getElapsedTime() * Math.max(0.05, animSpeed);
    groupRef.current.rotation.x =
      (inverted ? Math.PI : 0) + Math.sin(t * 0.7) * 0.04;
    groupRef.current.rotation.z = Math.cos(t * 0.5 + 0.4) * 0.05;
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.03;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      {volumeSamples.map((sample) => {
        const flare = 1 - sample.t * 0.52;
        const radius = Math.max(0.05, sample.radius * flare);
        const blend = (1 - sample.t) ** 0.7;
        const sampleOuterColor = new THREE.Color().lerpColors(
          outerColor,
          innerColor,
          blend
        );
        const sampleInnerColor = new THREE.Color().lerpColors(
          smokeTint,
          innerColor,
          blend
        );
        const spriteOpacity = THREE.MathUtils.lerp(0.12, 0.7, blend);

        return (
          <React.Fragment key={sampleKey(sample, 'volume')}>
            <SoftBillboard
              position={sample.position}
              scale={[radius * 3.4, radius * 5.2, 1]}
              color={sampleOuterColor}
              opacity={spriteOpacity}
              texture={texture}
              blending={THREE.AdditiveBlending}
            />
            <SoftBillboard
              position={sample.position}
              scale={[radius * 1.8, radius * 3.1, 1]}
              color={sampleInnerColor}
              opacity={spriteOpacity * 0.95}
              texture={texture}
              blending={THREE.AdditiveBlending}
            />
          </React.Fragment>
        );
      })}

      {emberDensity > 0 &&
        volumeSamples
          .filter(
            (_, index) =>
              index %
                Math.max(1, Math.round(6 / Math.max(0.05, emberDensity))) ===
              0
          )
          .map((sample, index) => {
            const emberRadius = Math.max(
              0.04,
              emberSize * 0.28 * (1 - sample.t * 0.45)
            );
            const emberOffset = ((index % 3) - 1) * emberRadius * 0.7;

            return (
              <SoftBillboard
                key={sampleKey(sample, 'ember')}
                position={sample.position
                  .clone()
                  .add(
                    new THREE.Vector3(
                      emberOffset,
                      emberRadius * 0.35,
                      -emberOffset
                    )
                  )}
                scale={[emberRadius * 1.25, emberRadius * 1.25, 1]}
                color={emberTint}
                opacity={0.8}
                texture={texture}
                blending={THREE.AdditiveBlending}
              />
            );
          })}

      {showSpline && splinePoints.length > 1 && (
        <line geometry={splineGeometry}>
          <lineBasicMaterial color={innerColor} transparent opacity={0.65} />
        </line>
      )}

      {showVolume && (
        <lineSegments position={edgePosition} geometry={edgeGeometry}>
          <lineBasicMaterial color={outerColor} transparent opacity={0.25} />
        </lineSegments>
      )}
    </group>
  );
}

function normalizeSplineControlPoints(controlPoints, baseRadius = 0.5) {
  if (!Array.isArray(controlPoints) || controlPoints.length === 0) {
    return [];
  }

  return controlPoints.map((point, index) => {
    const scale = scaleFromControlPoint(point);
    const explicitRadius = point?.radius;
    const scaledRadius = baseRadius * (scale?.x ?? 1);

    return {
      position: positionFromControlPoint(point),
      radius: Math.max(
        0.04,
        explicitRadius ??
          (index === controlPoints.length - 1
            ? scaledRadius * 0.35
            : scaledRadius)
      ),
    };
  });
}

function buildSplineSamples(controlPoints, sampleCount) {
  if (controlPoints.length === 0) return [];
  if (controlPoints.length === 1) {
    return [
      {
        position: controlPoints[0].position.clone(),
        radius: controlPoints[0].radius,
        t: 0,
      },
    ];
  }

  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map((point) => point.position),
    false,
    'centripetal'
  );

  return curve.getPoints(sampleCount - 1).map((point, index) => {
    const t = sampleCount === 1 ? 0 : index / (sampleCount - 1);
    return {
      position: point,
      radius: sampleRadius(controlPoints, t),
      t,
    };
  });
}

function resolveAtmosphericColors({
  greyscale = false,
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  innerColor,
  outerColor,
}) {
  if (greyscale) {
    return {
      inner: tuneColor(innerColor ?? smokeLightColor, 0.4, 1.05),
      outer: tuneColor(outerColor ?? smokeDarkColor, 0.25, 0.65),
    };
  }

  return {
    inner: tuneColor(innerColor ?? '#ffd27a', 1.05, 1.2),
    outer: tuneColor(outerColor ?? '#ff6a1a', 1.2, 0.9),
  };
}

export function ApproximateBall({
  position = [0, 0, 0],
  radius = 0.4,
  animated = true,
  speed = 1,
  greyscale = false,
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
}) {
  const texture = useSoftParticleTexture();
  const groupRef = useRef();
  const colors = useMemo(
    () =>
      resolveAtmosphericColors({ greyscale, smokeLightColor, smokeDarkColor }),
    [greyscale, smokeLightColor, smokeDarkColor]
  );

  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;
    const t = clock.getElapsedTime() * Math.max(0.1, speed);
    const pulse = 1 + Math.sin(t * 2.2) * 0.06;
    groupRef.current.scale.setScalar(pulse);
    groupRef.current.rotation.y = t * 0.18;
  });

  return (
    <group ref={groupRef} position={position}>
      <SoftBillboard
        position={[0, 0, 0]}
        scale={[radius * 3.4, radius * 3.4, 1]}
        color={colors.outer}
        opacity={greyscale ? 0.28 : 0.55}
        texture={texture}
        blending={greyscale ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
      <SoftBillboard
        position={[radius * 0.14, radius * 0.08, 0]}
        scale={[radius * 2.1, radius * 2.1, 1]}
        color={colors.inner}
        opacity={greyscale ? 0.42 : 0.75}
        texture={texture}
        blending={greyscale ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
      <mesh scale={[radius * 0.85, radius * 0.85, radius * 0.85]}>
        <sphereGeometry args={[0.5, 18, 18]} />
        <meshBasicMaterial
          color={colors.inner}
          transparent
          opacity={greyscale ? 0.22 : 0.4}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function ApproximateSpline({
  controlPoints,
  baseRadius = 0.6,
  animated = true,
  speed = 1,
  greyscale = false,
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
}) {
  const texture = useSoftParticleTexture();
  const groupRef = useRef();

  const normalizedControlPoints = useMemo(
    () => normalizeSplineControlPoints(controlPoints, baseRadius),
    [controlPoints, baseRadius]
  );

  const samples = useMemo(
    () =>
      buildSplineSamples(
        normalizedControlPoints,
        Math.max(10, normalizedControlPoints.length * 8)
      ),
    [normalizedControlPoints]
  );

  const colors = useMemo(
    () =>
      resolveAtmosphericColors({ greyscale, smokeLightColor, smokeDarkColor }),
    [greyscale, smokeLightColor, smokeDarkColor]
  );

  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;
    const t = clock.getElapsedTime() * Math.max(0.1, speed);
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {samples.map((sample) => {
        const size = sample.radius * (1 - sample.t * 0.28);

        return (
          <React.Fragment key={sampleKey(sample, 'spline')}>
            <SoftBillboard
              position={sample.position}
              scale={[size * 3.1, size * 3.1, 1]}
              color={colors.outer}
              opacity={greyscale ? 0.18 : 0.42}
              texture={texture}
              blending={
                greyscale ? THREE.NormalBlending : THREE.AdditiveBlending
              }
            />
            <SoftBillboard
              position={sample.position}
              scale={[size * 1.75, size * 1.75, 1]}
              color={colors.inner}
              opacity={greyscale ? 0.26 : 0.66}
              texture={texture}
              blending={
                greyscale ? THREE.NormalBlending : THREE.AdditiveBlending
              }
            />
          </React.Fragment>
        );
      })}
    </group>
  );
}

const DEFAULT_FLAME_MOTION = {
  baseSpeed: 1.15,
  minSpeed: 0.28,
  slowFreq: 0.7,
  slowAmp: 0.55,
  fastFreq: 2.6,
  fastAmp: 0.25,
  microFreq: 5.7,
  microAmp: 0.08,
  swayX: 0.015,
  swayZ: 0.014,
  pulseFreq: 3.4,
  pulseAmp: 0.04,
  scaleX: 1,
  scaleY: 1,
};

export function ApproximateFlame({
  position = [0, 0, 0],
  inverted = false,
  motion,
  phaseOffset = 0,
}) {
  const groupRef = useRef();
  const flameMotion = { ...DEFAULT_FLAME_MOTION, ...(motion ?? {}) };

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime() + phaseOffset;
    const pulse =
      1 + Math.sin(t * flameMotion.pulseFreq) * flameMotion.pulseAmp;

    groupRef.current.rotation.x =
      (inverted ? Math.PI : 0) + Math.sin(t * 3.2) * flameMotion.swayX;
    groupRef.current.rotation.z = Math.cos(t * 2.4 + 0.8) * flameMotion.swayZ;
    groupRef.current.scale.set(
      flameMotion.scaleX,
      pulse * flameMotion.scaleY,
      flameMotion.scaleX
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <ApproximateVolumeFire
        width={0.45}
        height={1.15}
        depth={0.45}
        animated={false}
        brightness={1.45}
        saturation={1.1}
        tintColor="#ffb347"
        coreColor="#ffe8a3"
        borderColor="#ff6f1a"
      />
    </group>
  );
}

export function ApproximateSmokeColumn({
  position = [0, 0, 0],
  inverted = false,
  smoke,
  visible = true,
}) {
  const texture = useSoftParticleTexture();
  const groupRef = useRef();
  const cfg = {
    width: 1.5,
    height: 6,
    color: '#b8b8b8',
    opacity: 1,
    riseSpeed: 0.35,
    spreadStrength: 0.18,
    ...(smoke ?? {}),
  };

  const lightColor = useMemo(
    () => tuneColor(cfg.color, 0.3, 1.05),
    [cfg.color]
  );
  const darkColor = useMemo(
    () => tuneColor(cfg.color, 0.18, 0.55),
    [cfg.color]
  );
  const direction = inverted ? -1 : 1;
  const samples = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const t = index / 9;
        return {
          t,
          position: [
            Math.sin(t * Math.PI * 2.1) * cfg.spreadStrength * 0.8,
            direction * cfg.height * (t * 0.9 + 0.1),
            Math.cos(t * Math.PI * 1.4) * cfg.spreadStrength * 0.45,
          ],
          scale: [
            cfg.width * (0.65 + t * 1.55),
            cfg.height * (0.18 + t * 0.1),
            1,
          ],
        };
      }),
    [cfg.width, cfg.height, cfg.spreadStrength, direction]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * (0.45 + cfg.riseSpeed);
    groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.05;
    groupRef.current.rotation.x = Math.cos(t * 0.35) * 0.02;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position}>
      {samples.map((sample) => (
        <React.Fragment key={sampleKey(sample, 'smoke-column')}>
          <SoftBillboard
            position={sample.position}
            scale={sample.scale}
            color={darkColor}
            opacity={cfg.opacity * (0.1 + (1 - sample.t) * 0.16)}
            texture={texture}
            blending={THREE.NormalBlending}
          />
          <SoftBillboard
            position={sample.position}
            scale={[sample.scale[0] * 0.6, sample.scale[1] * 0.7, 1]}
            color={lightColor}
            opacity={cfg.opacity * (0.08 + (1 - sample.t) * 0.12)}
            texture={texture}
            blending={THREE.NormalBlending}
          />
        </React.Fragment>
      ))}
    </group>
  );
}

export function ApproximateGridBox({
  bgColor = '#3a4a5c',
  lineColor = '#1a2330',
  lineWidth = 0.025,
  size = 2000,
  gridSize = 100,
}) {
  const boxCenterY = size / 2 - size * 0.1;
  const divisions = Math.max(1, Math.round(size / Math.max(gridSize, 0.01)));
  const edgeGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
    [size]
  );

  useEffect(
    () => () => {
      edgeGeometry.dispose();
    },
    [edgeGeometry]
  );

  return (
    <group position={[0, boxCenterY, 0]}>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial color={bgColor} side={THREE.BackSide} />
      </mesh>

      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={Math.max(0.08, Math.min(0.3, lineWidth * 8))}
        />
      </lineSegments>

      <gridHelper
        args={[size, divisions, lineColor, lineColor]}
        position={[0, -size / 2 + size * 0.1, 0]}
      />
      <gridHelper
        args={[size, divisions, lineColor, lineColor]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -size / 2]}
      />
      <gridHelper
        args={[size, divisions, lineColor, lineColor]}
        rotation={[0, 0, Math.PI / 2]}
        position={[-size / 2, 0, 0]}
      />
    </group>
  );
}
