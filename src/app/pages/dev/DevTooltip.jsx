import React, { useId } from 'react';

import './DevTooltip.css';

export default function DevTooltip({ children, label = 'More information' }) {
  const tooltipId = useId();

  if (!children) {
    return null;
  }

  return (
    <span className="dev-tooltip">
      <button
        aria-describedby={tooltipId}
        aria-label={label}
        className="dev-tooltip__trigger"
        type="button"
      >
        ?
      </button>
      <span className="dev-tooltip__content" id={tooltipId} role="tooltip">
        {children}
      </span>
    </span>
  );
}
