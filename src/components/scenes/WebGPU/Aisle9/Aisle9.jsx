import React, { useCallback, useEffect, useMemo, useState } from 'react';

import * as THREE from 'three';

import { CameraRig } from '@modules/cameraRig';

import BlackHoleHero from './components/BlackHoleHero';
import OrbitingBodies from './components/OrbitingBodies';
import OutdoorLights from './components/OutdoorLights';
import OutdoorStage from './components/OutdoorStage';
import PostEffects from './components/PostEffects';
import SpaceSkybox from './components/SpaceSkybox';
import StoreStage from './components/StoreStage';
import useSceneControls from './hooks/useSceneControls';
import { STORE_CENTER } from './presets/cameraData';
import { SETTING_OUTDOOR, SURVEILLANCE_SHOT_LABELS } from './presets/presets';
import getActiveLensDiameter from './utils/blackHoleUtils';
import transformSpline from './utils/splineTransform';
import parseRecordingStartMs from './utils/time';
import { toTuple, toVector3 } from './utils/vectors';

// Local-space offsets within the store model (in store-local units).
const INTERIOR_LIGHT_OFFSET = [-7.5, 3.7, -14];
const STORE_FRONT_FILL_OFFSET = [-5.8, 2.5, -7];
const KEY_LIGHT_OFFSET = new THREE.Vector3(0, 1.2, 0.6);

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
    if (label) setActiveShotLabel(label);
  }, []);

  const transformMatrix = storeSpace?.storeLocalToWorldMatrix ?? null;

  const handleStoreSpaceChange = useCallback((next) => {
    setStoreSpace({
      centerStoreRefWorldPosition: next.centerStoreRefWorldPosition.clone(),
      storeLocalToWorldMatrix: next.storeLocalToWorldMatrix.clone(),
    });
  }, []);

  const blackHolePosition = useMemo(() => {
    const center = storeSpace?.centerStoreRefWorldPosition;
    if (!center)
      return { x: STORE_CENTER[0], y: STORE_CENTER[1], z: STORE_CENTER[2] };
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
    config.bloomEnabled ||
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
    () => toTuple(toVector3(blackHolePosition).add(KEY_LIGHT_OFFSET)),
    [blackHolePosition]
  );

  const handleOutdoorLightPositionsChange = useCallback((positions) => {
    setOutdoorLightPositions(positions);
  }, []);

  const storeInteriorPosition = useMemo(
    () =>
      transformMatrix
        ? toTuple(
            new THREE.Vector3(...INTERIOR_LIGHT_OFFSET).applyMatrix4(
              transformMatrix
            )
          )
        : null,
    [transformMatrix]
  );

  const storeFrontFillPosition = useMemo(
    () =>
      transformMatrix
        ? toTuple(
            new THREE.Vector3(...STORE_FRONT_FILL_OFFSET).applyMatrix4(
              transformMatrix
            )
          )
        : null,
    [transformMatrix]
  );

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
          rotation={config.skyboxRotation}
          rotationEnabled={config.skyboxRotationEnabled}
          rotationSpeed={config.skyboxRotationSpeed}
          skyAzimuth={config.skyAzimuth}
          skyCloudCoverage={config.skyCloudCoverage}
          skyCloudDensity={config.skyCloudDensity}
          skyCloudElevation={config.skyCloudElevation}
          skyElevation={config.skyElevation}
          skyMieCoefficient={config.skyMieCoefficient}
          skyMieDirectionalG={config.skyMieDirectionalG}
          skyMode={config.skyboxMode}
          skyRayleigh={config.skyRayleigh}
          skyShowSunDisc={config.skyShowSunDisc}
          skyTurbidity={config.skyTurbidity}
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
        <OutdoorLights
          ambientColor={config.ambientColor}
          ambientIntensity={config.ambientIntensity}
          indoorLightColor={config.indoorLightColor}
          indoorLightIntensity={config.indoorLightIntensity ?? 0}
          moonColor={config.moonColor}
          moonIntensity={config.moonIntensity}
          outdoorLightColor={config.outdoorLightColor}
          outdoorLightIntensity={config.outdoorLightIntensity ?? 0}
          outdoorLightPositions={outdoorLightPositions}
          storeFillColor={config.storeFillColor}
          storeFillIntensity={config.storeFillIntensity ?? 0}
          storeFrontFillPosition={storeFrontFillPosition}
          storeInteriorPosition={storeInteriorPosition}
        />
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
          bloomEnabled={config.bloomEnabled}
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
        <OrbitingBodies
          blackHolePosition={blackHolePosition}
          metricWorldScale={metricWorldScale}
          bodyOrbitRadius={config.bodyOrbitRadius}
          bodyOrbitHeight={config.bodyOrbitHeight}
          bodyOrbitSpeed={config.bodyOrbitSpeed}
          body1Scale={config.body1Scale}
          body1Instances={config.body1Instances}
          body2Scale={config.body2Scale}
          body2Instances={config.body2Instances}
          body3Scale={config.body3Scale}
          body3Instances={config.body3Instances}
          body4Scale={config.body4Scale}
          body4Instances={config.body4Instances}
          body5Scale={config.body5Scale}
          body5Instances={config.body5Instances}
          body6Scale={config.body6Scale}
          body6Instances={config.body6Instances}
        />
      ) : null}
    </>
  );
}
