/* eslint-disable no-param-reassign */
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { TorusKnotGeometry } from 'three';

import projectDrawing from '../utils/projectDrawing';
import screenCenter from '../utils/screenCenter';
import { PAINT_KEYS } from '../utils/settings';

function ProjectionStudy({
  config,
  runtimeRef,
  engineVersion,
  revision,
  drawingRef,
}) {
  const camera = useThree((state) => state.camera);
  const orbit = useThree((state) => state.controls);
  const size = useThree((state) => state.size);
  const compare = config.projectionView === 'compare';
  const [status, setStatus] = useState('painting');
  const [viewRevision, setViewRevision] = useState(0);
  const [drawing, setDrawing] = useState('');
  const [error, setError] = useState('');
  const configRef = useRef(config);
  configRef.current = config;
  const geometry = useMemo(
    () =>
      new TorusKnotGeometry(
        1.7,
        0.5,
        Math.max(8, Math.round(config.projectionBudget / 8)),
        4
      ),
    [config.projectionBudget]
  );
  const paintKey = JSON.stringify(
    [
      ...PAINT_KEYS,
      'projectionFaces',
      'projectionEdges',
      'projectionBudget',
    ].map((key) => config[key])
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    if (!compare) return undefined;
    const margin = size.width > 900 ? 340 : 20;
    const paneWidth = (size.width - margin * 2 - 24) / 2;
    const sourceCenter = margin + paneWidth / 2;
    const scale = paneWidth / size.height;
    const viewWidth = size.width / scale;
    const viewHeight = size.height / scale;
    // Present the same camera projection at the square drawing's display scale.
    camera.setViewOffset(
      size.width,
      size.height,
      (size.width - viewWidth) / 2 + (size.width / 2 - sourceCenter) / scale,
      (size.height - viewHeight) / 2,
      viewWidth,
      viewHeight
    );
    return () => camera.clearViewOffset();
  }, [camera, compare, size.width, size.height]);
  useEffect(() => {
    if (!orbit) return undefined;
    const moved = () => setStatus('stale');
    const redraw = () => {
      if (config.projectionAuto) setViewRevision((value) => value + 1);
    };
    orbit.addEventListener('start', moved);
    orbit.addEventListener('end', redraw);
    return () => {
      orbit.removeEventListener('start', moved);
      orbit.removeEventListener('end', redraw);
    };
  }, [config.projectionAuto, orbit]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const snapshot = configRef.current;
      const view = camera.clone();
      view.clearViewOffset();
      const cameraMatrix = camera.matrixWorld.clone();
      const projectionMatrix = camera.projectionMatrix.clone();
      setStatus('painting');
      try {
        const canvas = await runtimeRef.current?.paint(
          [projectDrawing(geometry, view, snapshot)],
          snapshot
        );
        if (active && canvas) {
          drawingRef.current = canvas;
          setDrawing(canvas.toDataURL());
          setError('');
          setStatus(
            camera.matrixWorld.equals(cameraMatrix) &&
              camera.projectionMatrix.equals(projectionMatrix)
              ? 'ready'
              : 'stale'
          );
        }
      } catch (failure) {
        if (active) setError(failure.message);
      }
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    geometry,
    camera,
    paintKey,
    viewRevision,
    revision,
    engineVersion,
    runtimeRef,
    drawingRef,
  ]);
  return (
    <>
      <mesh geometry={geometry} visible={config.projectionView !== 'drawing'}>
        <meshStandardMaterial
          color={config.pigment}
          roughness={0.8}
          flatShading
        />
      </mesh>
      {config.projectionView !== 'source' && (
        <Html
          fullscreen
          calculatePosition={screenCenter}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[70, 60]}
        >
          <div
            className={
              compare ? 'three5-projection-compare' : 'three5-projection-single'
            }
          >
            {compare && (
              <div className="three5-source-caption">
                <h3>1 · LIVE CAMERA</h3>
                <p>Drag the knot to orbit the 3D source.</p>
              </div>
            )}
            <figure className="three5-drawing" data-projection-status={status}>
              <h3>2 · BRUSH DRAWING</h3>
              {drawing && (
                <img
                  src={drawing}
                  alt="p5.brush drawing of the 3D camera view"
                />
              )}
              <figcaption aria-live="polite">
                {status === 'painting' && 'Painting projected faces…'}
                {status === 'ready' &&
                  'Same view, repainted with brush edges and fills.'}
                {status === 'stale' &&
                  'Camera moved. Repaint to draw this view.'}
              </figcaption>
              <button
                type="button"
                onClick={() => setViewRevision((value) => value + 1)}
              >
                Repaint camera view
              </button>
              {error && <p role="alert">{error}</p>}
            </figure>
          </div>
        </Html>
      )}
    </>
  );
}

export default memo(ProjectionStudy);
