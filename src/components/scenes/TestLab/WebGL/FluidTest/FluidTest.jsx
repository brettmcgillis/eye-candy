import * as THREE from 'three';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import { makeRectRingGeometry } from '../../../../elements/marker/MarkerSquare';
import FluidHandsBridge from '../../../../hands/FluidHandsBridge';
import FluidMaterial from '../../../../materials/webGL/FluidMaterial/FluidMaterial';
import useFluidAutoPointers from '../../../../materials/webGL/FluidMaterial/hooks/useFluidAutoPointers';
import { clamp01 } from '../../../../materials/webGL/FluidMaterial/hooks/useFluidControlHelpers';
import useFluidHandsConfig from '../../../../materials/webGL/FluidMaterial/hooks/useFluidHandsConfig';
import useFluidPointerInput from '../../../../materials/webGL/FluidMaterial/hooks/useFluidPointerInput';
import useFluidRandomSplats from '../../../../materials/webGL/FluidMaterial/hooks/useFluidRandomSplats';
import useFluidStationarySplats from '../../../../materials/webGL/FluidMaterial/hooks/useFluidStationarySplats';
import {
  DEBUG_CONTACT_CAP,
  DEBUG_CONTACT_TTL_DEFAULT,
  DEBUG_POINTER_CAP,
  MAX_RANDOM_SPLATS,
} from '../../../../materials/webGL/FluidMaterial/utils/constants';
import useFluidControls from './hooks/useFluidControls';

const DEG_TO_RAD = Math.PI / 180;

function uvToWorldPosition(u, v, viewport, using3D) {
  const safeU = clamp01(u);
  const safeV = clamp01(v);

  if (!using3D) {
    return [
      (safeU - 0.5) * viewport.width,
      (safeV - 0.5) * viewport.height,
      0.015,
    ];
  }

  const radius = 1.12;
  const theta = safeU * Math.PI * 2;
  const phi = (1 - safeV) * Math.PI;
  const sinPhi = Math.sin(phi);
  return [
    radius * sinPhi * Math.cos(theta),
    radius * Math.cos(phi),
    radius * sinPhi * Math.sin(theta),
  ];
}

function DebugMarker({
  markerRef,
  index,
  config,
  viewport,
  using3D,
  alwaysVisible = false,
}) {
  const meshRef = useRef();

  const width =
    (config.width || 0) *
    (using3D ? 2.2 : Math.min(viewport.width, viewport.height));
  const height =
    (config.height || 0) *
    (using3D ? 2.2 : Math.min(viewport.width, viewport.height));
  const thickness = Math.max(
    0.00025,
    Math.min(width, height) * ((config.lineWeight ?? 2) / 100)
  );
  const rotation = (config.rotation || 0) * DEG_TO_RAD;

  const ringGeometry = useMemo(
    () => makeRectRingGeometry(width, height, thickness),
    [height, thickness, width]
  );

  useEffect(() => () => ringGeometry.dispose(), [ringGeometry]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const marker = markerRef.current?.[index];
    if (!marker) {
      mesh.visible = false;
      return;
    }

    const ttl = marker.ttl ?? 0;
    const ttlDuration = Math.max(config.fadeDuration || 0.0001, 0.0001);
    const alpha = alwaysVisible
      ? 1
      : THREE.MathUtils.clamp(ttl / ttlDuration, 0, 1);

    mesh.visible = alwaysVisible || alpha > 0;
    if (!mesh.visible) return;

    const [x, y, z] = uvToWorldPosition(marker.x, marker.y, viewport, using3D);
    mesh.position.set(x, y, z);

    if (using3D) {
      mesh.quaternion.copy(state.camera.quaternion);
    } else {
      mesh.rotation.set(0, 0, rotation);
    }

    if (mesh.material) {
      mesh.material.opacity = alpha;
      mesh.material.needsUpdate = false;
    }
  });

  const materialProps = {
    color: config.color,
    transparent: true,
    opacity: 1,
    depthTest: !using3D,
    depthWrite: false,
    toneMapped: false,
  };

  if (config.fill) {
    return (
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial {...materialProps} />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} geometry={ringGeometry}>
      <meshBasicMaterial {...materialProps} />
    </mesh>
  );
}

