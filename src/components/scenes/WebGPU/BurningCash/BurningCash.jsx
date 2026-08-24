import React, { useCallback, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import ScatteredCash from '@elements/ScatteredCash/ScatteredCash';
import { CameraRig } from '@modules/cameraRig';
import Bloom from '@postprocessing/webGPU/bloom/Bloom';

import BillPallet, {
  computePalletBox,
  useStackDims,
} from './components/BillPallet';
import BillStacks from './components/BillStacks';
import ClothBills from './components/ClothBills';
import Embers from './components/Embers';
import IgniteOverlay from './components/IgniteOverlay';
import ScaleLineup from './components/ScaleLineup';
import useSceneControls from './hooks/useSceneControls';

const FireLight = React.memo(function FireLight({ intensity, color, flicker }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime;
    const noise =
      Math.sin(t * 11.3) * 0.5 +
      Math.sin(t * 23.7 + 1.3) * 0.3 +
      Math.sin(t * 5.1 + 4.2) * 0.2;
    lightRef.current.intensity = intensity * (1 + noise * flicker * 0.5);
  });
  return (
    <pointLight
      ref={lightRef}
      position={[0, 1.2, 0.5]}
      color={color}
      intensity={intensity}
      distance={12}
      decay={1.8}
    />
  );
});

// Renders the pallet + the cloth bills together so both share one source of
// truth for the pallet collider box (derived from the measured stack size).
const CashStorm = React.memo(function CashStorm({
  stackLength,
  pallet,
  cloth,
  billsRef,
  embersRef,
}) {
  const { dims } = useStackDims(stackLength * pallet.stackScale);

  const palletBox = useMemo(() => {
    if (!pallet.enabled) return null;
    return computePalletBox(
      {
        cols: pallet.cols,
        rows: pallet.rows,
        layers: pallet.layers,
        gap: pallet.gap,
        x: pallet.x,
        z: pallet.z,
      },
      dims
    );
  }, [
    pallet.enabled,
    pallet.cols,
    pallet.rows,
    pallet.layers,
    pallet.gap,
    pallet.x,
    pallet.z,
    stackLength,
    dims,
  ]);

  return (
    <>
      {pallet.enabled && (
        <BillPallet
          cols={pallet.cols}
          rows={pallet.rows}
          layers={pallet.layers}
          gap={pallet.gap}
          jitter={pallet.jitter}
          missingFraction={pallet.missingFraction}
          x={pallet.x}
          z={pallet.z}
          stackLength={stackLength}
          stackScale={pallet.stackScale}
        />
      )}
      <ClothBills
        ref={billsRef}
        count={cloth.count}
        billSize={cloth.billSize}
        curvature={cloth.curvature}
        hundredFraction={cloth.hundredFraction}
        speed={cloth.speed}
        tumble={cloth.tumble}
        lift={cloth.lift}
        windDirX={cloth.windDirX}
        windDirZ={cloth.windDirZ}
        autoIgnite={cloth.autoIgnite}
        burnSpeed={cloth.burnSpeed}
        igniteMinAge={cloth.igniteMinAge}
        igniteMaxAge={cloth.igniteMaxAge}
        noiseScale={cloth.noiseScale}
        edgeWidth={cloth.edgeWidth}
        charWidth={cloth.charWidth}
        glowColorA={cloth.glowColorA}
        glowColorB={cloth.glowColorB}
        glowIntensity={cloth.glowIntensity}
        emberRate={cloth.emberRate}
        surfaceFriction={cloth.surfaceFriction}
        palletBox={palletBox}
        wireframe={cloth.wireframe}
        embersRef={embersRef}
      />
    </>
  );
});

