import React, { memo, useEffect, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import './Three5.css';
import Atlas from './components/Atlas';
import CurveStudy from './components/CurveStudy';
import FloraStudy from './components/FloraStudy';
import LayerStudy from './components/LayerStudy';
import MeshStudy from './components/MeshStudy';
import ProjectionStudy from './components/ProjectionStudy';
import StudyGuide from './components/StudyGuide';
import WaterStudy from './components/WaterStudy';
import StudioStudy from './components/studies/StudioStudy';
import usePaint from './hooks/usePaint';
import useSceneControls from './hooks/useSceneControls';

function download(canvas, name) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function Three5() {
  const isWebGPU = useThree((state) => state.gl.isWebGPURenderer === true);
  const [revision, setRevision] = useState(0);
  const strokes = useRef([]);
  const strokeId = useRef(0);
  const drawingRef = useRef(null);
  const studioActionsRef = useRef(null);
  const assetsRef = useRef(null);
  const {
    controls: config,
    camera,
    lighting,
    presetRevision,
  } = useSceneControls(
    {
      repaint: () => setRevision((value) => value + 1),
      restartAnimation: () => studioActionsRef.current?.restart(),
      clearSpace: () => studioActionsRef.current?.clear(),
      clear: () => {
        strokes.current = [];
        setRevision((value) => value + 1);
      },
      export: (kind, settings) => {
        if (kind === 'settings') {
          const url = URL.createObjectURL(
            new Blob(
              [
                JSON.stringify(
                  {
                    format: 'three5-study-v1',
                    settings,
                    strokes: strokes.current,
                    spaceStrokes: studioActionsRef.current?.snapshot?.() || [],
                  },
                  null,
                  2
                ),
              ],
              {
                type: 'application/json',
              }
            )
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = 'three5-settings.json';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
          let canvas = assetsRef.current?.main;
          if (
            ['contours', 'lightHatch', 'stability', 'space'].includes(
              settings?.experiment
            )
          )
            canvas = assetsRef.current?.stroke;
          if (settings?.experiment === 'cutouts')
            canvas = assetsRef.current?.sprite;
          if (settings?.experiment === 'particles')
            canvas = assetsRef.current?.particle;
          if (
            ['washReveal', 'washMorph', 'paintSequence'].includes(
              settings?.experiment
            )
          )
            canvas = studioActionsRef.current?.canvas || canvas;
          if (kind === 'projection') canvas = drawingRef.current;
          if (kind === 'animated') canvas = studioActionsRef.current?.canvas;
          if (canvas) download(canvas, `three5-${kind}.png`);
        }
      },
    },
    isWebGPU
  );
  const { assets, busy, error, runtimeRef, engineVersion } = usePaint(
    config,
    strokes,
    revision
  );
  assetsRef.current = assets;
  useEffect(() => {
    strokes.current = [];
    setRevision((value) => value + 1);
  }, [presetRevision]);
  function commit(paths) {
    const marks = paths.map((points) => {
      strokeId.current += 1;
      return { id: strokeId.current, points, style: { ...config } };
    });
    strokes.current = [...strokes.current, ...marks].slice(-50);
    setRevision((value) => value + 1);
  }
  return (
    <>
      <color attach="background" args={[config.background]} />
      <CameraRig
        key={presetRevision}
        camera={camera}
        orbitInteractionEnabled={
          !(config.experiment === 'painting' && config.paintEnabled) &&
          !(
            config.experiment === 'space' &&
            config.spaceEnabled &&
            config.studyView !== 'original'
          )
        }
      />
      <LightingRig lighting={lighting} />
      {assets && (
        <>
          {assets.experiment === config.experiment && (
            <StudioStudy
              key={`${presetRevision}-${config.experiment}`}
              config={config}
              assets={assets}
              runtimeRef={runtimeRef}
              actionsRef={studioActionsRef}
            />
          )}
          {['marks', 'washes'].includes(config.experiment) && (
            <Atlas assets={assets} />
          )}
          {['materials', 'painting'].includes(config.experiment) && (
            <MeshStudy
              key={presetRevision}
              strokes={strokes}
              runtimeRef={runtimeRef}
              assets={assets}
              config={config}
              onStroke={config.experiment === 'painting' ? commit : undefined}
            />
          )}
          {config.experiment === 'curves' && (
            <CurveStudy assets={assets} config={config} />
          )}
          {config.experiment === 'flora' && (
            <FloraStudy assets={assets} config={config} />
          )}
          {config.experiment === 'water' && (
            <WaterStudy assets={assets} config={config} />
          )}
          {config.experiment === 'layers' && (
            <LayerStudy assets={assets} config={config} />
          )}
          {config.experiment === 'projection' && (
            <ProjectionStudy
              config={config}
              runtimeRef={runtimeRef}
              engineVersion={engineVersion}
              revision={revision}
              drawingRef={drawingRef}
            />
          )}
        </>
      )}
      <StudyGuide config={config} assets={assets} busy={busy} error={error} />
    </>
  );
}

export default memo(Three5);
