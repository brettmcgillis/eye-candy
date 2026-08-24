import React from 'react';
import { Link } from 'react-router-dom';

import DEV_PAGES from '../devPageRegistry';
import './DevLandingPage.css';
import DevPageHeaderBar from './DevPageHeaderBar';

export default function DevLandingPage() {
  return (
    <div className="dev-page dev-landing">
      <DevPageHeaderBar backLabel="back to app" backTo="/" title="devToolz" />

      <div className="dev-landing__grid">
        {DEV_PAGES.map((item) => (
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