export default function BurningCash() {
  const config = useSceneControls();
  const embersRef = useRef(null);
  const billsRef = useRef(null);

  const stormPalletConfig = useMemo(
    () => ({
      enabled: config.palletEnabled,
      cols: config.palletCols,
      rows: config.palletRows,
      layers: config.palletLayers,
      gap: config.palletGap,
      jitter: config.palletJitter,
      missingFraction: config.palletMissing,
      x: config.palletX,
      z: config.palletZ,
      stackScale: config.lineupStackScale,
    }),
    [
      config.palletEnabled,
      config.palletCols,
      config.palletRows,
      config.palletLayers,
      config.palletGap,
      config.palletJitter,
      config.palletMissing,
      config.palletX,
      config.palletZ,
      config.lineupStackScale,
    ]
  );

  const stormClothConfig = useMemo(
    () => ({
      count: config.billCount,
      billSize: config.billSize,
      curvature: config.curvature,
      hundredFraction: config.hundredFraction,
      speed: config.windSpeed,
      tumble: config.tumble,
      lift: config.lift,
      windDirX: config.windDirX,
      windDirZ: config.windDirZ,
      autoIgnite: config.autoIgnite,
      burnSpeed: config.burnSpeed,
      igniteMinAge: config.igniteMinAge,
      igniteMaxAge: config.igniteMaxAge,
      noiseScale: config.noiseScale,
      edgeWidth: config.edgeWidth,
      charWidth: config.charWidth,
      glowColorA: config.glowColorA,
      glowColorB: config.glowColorB,
      glowIntensity: config.glowIntensity,
      emberRate: config.emberRate,
      surfaceFriction: config.stickiness,
      wireframe: config.wireframe,
    }),
    [
      config.billCount,
      config.billSize,
      config.curvature,
      config.hundredFraction,
      config.windSpeed,
      config.tumble,
      config.lift,
      config.windDirX,
      config.windDirZ,
      config.autoIgnite,
      config.burnSpeed,
      config.igniteMinAge,
      config.igniteMaxAge,
      config.noiseScale,
      config.edgeWidth,
      config.charWidth,
      config.glowColorA,
      config.glowColorB,
      config.glowIntensity,
      config.emberRate,
      config.stickiness,
      config.wireframe,
    ]
  );

  const stacksConfig = useMemo(
    () => ({
      count: config.stackCount,
      scale: config.lineupStackScale,
      stackLength: config.stackLength,
      innerRadius: config.stackInnerRadius,
      outerRadius: config.stackOuterRadius,
    }),
    [
      config.stackCount,
      config.lineupStackScale,
      config.stackLength,
      config.stackInnerRadius,
      config.stackOuterRadius,
    ]
  );

  const lineupConfig = useMemo(
    () => ({
      billSize: config.billSize,
      stackLength: config.stackLength,
      oneScale: config.lineupOneScale,
      hundredScale: config.lineupHundredScale,
      stackScale: config.lineupStackScale,
    }),
    [
      config.billSize,
      config.stackLength,
      config.lineupOneScale,
      config.lineupHundredScale,
      config.lineupStackScale,
    ]
  );

  const embersConfig = useMemo(
    () => ({
      size: config.emberSize,
      rise: config.emberRise,
      drift: config.emberDrift,
      windDirX: config.windDirX,
      windDirZ: config.windDirZ,
      colorHot: config.emberColorHot,
      colorCool: config.emberColorCool,
      intensity: config.emberIntensity,
    }),
    [
      config.emberSize,
      config.emberRise,
      config.emberDrift,
      config.windDirX,
      config.windDirZ,
      config.emberColorHot,
      config.emberColorCool,
      config.emberIntensity,
    ]
  );

  const ignitePercentRef = useRef(config.ignitePercent);
  ignitePercentRef.current = config.ignitePercent;
  const handleIgnite = useCallback(() => {
    billsRef.current?.igniteFraction(ignitePercentRef.current / 100);
  }, []);

  return (
    <>
      <CameraRig camera={config.camera} />

      <color attach="background" args={[config.bgColor]} />
      <fog
        attach="fog"
        args={[config.bgColor, config.fogNear, config.fogFar]}
      />

      <ambientLight
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />
      <directionalLight
        position={[-4, 6, 4]}
        intensity={config.keyIntensity}
        color={config.keyColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-2}
        shadow-bias={-0.001}
      />
      <FireLight
        intensity={config.fireLightIntensity}
        color={config.fireLightColor}
        flicker={config.fireFlicker}
      />

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <circleGeometry args={[14, 96]} />
        <meshStandardMaterial
          color={config.groundColor}
          metalness={0.1}
          roughness={0.95}
        />
      </mesh>

      {config.showPile && (
        <ScatteredCash position={[0, 0.01, 0]} scale={config.pileScale} />
      )}
      {config.stackCount > 0 && (
        <BillStacks
          count={stacksConfig.count}
          scale={stacksConfig.scale}
          stackLength={stacksConfig.stackLength}
          innerRadius={stacksConfig.innerRadius}
          outerRadius={stacksConfig.outerRadius}
        />
      )}

      <CashStorm
        stackLength={config.stackLength}
        pallet={stormPalletConfig}
        cloth={stormClothConfig}
        billsRef={billsRef}
        embersRef={embersRef}
      />
      <IgniteOverlay onIgnite={handleIgnite} />
      {config.showLineup && (
        <ScaleLineup
          billSize={lineupConfig.billSize}
          stackLength={lineupConfig.stackLength}
          oneScale={lineupConfig.oneScale}
          hundredScale={lineupConfig.hundredScale}
          stackScale={lineupConfig.stackScale}
        />
      )}
      <Embers
        ref={embersRef}
        size={embersConfig.size}
        rise={embersConfig.rise}
        drift={embersConfig.drift}
        windDirX={embersConfig.windDirX}
        windDirZ={embersConfig.windDirZ}
        colorHot={embersConfig.colorHot}
        colorCool={embersConfig.colorCool}
        intensity={embersConfig.intensity}
      />

      {config.bloomEnabled && (
        <Bloom
          threshold={config.bloomThreshold}
          strength={config.bloomStrength}
          radius={config.bloomRadius}
        />
      )}
    </>
  );
}
