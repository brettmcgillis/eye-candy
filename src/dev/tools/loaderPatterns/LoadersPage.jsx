import React, { useEffect, useRef, useState } from 'react';

import { drawLayers, restState } from '../../../app/scaffold/loader/drawFrame';
import {
  ALL_LOADERS,
  MOTIONS,
  STYLES,
} from '../../../app/scaffold/loader/loaders';
import {
  CX,
  CY,
  CanvasFrame,
  INK,
  OrientationProvider,
  SQ,
  useLoaderCanvas,
  useSquares,
} from '../../../app/scaffold/loader/primitives';
import Overlay from '../../../app/scaffold/overlay/Overlay';
import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './LoadersPage.css';

const SOLID = STYLES.find((s) => s.id === 'solid');
const BRUSH_STYLES = STYLES.filter((s) => s.engine === 'brush');

function PatternIndex() {
  const squares = useSquares();
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);

  const canvasRef = useLoaderCanvas((ctx) => {
    drawLayers(ctx, [{ look: 'ink', squares: restState(squares) }], SOLID);

    squares.forEach((s) => {
      const x = CX + s.sx * SQ * cos45 - s.sy * SQ * sin45;
      const y = CY + s.sx * SQ * sin45 + s.sy * SQ * cos45;

      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = s.layer === 'b' ? INK.red : INK.black;
      ctx.fillText(String(s.i), x, y);
    });
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

function LoaderMatrix({ orientation, onSelect }) {
  return (
    <OrientationProvider orientation={orientation}>
      <div
        className="loaders-page__matrix"
        style={{ '--loader-columns': STYLES.length }}
      >
        <span />
        {STYLES.map((style) => (
          <span className="loaders-page__heading" key={style.id}>
            {style.label}
            <small>{style.engine}</small>
          </span>
        ))}
        {MOTIONS.map((motion) => (
          <React.Fragment key={motion.id}>
            <span className="loaders-page__heading loaders-page__heading--row">
              {motion.label}
              <small>{motion.cycleDuration}s</small>
            </span>
            {ALL_LOADERS.filter((L) => L.motion === motion).map((L) => (
              <button
                type="button"
                className="loaders-page__cell"
                key={L.id}
                onClick={() => onSelect(L, orientation)}
                title={`Preview ${L.label} fullscreen`}
              >
                <L />
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </OrientationProvider>
  );
}

function BakeAtlas({ style }) {
  const hostRef = useRef(null);
  const [status, setStatus] = useState('baking…');

  useEffect(() => {
    let live = true;
    const started = performance.now();
    style.prepare().then(() => {
      const ready = style.baked();
      if (!live || !hostRef.current) return;
      if (!ready) {
        setStatus('bake failed — see console');
        return;
      }
      const sheets = [ready.masks.sketch, ...ready.masks.ink];
      hostRef.current.replaceChildren(
        ...sheets.map((mask) => {
          const canvas = document.createElement('canvas');
          canvas.width = mask.width;
          canvas.height = mask.height;
          canvas.className = 'loaders-page__atlas';
          canvas.getContext('2d').drawImage(mask, 0, 0);
          return canvas;
        })
      );
      setStatus(
        `sketch + ${ready.masks.ink.length} stages · ${Math.round(performance.now() - started)}ms incl. queue`
      );
    });
    return () => {
      live = false;
    };
  }, [style]);

  return (
    <div className="loaders-page__bake">
      <p className="loaders-page__reference-label">
        {style.label} · {status}
      </p>
      <div className="loaders-page__atlases" ref={hostRef} />
    </div>
  );
}

function LoaderPreview({ LoaderComponent, orientation, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="loader-preview"
      onClick={(e) => {
        if (!e.target.closest('.overlay')) onClose();
      }}
      style={{ '--loader-preview-background': INK.paper }}
    >
      <OrientationProvider orientation={orientation}>
        <div className="loader-preview__loader">
          <LoaderComponent />
        </div>
      </OrientationProvider>
      <p className="loader-preview__label">{LoaderComponent.label}</p>
      <Overlay />
    </div>
  );
}

export default function LoadersPage() {
  const [orientation, setOrientation] = useState('h');
  const [preview, setPreview] = useState(null);
  const selectPreview = (comp, o) =>
    setPreview({ comp: () => comp, orientation: o });

  return (
    <div className="dev-page loaders-page">
      <DevPageHeaderBar title="loaderPatterns" />
      <p className="dev-muted loaders-page__summary">
        {MOTIONS.length} motions × {STYLES.length} styles = {ALL_LOADERS.length}{' '}
        loaders · click to preview
      </p>

      <div className="loaders-page__toolbar">
        {['h', 'v'].map((o) => (
          <button
            type="button"
            key={o}
            className={`dev-button${orientation === o ? ' dev-button--primary' : ''}`}
            onClick={() => setOrientation(o)}
          >
            {o === 'h' ? 'Horizontal' : 'Vertical'}
          </button>
        ))}
      </div>

      <LoaderMatrix
        key={orientation}
        orientation={orientation}
        onSelect={selectPreview}
      />

      <h2 className="dev-section-title">Brush bakes</h2>
      <p className="dev-muted loaders-page__summary">
        One tile per square, black ink as alpha; tinted per colour at draw time.
      </p>
      {BRUSH_STYLES.map((style) => (
        <BakeAtlas key={style.id} style={style} />
      ))}

      <h2 className="dev-section-title">Square Index Reference</h2>
      <p className="dev-muted loaders-page__summary">
        Red = layer b · Black = layer t
      </p>
      <div className="loaders-page__references">
        {['h', 'v'].map((o) => (
          <div key={o}>
            <p className="loaders-page__reference-label">
              {o === 'h' ? 'horizontal' : 'vertical'}
            </p>
            <div className="loaders-page__canvas">
              <OrientationProvider orientation={o}>
                <PatternIndex />
              </OrientationProvider>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <LoaderPreview
          LoaderComponent={preview.comp()}
          orientation={preview.orientation}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
