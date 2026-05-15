import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ALL_LOADERS } from '../../scaffold/loader/loaders';
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
} from '../../scaffold/loader/primitives';
import Overlay from '../../scaffold/overlay/Overlay';
import { DEFAULT_SCENE_PATH } from '../../sceneRegistry';

const styles = {
  page: {
    fontFamily: 'system-ui, sans-serif',
    background: '#ffffff',
    color: '#111827',
    minHeight: '100vh',
    padding: '2rem',
    boxSizing: 'border-box',
  },
  nav: { marginBottom: '1.5rem' },
  back: { color: '#6b7280', fontSize: '0.85rem', textDecoration: 'none' },
  heading: { fontSize: '1.2rem', margin: '0 0 0.25rem' },
  sub: { color: '#6b7280', fontSize: '0.8rem', margin: '0 0 2rem' },
  sectionHeading: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#6b7280',
    margin: '2.5rem 0 1rem',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '2rem',
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  label: {
    fontSize: '0.72rem',
    color: '#6b7280',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
};

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
      <div style={styles.grid}>
        {ALL_LOADERS.map((LoaderComponent) => (
          <div
            key={LoaderComponent.name}
            style={styles.cell}
            onClick={() => onSelect(LoaderComponent, orientation)}
            title={`Preview ${LoaderComponent.name} fullscreen`}
          >
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <LoaderComponent />
            </div>
            <span style={styles.label}>
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
      // Tap anywhere outside the overlay to close.
      // Clicks on .overlay elements (pills, leva) are excluded so they
      // remain interactive without accidentally dismissing the preview.
      onClick={(e) => {
        if (!e.target.closest('.overlay')) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: INK.paper,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Loader — same sizing as the real Loader.jsx, orientation locked */}
      <OrientationProvider orientation={orientation}>
        <div
          style={{ width: 'min(60vmin, 320px)', height: 'min(60vmin, 320px)' }}
        >
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
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to={DEFAULT_SCENE_PATH} style={styles.back}>
          ← back to app
        </Link>
      </nav>

      <h1 style={styles.heading}>Loader Gallery</h1>
      <p style={styles.sub}>
        {ALL_LOADERS.length} animations · canvas-based · click to preview
      </p>

      <h2
        style={{
          ...styles.sectionHeading,
          borderTop: 'none',
          paddingTop: 0,
          margin: '0 0 1rem',
        }}
      >
        Horizontal
      </h2>
      <LoaderGrid orientation="h" onSelect={selectPreview} />

      <h2 style={styles.sectionHeading}>Vertical</h2>
      <LoaderGrid orientation="v" onSelect={selectPreview} />

      <h2 style={styles.sectionHeading}>Square Index Reference</h2>
      <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 1rem' }}>
        Red = layer b · Black = layer t
      </p>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <p
            style={{
              color: '#6b7280',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              margin: '0 0 0.5rem',
            }}
          >
            horizontal
          </p>
          <div style={{ width: 160, height: 160 }}>
            <OrientationProvider orientation="h">
              <PatternIndex />
            </OrientationProvider>
          </div>
        </div>
        <div>
          <p
            style={{
              color: '#6b7280',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              margin: '0 0 0.5rem',
            }}
          >
            vertical
          </p>
          <div style={{ width: 160, height: 160 }}>
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
