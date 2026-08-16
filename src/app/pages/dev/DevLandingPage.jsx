import React from 'react';
import { Link } from 'react-router-dom';

import { iconFile } from '../../../utils/appUtils';

const DEV_LINKS = [
  {
    path: '/dev/colors',
    label: 'Colors & Gradients',
    description: 'Browse and edit shared palette entries.',
  },
  {
    path: '/dev/iconography',
    label: 'Iconography',
    description: 'Reference UI and scene icons.',
  },
  {
    path: '/dev/loaderpattern',
    label: 'loaderPatterns',
    description: 'Preview loader animations and pattern references.',
  },
  {
    path: '/dev/gltfjsx',
    label: 'GLTF -> JSX',
    description: 'Import, optimize, and export models.',
  },
];

const styles = {
  page: {
    minHeight: '100vh',
    padding: '2rem 1.5rem 3rem',
    boxSizing: 'border-box',
    background:
      'linear-gradient(135deg, #f8fafc 0%, #fff7ed 52%, #eff6ff 100%)',
    color: '#0f172a',
    fontFamily: 'system-ui, sans-serif',
  },
  nav: {
    marginBottom: '1rem',
  },
  back: {
    color: '#475569',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
  header: {
    display: 'grid',
    gap: '0.8rem',
    marginBottom: '1.5rem',
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#b45309',
  },
  titleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5em',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    lineHeight: 1,
  },
  titleIcon: {
    width: '0.9em',
    height: '0.9em',
    objectFit: 'contain',
    flexShrink: 0,
  },
  lead: {
    margin: 0,
    maxWidth: '52rem',
    color: '#334155',
    lineHeight: 1.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  card: {
    display: 'grid',
    gap: '0.65rem',
    textDecoration: 'none',
    color: 'inherit',
    borderRadius: '20px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(255,255,255,0.85)',
    padding: '1rem',
    boxShadow: '0 14px 34px rgba(15,23,42,0.05)',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 700,
  },
  cardMeta: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.5,
    fontSize: '0.9rem',
  },
  arrow: {
    fontSize: '1.1rem',
    color: '#0f172a',
  },
};

export default function DevLandingPage() {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.back}>
          ← back to app
        </Link>
      </nav>

      <header style={styles.header}>
        <p style={styles.eyebrow}>Dev tools</p>
        <h1 style={styles.title}>
          <span style={styles.titleRow}>
            <span>devToolz</span>
            <img
              src={iconFile('turbo_flex.png')}
              alt="Turbo Flex"
              style={styles.titleIcon}
            />
          </span>
        </h1>
        <p style={styles.lead}>
          Jump quickly between the local authoring utilities for colors, icons,
          loaders, and model conversion workflows.
        </p>
      </header>

      <div style={styles.grid}>
        {DEV_LINKS.map((item) => (
          <Link key={item.path} to={item.path} style={styles.card}>
            <div style={styles.cardTitleRow}>
              <h2 style={styles.cardTitle}>{item.label}</h2>
              <span style={styles.arrow}>→</span>
            </div>
            <p style={styles.cardMeta}>{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
