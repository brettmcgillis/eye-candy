import React, { useState } from 'react';

import { isLocalHost } from '../../../utils/appUtils';
import Date from './DateDisplay';
import ExternalLinks from './ExternalLinks';
import LevaPanel from './LevaPanel';
import './Overlay.css';
import VersionTag from './VersionTag';

function Overlay() {
  const local = isLocalHost();
  const [showLeva, setShowLeva] = useState(!!local);

  const handleDebug = () => {
    setShowLeva((s) => !s);
  };

  /* ---------------- render ---------------- */

  return (
    <div className="overlay">
      <div className="top-right overlay-panel">
        <VersionTag />
        <LevaPanel visible={showLeva} />
      </div>

      <div className="top-left overlay-panel">
        <span className="debug" onClick={handleDebug}>
          🔥{' '}
        </span>
        — 💀
      </div>

      <div className="bottom-left overlay-panel">
        <ExternalLinks />
      </div>

      <div className="bottom-right overlay-panel">
        <Date />
      </div>
    </div>
  );
}

export default Overlay;
