import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import CameraRig from '../../../../rigging/CameraRig';
import BrickWall from './components/BrickWall';
import ButtonOverlay from './components/ButtonOverlay';
import EmptyCanScatter from './components/EmptyCanScatter';
import Ground from './components/Ground';
import InteractiveCan from './components/InteractiveCan';
import PaintRig from './components/PaintRig';
import Streetlight from './components/Streetlight';
import TrashScatter from './components/TrashScatter';
import {
  PaintTargetsProvider,
  createPaintTargetsRegistry,
} from './hooks/usePaintTargets';
import useSceneControls, {
  CAN_BASE_POSITION,
  WIDE_SHOT,
} from './hooks/useSceneControls';
import useSpraySound from './hooks/useSpraySound';
import {
  REALISTIC_CAN_SCALE,
  SIDEWALK_DEPTH,
  SIDEWALK_HEIGHT,
} from './utils/sceneUtils';

// The center can faces the color-select camera with its physical RGB sliders.
// In Paint mode PaintRig drives the same group's transform every frame
// instead (handheld can following the mouse).
const COLOR_SELECT_ROTATION = [0, -Math.PI / 2, 0];
// Side cans turn 180deg from the center can so their physical sliders face
// away. Their decal groups are wrapped onto that opposite side.
const COLOR_SELECT_SIDE_ROTATION = [0, Math.PI / 2, 0];
const GROUND_DEPTH = 10;
// Measured from sprayCanSeparated.glb bbox Z (-1.20238..1.21928): one can
// diameter after REALISTIC_CAN_SCALE. Side cans use this as their center
// offset so the three cans sit side by side with no gap.
const CAN_DIAMETER = 2.42166 * REALISTIC_CAN_SCALE;

