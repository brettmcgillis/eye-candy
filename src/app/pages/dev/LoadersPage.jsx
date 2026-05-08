import React from 'react';
import { Link } from 'react-router-dom';

import { ALL_LOADERS } from '../../scaffold/loader/loaders';

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
  },
  label: {
    fontSize: '0.72rem',
    color: '#6b7280',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
};

export default function LoadersPage() {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/loGlow" style={styles.back}>
          ← back to app
        </Link>
      </nav>
      <h1 style={styles.heading}>Loader Gallery</h1>
      <p style={styles.sub}>{ALL_LOADERS.length} animations · canvas-based</p>
      <div style={styles.grid}>
        {ALL_LOADERS.map((LoaderComponent) => (
          <div key={LoaderComponent.name} style={styles.cell}>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <LoaderComponent />
            </div>
            <span style={styles.label}>
              {LoaderComponent.name} · {LoaderComponent.cycleDuration}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