function FluidDebugOverlay({
  fluidValues,
  viewport,
  using3D,
  pointerContactsRef,
  autoPointersRef,
  stationaryPointersRef,
  stationaryDebugMarkersRef,
  randomContactsRef,
}) {
  const fadeDuration = Math.max(
    fluidValues.debugContactFadeDuration ?? DEBUG_CONTACT_TTL_DEFAULT,
    0.0001
  );

  const stationaryStyle = {
    color:
      fluidValues.debugStationarySplatColor ?? fluidValues.debugStationaryColor,
    width:
      fluidValues.debugStationarySplatWidth ?? fluidValues.debugStationaryWidth,
    height:
      fluidValues.debugStationarySplatHeight ??
      fluidValues.debugStationaryHeight,
    lineWeight:
      fluidValues.debugStationarySplatLineWeight ??
      fluidValues.debugStationaryLineWeight,
    fill:
      fluidValues.debugStationarySplatFill ?? fluidValues.debugStationaryFill,
    rotation:
      fluidValues.debugStationarySplatRotation ??
      fluidValues.debugStationaryRotation,
    fadeDuration,
  };

  const stationaryMarkerStyle = {
    color:
      fluidValues.debugStationaryMarkerColor ??
      fluidValues.debugStationaryColor,
    width:
      fluidValues.debugStationaryMarkerWidth ??
      fluidValues.debugStationaryWidth,
    height:
      fluidValues.debugStationaryMarkerHeight ??
      fluidValues.debugStationaryHeight,
    lineWeight:
      fluidValues.debugStationaryMarkerLineWeight ??
      fluidValues.debugStationaryLineWeight,
    fill:
      fluidValues.debugStationaryMarkerFill ?? fluidValues.debugStationaryFill,
    rotation:
      fluidValues.debugStationaryMarkerRotation ??
      fluidValues.debugStationaryRotation,
    fadeDuration,
  };

  const pointerStyle = {
    color: fluidValues.debugPointerColor,
    width: fluidValues.debugPointerWidth,
    height: fluidValues.debugPointerHeight,
    lineWeight: fluidValues.debugPointerLineWeight,
    fill: fluidValues.debugPointerFill,
    rotation: fluidValues.debugPointerRotation,
    fadeDuration,
  };

  const autoStyle = {
    color: fluidValues.debugAutoColor,
    width: fluidValues.debugAutoWidth,
    height: fluidValues.debugAutoHeight,
    lineWeight: fluidValues.debugAutoLineWeight,
    fill: fluidValues.debugAutoFill,
    rotation: fluidValues.debugAutoRotation,
    fadeDuration,
  };

  const randomStyle = {
    color: fluidValues.debugRandomColor,
    width: fluidValues.debugRandomWidth,
    height: fluidValues.debugRandomHeight,
    lineWeight: fluidValues.debugRandomLineWeight,
    fill: fluidValues.debugRandomFill,
    rotation: fluidValues.debugRandomRotation,
    fadeDuration,
  };

  const pointerMarkerSlots = useMemo(
    () => Array.from({ length: DEBUG_POINTER_CAP }, (_, slot) => slot),
    []
  );
  const randomMarkerSlots = useMemo(
    () => Array.from({ length: DEBUG_CONTACT_CAP }, (_, slot) => slot),
    []
  );
  const autoMarkerSlots = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, fluidValues.autoSplatCount || 1) },
        (_, slot) => slot
      ),
    [fluidValues.autoSplatCount]
  );

  return (
    <>
      {!!fluidValues.debugCursor &&
        pointerMarkerSlots.map((slot) => (
          <DebugMarker
            key={`fluid-pointer-slot-${slot}`}
            markerRef={pointerContactsRef}
            index={slot}
            config={pointerStyle}
            viewport={viewport}
            using3D={using3D}
          />
        ))}

      {!!fluidValues.debugAutoSplat &&
        autoMarkerSlots.map((slot) => (
          <DebugMarker
            key={`fluid-auto-slot-${slot}`}
            markerRef={autoPointersRef}
            index={slot}
            config={autoStyle}
            viewport={viewport}
            using3D={using3D}
          />
        ))}

      {!!fluidValues.debugStationarySplat &&
        !!fluidValues.stationarySplatsEnabled &&
        stationaryPointersRef.current.map((marker, slot) => (
          <DebugMarker
            key={`fluid-stationary-${marker.id}`}
            markerRef={stationaryPointersRef}
            index={slot}
            config={stationaryStyle}
            viewport={viewport}
            using3D={using3D}
            alwaysVisible
          />
        ))}

      {!!fluidValues.debugStationarySplat &&
        !!fluidValues.stationaryDebugMarkersEnabled &&
        stationaryDebugMarkersRef.current.map((marker, slot) => (
          <DebugMarker
            key={`fluid-stationary-marker-${marker.id}`}
            markerRef={stationaryDebugMarkersRef}
            index={slot}
            config={stationaryMarkerStyle}
            viewport={viewport}
            using3D={using3D}
            alwaysVisible
          />
        ))}

      {!!fluidValues.debugRandomBurst &&
        randomMarkerSlots.map((slot) => (
          <DebugMarker
            key={`fluid-random-slot-${slot}`}
            markerRef={randomContactsRef}
            index={slot}
            config={randomStyle}
            viewport={viewport}
            using3D={using3D}
          />
        ))}
    </>
  );
}

