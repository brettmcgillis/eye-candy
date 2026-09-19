import React, { useState } from 'react';
import { FiImage, FiSliders } from 'react-icons/fi';

// Desktop shows both panels side by side; below the CSS breakpoint only one
// of `controls`/`results` is visible at a time, chosen by this tab bar, so
// mobile no longer has to scroll past every render setting to reach the
// gallery. The bar itself is hidden by CSS above the breakpoint.
export default function WorkbenchLayout({ controls, results }) {
  const [tab, setTab] = useState('controls');

  return (
    <div className="rw-layout" data-active-tab={tab}>
      <div
        aria-label="Workbench panels"
        className="rw-layout__tabs"
        role="tablist"
      >
        <button
          aria-selected={tab === 'controls'}
          onClick={() => setTab('controls')}
          role="tab"
          type="button"
        >
          <FiSliders /> Settings
        </button>
        <button
          aria-selected={tab === 'results'}
          onClick={() => setTab('results')}
          role="tab"
          type="button"
        >
          <FiImage /> Gallery
        </button>
      </div>
      {controls}
      {results}
    </div>
  );
}
