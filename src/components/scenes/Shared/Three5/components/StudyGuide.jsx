import React, { memo, useMemo, useRef } from 'react';

import { Html } from '@react-three/drei';

import { ANIMATION_IDS } from '../utils/animationSettings';
import { EXPERIMENTS } from '../utils/experiments';
import screenCenter from '../utils/screenCenter';
import RenderStats from './RenderStats';

function StudyGuide({ config, busy, error, assets }) {
  const output = useRef();
  const strokeSample = useMemo(() => assets?.stroke?.toDataURL(), [assets]);
  const info = EXPERIMENTS[config.experiment];
  let activity = 'static texture uploads';
  if (config.experiment === 'painting') activity = 'live color while painting';
  if (ANIMATION_IDS.includes(config.experiment))
    activity = 'base bake · animation timing below';
  if (!config.showGuide && !error) return null;
  return (
    <>
      <RenderStats outputRef={output} />
      <Html
        fullscreen
        calculatePosition={screenCenter}
        style={{ pointerEvents: 'none' }}
        zIndexRange={[90, 80]}
      >
        <aside
          className="three5-guide"
          data-study={config.experiment}
          data-brush={config.brush}
          data-painted-study={assets?.experiment}
          data-ready={!busy && assets?.experiment === config.experiment}
        >
          <span className="three5-eyebrow">THREE5.JS / FIELD NOTES</span>
          <h2>{info.title}</h2>
          <p>{info.description}</p>
          <div className="three5-start">
            <span className="three5-eyebrow">START WITH · {info.controls}</span>
            <p>{info.instruction}</p>
          </div>
          <details className="three5-details">
            <summary>How this study works</summary>
            <p>{info.use}</p>
            {['curves', 'flora', 'water'].includes(config.experiment) &&
              strokeSample && (
                <figure className="three5-stroke-sample">
                  <figcaption>Brush texture used along each 3D path</figcaption>
                  <img src={strokeSample} alt="Baked brush stroke" />
                </figure>
              )}
            {config.experiment === 'marks' && (
              <p>
                Spray ink boost enlarges fine spray dots for readable texture
                samples. Set it to 1 for the native brush. Higher spray pressure
                spreads fewer dots across a wider area.
              </p>
            )}
            {config.experiment === 'painting' && (
              <p>
                Actual brush strokes update as you drag. Release to bake the
                final spline and its bump map. Paint gestures disables camera
                rotation. Use Clear all strokes in Paint on mesh.
              </p>
            )}
            {config.experiment === 'projection' && (
              <p>
                Compare shows the live 3D source beside its painted projection.
                Orbit the source, then Repaint camera view, or enable Repaint on
                orbit end. Faces use backface culling and painter ordering;
                intersecting surfaces can overlap imperfectly.
              </p>
            )}
            {config.experiment === 'water' && (
              <p>
                The existing postprocessing comparison runs in the WebGL lab.
                Brush textures and the shared water element work in both
                renderer channels.
              </p>
            )}
          </details>
          <div className="three5-status" aria-live="polite">
            {busy
              ? 'Preparing brush textures…'
              : `${config.resolution}px · ${Math.round(assets?.millis || 0)} ms generation · ${activity}`}
          </div>
          <div
            ref={output}
            className="three5-status"
            aria-label="Live rendering performance"
          />
          {error && (
            <p role="alert" className="three5-error">
              {error}
            </p>
          )}
        </aside>
      </Html>
    </>
  );
}

export default memo(StudyGuide);
