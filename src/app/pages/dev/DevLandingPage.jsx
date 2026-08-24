import React from 'react';
import { Link } from 'react-router-dom';

import './DevLandingPage.css';
import DevPageHeaderBar from './DevPageHeaderBar';

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
  {
    path: '/dev/rorschach',
    label: 'RorschachCLI',
    description: 'Generate images and video using the RorschachCLI.',
  },
];

export default function DevLandingPage() {
  return (
    <div className="dev-page dev-landing">
      <DevPageHeaderBar backLabel="back to app" backTo="/" title="devToolz" />

      <div className="dev-landing__grid">
        {DEV_LINKS.map((item) => (
          <Link className="dev-landing__card" key={item.path} to={item.path}>
            <div className="dev-landing__card-title-row">
              <h2 className="dev-landing__card-title">{item.label}</h2>
              <span className="dev-landing__arrow">→</span>
            </div>
            <p className="dev-landing__card-meta">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
