/* eslint-disable react/no-array-index-key */

/* eslint-disable consistent-return */
import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useThree } from '@react-three/fiber';

import CENTER_STORE_REF_POSITION from '../../../../elements/sevenEleven/sevenElevenAnchors';
import CameraRig from '../../../../rigging/CameraRig';
import BlackHoleHero from './components/BlackHoleHero';
import OrbitingBodies from './components/OrbitingBodies';
import OutdoorStage from './components/OutdoorStage';
import PostEffects from './components/PostEffects';
import SpaceSkybox from './components/SpaceSkybox';
import StoreStage from './components/StoreStage';
import useSceneControls from './hooks/useSceneControls';
import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
  SETTING_OUTDOOR,
  SURVEILLANCE_SHOT_LABELS,
} from './presets/presets';

function DownwardSpotLight({
  angle,
  color,
  decay,
  distance,
  intensity,
  penumbra,
  position,
}) {
  const ref = useRef();
  const { scene } = useThree();

  useLayoutEffect(() => {
    if (!ref.current || !position) return;
    const { target } = ref.current;
    scene.add(target);
    target.position.set(position[0], position[1] - 100000, position[2]);
    target.updateMatrixWorld();
    return () => scene.remove(target);
  }, [position, scene]);

  if (!position) return null;
  return (
    <spotLight
      ref={ref}
      angle={angle}
      color={color}
      decay={decay}
      distance={distance}
      intensity={intensity}
      penumbra={penumbra}
      position={position}
    />
  );
}

function toVector3(value) {
  if (value instanceof THREE.Vector3) return value.clone();
  if (Array.isArray(value)) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(value.x ?? 0, value.y ?? 0, value.z ?? 0);
}

function toTuple(vector) {
  return [vector.x, vector.y, vector.z];
}

function transformFrame(frame, matrix, keys = ['position', 'target', 'pivot']) {
  if (!matrix || !frame) return frame;

  const nextFrame = { ...frame };
  keys.forEach((key) => {
    if (!frame[key]) return;
    nextFrame[key] = toTuple(toVector3(frame[key]).applyMatrix4(matrix));
  });

  return nextFrame;
}

function transformSpline(spline, matrix) {
  if (!matrix || !spline?.points?.length) return spline;

  const transformedTarget = spline.target
    ? toTuple(toVector3(spline.target).applyMatrix4(matrix))
    : undefined;

  return {
    ...spline,
    target: transformedTarget ?? spline.target,
    desktop: spline.desktop
      ? transformFrame(spline.desktop, matrix)
      : { fov: spline.fov, target: transformedTarget ?? spline.target },
    mobile: spline.mobile
      ? transformFrame(spline.mobile, matrix)
      : { fov: spline.fov, target: transformedTarget ?? spline.target },
    points: spline.points.map((point) => {
      const nextPoint = {
        ...point,
        position: toTuple(toVector3(point.position).applyMatrix4(matrix)),
      };

      if (point.lookAt) {
        nextPoint.lookAt = toTuple(
          toVector3(point.lookAt).applyMatrix4(matrix)
        );
      }

      return nextPoint;
    }),
  };
}

function getStoreFallbackPosition() {
  return {
    x: CENTER_STORE_REF_POSITION.x,
    y: CENTER_STORE_REF_POSITION.y,
    z: CENTER_STORE_REF_POSITION.z,
  };
}

function getActiveLensDiameter(config) {
  switch (config.blackHoleVariant) {
    case BLACK_HOLE_VARIANT_LEGACY_PORT:
      return config.legacyLensDiameter;
    case BLACK_HOLE_VARIANT_SINGULARITY:
      return config.singularityLensDiameter;
    default:
      return config.webgpuLensDiameter;
  }
}

function parseRecordingStartMs(recordingStartDate, recordingStartTime) {
  if (
    typeof recordingStartDate !== 'string' ||
    typeof recordingStartTime !== 'string'
  ) {
    return null;
  }

  const dateValue = recordingStartDate.trim();
  const timeValue = recordingStartTime.trim();

  if (!dateValue || !timeValue) {
    return null;
  }

  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return null;
  }

  const normalizedTime = /^\d{2}:\d{2}$/.test(timeValue)
    ? `${timeValue}:00`
    : timeValue;
  const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);

  if (!timeMatch) {
    return null;
  }

  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const seconds = Number(timeMatch[3]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  const parsedDate = new Date(`${dateValue}T${normalizedTime}`);
  const parsedMs = parsedDate.getTime();

  return Number.isNaN(parsedMs) ? null : parsedMs;
}

