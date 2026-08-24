import React, { useEffect, useState } from 'react';

import { ALL_LOADERS } from '../../../app/scaffold/loader/loaders';
import {
  CX,
  CY,
  CanvasFrame,
  INK,
  OrientationProvider,
  SQ,
  drawPatternBase,
  useLoaderCanvas,
  useSquares,
} from '../../../app/scaffold/loader/primitives';
import Overlay from '../../../app/scaffold/overlay/Overlay';
import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './LoadersPage.css';

// Static diagram showing each square's index number — for pattern design reference.
function PatternIndex() {
  const squares = useSquares();
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);

  const canvasRef = useLoaderCanvas((ctx) => {
    drawPatternBase(ctx, squares);

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

function LoaderGrid({ orientation, onSelect }) {
  return (
    <OrientationProvider orientation={orientation}>
      <div className="loaders-page__grid">
        {ALL_LOADERS.map((LoaderComponent) => (
          <div
            className="loaders-page__cell"
            key={LoaderComponent.name}
            onClick={() => onSelect(LoaderComponent, orientation)}
            title={`Preview ${LoaderComponent.name} fullscreen`}
          >
            <div className="loaders-page__canvas">
              <LoaderComponent />
            </div>
            <span className="loaders-page__label">
              {LoaderComponent.name} · {LoaderComponent.cycleDuration}s
            </span>
          </div>
        ))}
      </div>
    </OrientationProvider>
  );
}

// Full-screen preview — matches the Loader.jsx layout exactly so it looks
// identical to a real scene load. Overlay is shown for sig / date / ig pills.
// orientation is locked to whichever grid row was tapped — not recalculated
// from viewport size — so clicking an H thumbnail always shows H on mobile.
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
      // Tap anywhere outside the overlay to close.
      // Clicks on .overlay elements (pills, leva) are excluded so they
      // remain interactive without accidentally dismissing the preview.
      onClick={(e) => {
        if (!e.target.closest('.overlay')) onClose();
      }}
      style={{ '--loader-preview-background': INK.paper }}
    >
      {/* Loader — same sizing as the real Loader.jsx, orientation locked */}
      <OrientationProvider orientation={orientation}>
        <div className="loader-preview__loader">
          <LoaderComponent />
        </div>
      </OrientationProvider>

      {/* App overlay — renders pills in corners exactly as in-app */}
      <Overlay />
    </div>
  );
}

export default function LoadersPage() {
  // { comp: LoaderComponent, orientation: 'h'|'v' } | null
  // comp is wrapped in an arrow because React treats bare functions passed to
  // setState as updater functions — wrapping stores the function itself.
  const [preview, setPreview] = useState(null);
  const selectPreview = (comp, orientation) =>
    setPreview({ comp: () => comp, orientation });

  return (
    <div className="dev-page loaders-page">
      <DevPageHeaderBar title="loaderPatterns" />
      <p className="dev-muted loaders-page__summary">
        {ALL_LOADERS.length} animations · canvas-based · click to preview
      </p>

      <h2 className="dev-section-title dev-section-title--first">Horizontal</h2>
      <LoaderGrid orientation="h" onSelect={selectPreview} />

      <h2 className="dev-section-title">Vertical</h2>
      <LoaderGrid orientation="v" onSelect={selectPreview} />

      <h2 className="dev-section-title">Square Index Reference</h2>
      <p className="dev-muted loaders-page__summary">
        Red = layer b · Black = layer t
      </p>
      <div className="loaders-page__references">
        <div>
          <p className="loaders-page__reference-label">horizontal</p>
          <div className="loaders-page__canvas">
            <OrientationProvider orientation="h">
              <PatternIndex />
            </OrientationProvider>
          </div>
        </div>
        <div>
          <p className="loaders-page__reference-label">vertical</p>
          <div className="loaders-page__canvas">
            <OrientationProvider orientation="v">
              <PatternIndex />
            </OrientationProvider>
          </div>
        </div>
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