export default function WetPaint() {
  const config = useSceneControls();
  const isPaintMode = config.mode === 'paint';
  const isColorSelectMode = config.mode === 'colorSelect';
  const isPhotoMode = config.mode === 'photo';
  const handheldGroupRef = useRef(null);
  const registry = useMemo(() => createPaintTargetsRegistry(), []);
  const setSpraying = useSpraySound();

  useEffect(() => {
    const clearRef = config.paintClearRef;
    clearRef.current = () => registry.clearAll();
    return () => {
      clearRef.current = null;
    };
  }, [config.paintClearRef, registry]);

  const brush = useMemo(
    () => ({
      color: new THREE.Color(
        config.brushColorR,
        config.brushColorG,
        config.brushColorB
      ),
      size: config.brushSize,
      hardness: config.brushHardness,
      opacity: config.brushOpacity,
      texture: config.brushTexture,
      finish: config.brushFinish,
      dripChance: config.dripChance,
      dripLengthScale: config.dripLength,
    }),
    [
      config.brushColorB,
      config.brushColorG,
      config.brushColorR,
      config.brushFinish,
      config.brushHardness,
      config.brushOpacity,
      config.brushSize,
      config.brushTexture,
      config.dripChance,
      config.dripLength,
    ]
  );

  const rgb = useMemo(
    () => ({
      r: config.brushColorR,
      g: config.brushColorG,
      b: config.brushColorB,
    }),
    [config.brushColorB, config.brushColorG, config.brushColorR]
  );

  const brushSettings = useMemo(
    () => ({
      brushSize: config.brushSize,
      brushHardness: config.brushHardness,
      brushOpacity: config.brushOpacity,
      brushTexture: config.brushTexture,
      brushFinish: config.brushFinish,
      dripChance: config.dripChance,
    }),
    [
      config.brushFinish,
      config.brushHardness,
      config.brushOpacity,
      config.brushSize,
      config.brushTexture,
      config.dripChance,
    ]
  );

  const handleModeChange = useCallback(
    (nextMode) => config.setMode(nextMode),
    [config]
  );

  // PaintRig owns the handheld group's transform every frame while in Paint
  // mode; when leaving Paint mode nothing resets it, so explicitly snap back
  // to the color-select resting pose (standing on the sidewalk).
  useLayoutEffect(() => {
    const group = handheldGroupRef.current;
    if (!group || isPaintMode) return;
    group.position.set(...CAN_BASE_POSITION);
    group.rotation.set(...COLOR_SELECT_ROTATION);
  }, [isPaintMode]);

  const streetlightPosition = [-config.wallWidth / 2 + 1, SIDEWALK_HEIGHT, 1.2];
  // Local to the streetlight base: aim the beam at the middle of the wall.
  const spotTarget = [
    -streetlightPosition[0],
    config.wallHeight * 0.5 - SIDEWALK_HEIGHT,
    -streetlightPosition[2],
  ];

  return (
    <PaintTargetsProvider value={registry}>
      <color attach="background" args={[config.skyColor]} />
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight
        position={[-4, 8, 4]}
        intensity={config.sunIntensity}
        castShadow
      />

      <CameraRig camera={config.camera} apiRef={config.cameraApiRef} />

      <BrickWall
        width={config.wallWidth}
        height={config.wallHeight}
        sideDepth={config.wallSideDepth}
        tintColor={config.wallTint}
      />

      <Ground width={config.wallWidth + 2} depth={GROUND_DEPTH} />

      <Streetlight
        position={streetlightPosition}
        scale={config.streetlightScale}
        glassEmissive={config.streetlightEmissive}
        spotIntensity={config.spotIntensity}
        spotTarget={spotTarget}
      />

      <EmptyCanScatter
        position={[0, SIDEWALK_HEIGHT, SIDEWALK_DEPTH * 0.55]}
        curbLength={config.wallWidth - 2}
        count={config.canCount}
        layout={config.scatterLayout}
        seed={config.scatterSeed}
      />

      {config.showTrash && (
        <TrashScatter
          position={[0, SIDEWALK_HEIGHT, SIDEWALK_DEPTH * 0.35]}
          areaLength={config.wallWidth - 2}
          seed={config.scatterSeed}
        />
      )}

      {/* Hidden entirely in photo mode so it never blocks the shot. */}
      <group
        ref={handheldGroupRef}
        scale={REALISTIC_CAN_SCALE}
        visible={!isPhotoMode}
      >
        <InteractiveCan
          interactive={isColorSelectMode}
          rgb={rgb}
          settings={brushSettings}
          onRgbChange={config.setBrushColor}
          onSettingChange={config.setBrushSetting}
        />
      </group>

      {isColorSelectMode && (
        <>
          <group
            position={[
              CAN_BASE_POSITION[0] - CAN_DIAMETER,
              CAN_BASE_POSITION[1],
              CAN_BASE_POSITION[2],
            ]}
            rotation={COLOR_SELECT_SIDE_ROTATION}
            scale={REALISTIC_CAN_SCALE}
          >
            <InteractiveCan
              decals="wheel"
              showSliders={false}
              rgb={rgb}
              settings={brushSettings}
              onRgbChange={config.setBrushColor}
              onSettingChange={config.setBrushSetting}
            />
          </group>
          <group
            position={[
              CAN_BASE_POSITION[0] + CAN_DIAMETER,
              CAN_BASE_POSITION[1],
              CAN_BASE_POSITION[2],
            ]}
            rotation={COLOR_SELECT_SIDE_ROTATION}
            scale={REALISTIC_CAN_SCALE}
          >
            <InteractiveCan
              decals="brush"
              showSliders={false}
              rgb={rgb}
              settings={brushSettings}
              onRgbChange={config.setBrushColor}
              onSettingChange={config.setBrushSetting}
            />
          </group>
        </>
      )}

      <PaintRig
        mode={config.mode}
        brush={brush}
        handheldGroupRef={handheldGroupRef}
        onSprayingChange={setSpraying}
        wideShot={WIDE_SHOT}
      />

      <ButtonOverlay
        mode={config.mode}
        onModeChange={handleModeChange}
        onScreenshotClick={config.takeScreenshot}
      />
    </PaintTargetsProvider>
  );
}