export default function Aisle9() {
  const config = useSceneControls();
  const [storeSpace, setStoreSpace] = useState(null);
  const [outdoorLightPositions, setOutdoorLightPositions] = useState([]);
  const [activeShotLabel, setActiveShotLabel] = useState(
    () => config.surveillanceCameraLabel
  );

  useEffect(() => {
    setActiveShotLabel(config.surveillanceCameraLabel);
  }, [config.surveillanceCameraLabel]);

  const handleShotChange = useCallback((shotId) => {
    const label = SURVEILLANCE_SHOT_LABELS[shotId];
    if (label) {
      setActiveShotLabel(label);
    }
  }, []);
  const { bloomEnabled } = config;
  const transformMatrix = storeSpace?.storeLocalToWorldMatrix ?? null;

  const handleStoreSpaceChange = useCallback((nextStoreSpace) => {
    setStoreSpace({
      centerStoreRefWorldPosition:
        nextStoreSpace.centerStoreRefWorldPosition.clone(),
      storeLocalToWorldMatrix: nextStoreSpace.storeLocalToWorldMatrix.clone(),
    });
  }, []);

  const blackHolePosition = useMemo(() => {
    const center = storeSpace?.centerStoreRefWorldPosition;
    if (!center) return getStoreFallbackPosition();
    return { x: center.x, y: center.y, z: center.z };
  }, [storeSpace]);

  const metricWorldScale = config.storeScale;
  const activeLensDiameter = getActiveLensDiameter(config);
  const orbitMinDistance =
    config.orbitMinDistance ??
    Math.max(140, activeLensDiameter * metricWorldScale * 0.55);
  const orbitMaxDistance =
    config.orbitMaxDistance ??
    Math.max(1400, activeLensDiameter * metricWorldScale * 2.5);

  const effectiveConfig = useMemo(
    () => ({ ...config, blackHolePosition, metricWorldScale }),
    [blackHolePosition, config, metricWorldScale]
  );

  const shouldRenderPostEffects =
    bloomEnabled ||
    effectiveConfig.chromaticAberrationEnabled ||
    effectiveConfig.retroEnabled ||
    effectiveConfig.surveillanceOverlayEnabled;

  const recordingStartMs = useMemo(
    () =>
      effectiveConfig.recordingOverrideEnabled
        ? parseRecordingStartMs(
            effectiveConfig.recordingStartDate,
            effectiveConfig.recordingStartTime
          )
        : null,
    [
      effectiveConfig.recordingOverrideEnabled,
      effectiveConfig.recordingStartDate,
      effectiveConfig.recordingStartTime,
    ]
  );

  const cameraConfig = useMemo(
    () => ({
      autoFit: config.cameraAutoFit,
      far: config.cameraFar,
      fixed: config.cameraFixed,
      mode: config.cameraMode,
      near: config.cameraNear,
      operator: {
        moveSpeed: metricWorldScale * 2,
        liftSpeed: metricWorldScale * 2,
      },
      orbit: config.cameraOrbit,
      spline: transformSpline(config.cameraSpline, transformMatrix),
    }),
    [
      config.cameraAutoFit,
      config.cameraFar,
      config.cameraFixed,
      config.cameraMode,
      config.cameraNear,
      config.cameraOrbit,
      config.cameraSpline,
      metricWorldScale,
      transformMatrix,
    ]
  );

  const keyLightPosition = useMemo(
    () =>
      toTuple(toVector3(blackHolePosition).add(new THREE.Vector3(0, 1.2, 0.6))),
    [blackHolePosition]
  );

  const handleOutdoorLightPositionsChange = useCallback((positions) => {
    setOutdoorLightPositions(positions);
  }, []);

  const storeInteriorPosition = useMemo(() => {
    if (!transformMatrix) return null;
    return toTuple(
      new THREE.Vector3(-7.5, 3.7, -14).applyMatrix4(transformMatrix)
    );
  }, [transformMatrix]);

  const storeFrontFillPosition = useMemo(() => {
    if (!transformMatrix) return null;
    return toTuple(
      new THREE.Vector3(-5.8, 2.5, -7).applyMatrix4(transformMatrix)
    );
  }, [transformMatrix]);

  return (
    <>
      <CameraRig
        apiRef={config.cameraApiRef}
        camera={cameraConfig}
        onShotChange={handleShotChange}
        orbitControlsProps={{
          dampingFactor: 0.08,
          enableDamping: true,
          maxDistance: orbitMaxDistance,
          minDistance: orbitMinDistance,
        }}
      />

      <color attach="background" args={['#111312']} />
      {config.skyboxEnabled ? (
        <SpaceSkybox
          rotationEnabled={config.skyboxRotationEnabled}
          rotationSpeed={config.skyboxRotationSpeed}
          rotationX={config.skyboxRotationX}
          rotationY={config.skyboxRotationY}
          rotationZ={config.skyboxRotationZ}
          skyAzimuth={config.skyAzimuth}
          skyCloudCoverage={config.skyCloudCoverage}
          skyCloudDensity={config.skyCloudDensity}
          skyCloudElevation={config.skyCloudElevation}
          skyElevation={config.skyElevation}
          skyMieCoefficient={config.skyMieCoefficient}
          skyMieDirectionalG={config.skyMieDirectionalG}
          skyRayleigh={config.skyRayleigh}
          skyShowSunDisc={config.skyShowSunDisc}
          skyTurbidity={config.skyTurbidity}
          skyMode={config.skyboxMode}
        />
      ) : null}
      {config.setting === SETTING_OUTDOOR ? (
        <OutdoorStage
          indoorEmissiveColor={config.indoorEmissiveColor}
          indoorEmissiveIntensity={config.indoorEmissiveIntensity ?? 0}
          onOutdoorLightPositionsChange={handleOutdoorLightPositionsChange}
          onStoreSpaceChange={handleStoreSpaceChange}
          outdoorEmissiveColor={config.outdoorEmissiveColor}
          outdoorEmissiveIntensity={config.outdoorEmissiveIntensity ?? 0}
          signEmissiveColor={config.signEmissiveColor}
          signGlowIntensity={config.signGlowIntensity ?? 0}
          storePosition={config.storePosition}
          storeRotation={config.storeRotation}
          storeScale={config.storeScale}
        />
      ) : (
        <StoreStage
          onStoreSpaceChange={handleStoreSpaceChange}
          storePosition={config.storePosition}
          storeRotation={config.storeRotation}
          storeScale={config.storeScale}
        />
      )}

      {config.setting === SETTING_OUTDOOR ? (
        <>
          <ambientLight
            color={config.ambientColor}
            intensity={config.ambientIntensity}
          />
          <directionalLight
            color={config.moonColor}
            intensity={config.moonIntensity}
            position={[-3, 8, 4]}
          />
          {outdoorLightPositions.map((position, i) => (
            <DownwardSpotLight
              key={i}
              angle={Math.PI / 5}
              color={config.outdoorLightColor}
              decay={0}
              distance={10000}
              intensity={config.outdoorLightIntensity ?? 0}
              penumbra={0.4}
              position={position}
            />
          ))}
          <DownwardSpotLight
            angle={Math.PI / 2}
            color={config.indoorLightColor}
            decay={0}
            distance={8000}
            intensity={config.indoorLightIntensity ?? 0}
            penumbra={0.6}
            position={storeInteriorPosition}
          />
          {storeFrontFillPosition && (
            <pointLight
              color={config.storeFillColor}
              decay={0}
              distance={5000}
              intensity={config.storeFillIntensity ?? 0}
              position={storeFrontFillPosition}
            />
          )}
        </>
      ) : (
        <>
          <ambientLight color="#f4efe6" intensity={1.6} />
          <pointLight
            color="#ffb05a"
            decay={1.5}
            distance={18}
            intensity={120}
            position={keyLightPosition}
          />
          <directionalLight
            color="#d9ecff"
            intensity={2.2}
            position={[4, 7, 5]}
          />
        </>
      )}

      {shouldRenderPostEffects ? (
        <PostEffects
          bloomEnabled={bloomEnabled}
          bloomRadius={effectiveConfig.bloomRadius}
          bloomStrength={effectiveConfig.bloomStrength}
          bloomThreshold={effectiveConfig.bloomThreshold}
          bloomToneMappingExposure={effectiveConfig.bloomToneMappingExposure}
          cameraLabel={activeShotLabel}
          chromaticAberrationCenterX={
            effectiveConfig.chromaticAberrationCenterX
          }
          chromaticAberrationCenterY={
            effectiveConfig.chromaticAberrationCenterY
          }
          chromaticAberrationEnabled={
            effectiveConfig.chromaticAberrationEnabled
          }
          chromaticAberrationScale={effectiveConfig.chromaticAberrationScale}
          chromaticAberrationStrength={
            effectiveConfig.chromaticAberrationStrength
          }
          overlayEnabled={effectiveConfig.surveillanceOverlayEnabled}
          retroAffineDistortion={effectiveConfig.retroAffineDistortion}
          retroColorBleeding={effectiveConfig.retroColorBleeding}
          retroColorDepthSteps={effectiveConfig.retroColorDepthSteps}
          retroCurvature={effectiveConfig.retroCurvature}
          retroEnabled={effectiveConfig.retroEnabled}
          retroScanlineDensity={effectiveConfig.retroScanlineDensity}
          retroScanlineIntensity={effectiveConfig.retroScanlineIntensity}
          retroScanlineSpeed={effectiveConfig.retroScanlineSpeed}
          retroVignetteIntensity={effectiveConfig.retroVignetteIntensity}
          recordingStartMs={recordingStartMs}
        />
      ) : null}

      {config.blackHoleEnabled ? (
        <BlackHoleHero config={effectiveConfig} />
      ) : null}
      {config.orbitingBodiesEnabled ? (
        <OrbitingBodies config={effectiveConfig} />
      ) : null}
    </>
  );
}
