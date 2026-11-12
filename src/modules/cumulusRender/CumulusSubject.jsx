import React from 'react';

import { Bounds, Float } from '@react-three/drei';

import CensorPanel from './CensorPanel';
import HaloDisplay from './HaloDisplay';
import SceneCloud from './SceneCloud';
import SceneFemur from './SceneFemur';
import SceneSkull from './SceneSkull';

const noop = () => {};
export default function CumulusSubject({
  controls: c,
  setControls = noop,
  fitBounds = false,
  margin = 1,
}) {
  return (
    <Float speed={c.floatSpeed}>
      <Bounds fit={fitBounds} clip observe={fitBounds} margin={margin}>
        <HaloDisplay controls={c} setControls={setControls} />

        {c.skullVisible ? (
          <SceneSkull
            paintConfig={c}
            position={c.skullPosition}
            rotation={c.skullRotation}
            scale={c.skullScale}
            visible={c.skullVisible}
            showCranium={c.showCranium}
            showLeftZygomatic={c.showLeftZygomatic}
            showOccipital={c.showOccipital}
            showRightLacrimal={c.showRightLacrimal}
            showRightMaxilla={c.showRightMaxilla}
            showRightNasal={c.showRightNasal}
            showRightPalatine={c.showRightPalatine}
            showRightParietal={c.showRightParietal}
            showRightTemporal={c.showRightTemporal}
            showRightZygomatic={c.showRightZygomatic}
            showSphenoid={c.showSphenoid}
            showTeeth={c.showTeeth}
            showVomer={c.showVomer}
            showEthmoid={c.showEthmoid}
            showFrontal={c.showFrontal}
            showInferiorConchae={c.showInferiorConchae}
            showLeftLacrimal={c.showLeftLacrimal}
            showLeftMaxilla={c.showLeftMaxilla}
            showLeftNasal={c.showLeftNasal}
            showLeftPalatine={c.showLeftPalatine}
            showLeftParietal={c.showLeftParietal}
            showLeftTemporal={c.showLeftTemporal}
            showMandible={c.showMandible}
            showMandibleBone={c.showMandibleBone}
            showMandibleTeeth={c.showMandibleTeeth}
          />
        ) : null}

        {c.cloudVisible ? (
          <SceneCloud
            paintConfig={c}
            position={c.cloudPosition}
            rotation={c.cloudRotation}
            scale={c.cloudScale}
            visible={c.cloudVisible}
            seed={c.cloudSeed}
            segments={c.cloudSegments}
            volume={c.cloudVolume}
            opacity={c.cloudOpacity}
            fade={c.cloudFade}
            growth={c.cloudGrowth}
            speed={c.cloudSpeed}
            boundsX={c.cloudBoundsX}
            boundsY={c.cloudBoundsY}
            boundsZ={c.cloudBoundsZ}
            color={c.cloudColor}
          />
        ) : null}

        {c.femurVisible ? (
          <SceneFemur
            paintConfig={c}
            position={c.femurPosition}
            rotation={c.femurRotation}
            scale={c.femurScale}
            visible={c.femurVisible}
          />
        ) : null}
      </Bounds>

      {c.censorPanelVisible ? (
        <CensorPanel
          visible={c.censorPanelVisible}
          position={c.censorPanelPosition}
          rotation={c.censorPanelRotation}
          scale={c.censorPanelScale}
          pixelSize={c.censorPixelSize}
          refraction={c.censorRefraction}
          clipOffset={c.censorClipOffset}
        />
      ) : null}
    </Float>
  );
}