function FluidTestbed() {
  const { viewport, size } = useThree();
  const matRef = useRef();
  const randomSplatQueueRef = useRef(0);
  const pointerContactsRef = useRef(
    Array.from({ length: DEBUG_POINTER_CAP }, () => ({
      x: 0.5,
      y: 0.5,
      ttl: 0,
    }))
  );
  const randomContactsRef = useRef(
    Array.from({ length: DEBUG_CONTACT_CAP }, () => ({
      x: 0.5,
      y: 0.5,
      ttl: 0,
    }))
  );
  const randomWriteRef = useRef(0);

  const [fluidValues] = useFluidControls({
    randomSplatQueueRef,
    resetSimRef: matRef,
  });

  const autoPointersRef = useFluidAutoPointers({
    config: fluidValues,
    size,
  });
  const randomSplatsRef = useFluidRandomSplats({
    config: fluidValues,
    randomSplatQueueRef,
  });
  const { pointerRef: pointerInputRef, pointerEvents } = useFluidPointerInput({
    size,
  });
  const handsPointerRef = useRef(null);
  const setHandsPointer = useCallback((pointer) => {
    handsPointerRef.current = pointer;
  }, []);
  const enqueueGestureBurst = useCallback(() => {
    randomSplatQueueRef.current += MAX_RANDOM_SPLATS;
  }, []);

  const {
    stationaryPointersRef,
    stationaryDebugMarkersRef,
    pointerEvents: stationaryPointerEvents,
  } = useFluidStationarySplats({
    config: fluidValues,
    pointerEvents,
  });

  const { mediaPipeConfig, handControlConfig } =
    useFluidHandsConfig(fluidValues);

  const inputMode = fluidValues.inputMode || 'pointer';
  const usingHands = inputMode === 'hands';
  const testMode = fluidValues.testMode || 'plane';
  const using3D = testMode === '3d';
  const activePointerRef = usingHands ? handsPointerRef : pointerInputRef;
  const meshPointerEvents = usingHands ? {} : stationaryPointerEvents;

  useFrame((_, delta) => {
    const dt = Math.min(0.033, delta);
    const fadeDuration = Math.max(
      fluidValues.debugContactFadeDuration ?? DEBUG_CONTACT_TTL_DEFAULT,
      0.0001
    );

    for (let i = 0; i < DEBUG_POINTER_CAP; i += 1) {
      pointerContactsRef.current[i].ttl = Math.max(
        0,
        pointerContactsRef.current[i].ttl - dt
      );
    }

    for (let i = 0; i < DEBUG_CONTACT_CAP; i += 1) {
      randomContactsRef.current[i].ttl = Math.max(
        0,
        randomContactsRef.current[i].ttl - dt
      );
    }

    const pointerState = activePointerRef.current;
    let activePointers = [];
    if (Array.isArray(pointerState)) {
      activePointers = pointerState.filter((p) => p?.down);
    } else if (pointerState?.down) {
      activePointers = [pointerState];
    }

    for (let i = 0; i < DEBUG_POINTER_CAP; i += 1) {
      const pointer = activePointers[i];
      if (pointer) {
        pointerContactsRef.current[i].x = clamp01(pointer.x);
        pointerContactsRef.current[i].y = clamp01(pointer.y);
        pointerContactsRef.current[i].ttl = fadeDuration;
      }
    }

    const randomSplats = randomSplatsRef.current || [];
    for (let i = 0; i < randomSplats.length; i += 1) {
      const splat = randomSplats[i];
      const idx = randomWriteRef.current;
      randomContactsRef.current[idx].x = clamp01(splat?.x);
      randomContactsRef.current[idx].y = clamp01(splat?.y);
      randomContactsRef.current[idx].ttl = fadeDuration;
      randomWriteRef.current = (idx + 1) % DEBUG_CONTACT_CAP;
    }
  });

  return (
    <>
      {using3D ? (
        <>
          <PerspectiveCamera makeDefault position={[0, 0, 3.3]} fov={45} />
          <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />
        </>
      ) : (
        <OrthographicCamera makeDefault position={[0, 0, 10]} />
      )}
      {usingHands && (
        <FluidHandsBridge
          gesturesEnabled={!!fluidValues.gesturesEnabled}
          handControlConfig={handControlConfig}
          invertX={!!fluidValues.handsInvertX}
          invertY={!!fluidValues.handsInvertY}
          mediaPipeConfig={mediaPipeConfig}
          onGestureBurst={enqueueGestureBurst}
          onPointerChange={setHandsPointer}
          size={size}
        />
      )}
      {using3D ? (
        <mesh {...meshPointerEvents}>
          <sphereGeometry args={[1.1, 128, 128]} />
          <FluidMaterial
            ref={matRef}
            pointerRef={activePointerRef}
            config={fluidValues}
            autoPointersRef={autoPointersRef}
            stationaryPointersRef={stationaryPointersRef}
            randomSplatsRef={randomSplatsRef}
          />
        </mesh>
      ) : (
        <mesh
          scale={[viewport.width, viewport.height, 1]}
          {...meshPointerEvents}
        >
          <planeGeometry args={[1, 1]} />
          <FluidMaterial
            ref={matRef}
            pointerRef={activePointerRef}
            config={fluidValues}
            autoPointersRef={autoPointersRef}
            stationaryPointersRef={stationaryPointersRef}
            randomSplatsRef={randomSplatsRef}
          />
        </mesh>
      )}
      <FluidDebugOverlay
        fluidValues={fluidValues}
        viewport={viewport}
        using3D={using3D}
        pointerContactsRef={pointerContactsRef}
        autoPointersRef={autoPointersRef}
        stationaryPointersRef={stationaryPointersRef}
        stationaryDebugMarkersRef={stationaryDebugMarkersRef}
        randomContactsRef={randomContactsRef}
      />
    </>
  );
}

export default function FluidTest() {
  return <FluidTestbed />;
}
