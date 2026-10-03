import React from 'react';
import { Link } from 'react-router-dom';

import DEV_PAGES from '../devPageRegistry';
import './DevLandingPage.css';
import DevPageHeaderBar from './DevPageHeaderBar';

const toolGroups = [
  { id: 'general', label: 'General' },
  { id: 'render-workbenches', label: 'Render Workbenches' },
].map((group) => ({
  ...group,
  tools: DEV_PAGES.filter(
    (item) => (item.group ?? 'general') === group.id
  ).sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
  ),
}));

export default function DevLandingPage() {
  return (
    <div className="dev-page dev-landing">
      <DevPageHeaderBar backLabel="back to app" backTo="/" title="devToolz" />

      {toolGroups.map((group) => (
        <section
          aria-labelledby={`dev-group-${group.id}`}
          className="dev-landing__group"
          key={group.id}
        >
          <h2 className="dev-landing__group-title" id={`dev-group-${group.id}`}>
            {group.label}{' '}
            <small className="dev-landing__group-count">
              ({group.tools.length})
            </small>
          </h2>
          <div className="dev-landing__grid">
            {group.tools.map((item) => (
              <Link
                className="dev-landing__card"
                key={item.path}
                to={item.path}
              >
                <div className="dev-landing__card-title-row">
                  <h3 className="dev-landing__card-title">{item.label}</h3>
                  <span className="dev-landing__arrow">→</span>
                </div>
                <p className="dev-landing__card-meta">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
