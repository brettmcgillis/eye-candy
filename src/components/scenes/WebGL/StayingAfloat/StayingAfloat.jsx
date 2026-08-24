import React, { useMemo } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import HammerHead from '@elements/HammerHead/HammerHead';
import TigerShark from '@elements/TigerShark/TigerShark';
import NurbsWaterColumn from '@elements/Water/NurbsWaterColumn';
import useNurbsWaterInteractionRuntime from '@elements/Water/waterInteraction';
import WaterColorEffect from '@postprocessing/WebGL/waterColorEffect/WaterColorEffect';
import STAYING_AFLOAT_SPLINES from '@presets/spline/stayingAfloatSplines';

import FloatingPreserver from './components/FloatingPreserver';
import SplineShark from './components/SplineShark';
import useStayingAfloatControls from './hooks/useStayingAfloatControls';

export default function StayingAfloat() {
  const controls = useStayingAfloatControls();
  const waterInteraction = useNurbsWaterInteractionRuntime({
    depth: controls.columnDepth,
    enabled: controls.interactionEnabled,
    radius: controls.interactionRadius,
    resolution: controls.interactionResolution,
    rippleDepth: controls.interactionDepth,
    viscosity: controls.interactionViscosity,
    width: controls.columnWidth,
  });

  const { hammerheadPath, tigerSharkPath, tigerSharkPath2 } = useMemo(() => {
    const preset = STAYING_AFLOAT_SPLINES['Staying Afloat'];
    const splines = preset?.splines ?? [];
    return {
      hammerheadPath: splines.find(
        (spline) => spline.name === 'Hammerhead Path'
      ),
      tigerSharkPath: splines.find(
        (spline) => spline.name === 'Tiger Shark Path'
      ),
      tigerSharkPath2: splines.find(
        (spline) => spline.name === 'Tiger Shark Path 2'
      ),
    };
  }, []);
  const sharkFollowConfig = useMemo(
    () => ({
      hammerhead: {
        bodySpanScale: 0.9,
        bodyCenterBlend: 1,
      },
      tiger1: {
        bodySpanScale: 0.85,
        bodyCenterBlend: 1,
      },
      tiger2: {
        bodySpanScale: 0.85,
        bodyCenterBlend: 1,
      },
    }),
    []
  );

  return (
    <>
      <color attach="background" args={[controls.backgroundColor]} />

      <PerspectiveCamera
        makeDefault
        position={[8.4, 7.4, 8.2]}
        fov={30}
        near={0.1}
        far={100}
        onUpdate={(self) => self.lookAt(0, 0.4, 0)}
      />
      {controls.cameraMode === 'Orbit' && (
        <OrbitControls target={[0, 0.4, 0]} />
      )}

      <ambientLight
        intensity={controls.ambientIntensity}
        color={controls.ambientColor}
      />
      <directionalLight
        position={[4, 10, 5]}
        intensity={controls.mainLightIntensity}
        color={controls.mainLightColor}
        castShadow
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <directionalLight
        position={[-5, 2, -6]}
        intensity={controls.fillLightIntensity}
        color={controls.fillLightColor}
      />

      <NurbsWaterColumn
        width={controls.columnWidth}
        depth={controls.columnDepth}
        height={controls.columnHeight}
        segments={controls.segments}
        topColor={controls.topColor}
        bottomColor={controls.bottomColor}
        opacity={controls.opacity}
        transmission={controls.transmission}
        roughness={controls.roughness}
        ior={controls.ior}
        thickness={controls.thickness}
        waveHeight={controls.waveHeight}
        waveChoppiness={controls.waveChoppiness}
        waveSpeed={controls.waveSpeed}
        interactionRuntime={waterInteraction}
        edgeColor={controls.edgeColor}
        edgeOpacity={controls.edgeOpacity}
        edgeLineWidth={controls.edgeLineWidth}
        showEdges={controls.showEdges}
      />
      <FloatingPreserver
        interactionRuntime={waterInteraction}
        waterTop={controls.columnHeight / 2}
        waveHeight={controls.waveHeight}
        waveChoppiness={controls.waveChoppiness}
        waveSpeed={controls.waveSpeed}
      />

      <SplineShark
        Shark={HammerHead}
        points={hammerheadPath?.points?.map((p) => p.position) ?? []}
        speed={controls.hammerheadSpeed}
        scale={controls.hammerheadScale}
        headingOffset={Math.PI}
        visible={controls.hammerheadVisible}
        showSpline={controls.hammerheadSplineVisible}
        bodySpanScale={sharkFollowConfig.hammerhead.bodySpanScale}
        bodyCenterBlend={sharkFollowConfig.hammerhead.bodyCenterBlend}
      />

      <SplineShark
        Shark={TigerShark}
        points={tigerSharkPath?.points?.map((p) => p.position) ?? []}
        speed={controls.tiger1Speed}
        scale={controls.tiger1Scale}
        headingOffset={Math.PI}
        visible={controls.tiger1Visible}
        showSpline={controls.tiger1SplineVisible}
        bodySpanScale={sharkFollowConfig.tiger1.bodySpanScale}
        bodyCenterBlend={sharkFollowConfig.tiger1.bodyCenterBlend}
        sharkProps={{ excludeAnimations: ['attack'] }}
      />

      <SplineShark
        Shark={TigerShark}
        points={tigerSharkPath2?.points?.map((p) => p.position) ?? []}
        speed={controls.tiger2Speed}
        scale={controls.tiger2Scale}
        headingOffset={0}
        clockwise={false}
        visible={controls.tiger2Visible}
        showSpline={controls.tiger2SplineVisible}
        bodySpanScale={sharkFollowConfig.tiger2.bodySpanScale}
        bodyCenterBlend={sharkFollowConfig.tiger2.bodyCenterBlend}
        sharkProps={{ excludeAnimations: ['attack'] }}
      />

      {controls.painterlyEnabled && (
        <WaterColorEffect
          radius={controls.painterlyRadius}
          alpha={controls.painterlyAlpha}
          quantizeLevels={controls.painterlyQuantize}
          saturation={controls.painterlySaturation}
          paperStrength={controls.painterlyPaper}
          outlineEnabled={controls.outlineEnabled}
          outlineStrength={controls.outlineStrength}
          outlineThreshold={controls.outlineThreshold}
          outlineSoftness={controls.outlineSoftness}
          hatchingEnabled={controls.hatchingEnabled}
          hatchScale={controls.hatchScale}
          hatchIntensity={controls.hatchIntensity}
          hatchThickness={controls.hatchThickness}
          hatchRotation={controls.hatchRotation}
          bloomEnabled={controls.bloomEnabled}
          bloomIntensity={controls.bloomIntensity}
        />
      )}
    </>
  );
}
