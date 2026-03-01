import React, { useState } from 'react';

import { localEnv } from '../../../utils/appUtils';
import Date from './DateDisplay';
import ExternalLinks from './ExternalLinks';
import LevaPanel from './LevaPanel';
import './Overlay.css';
import Scenemoji from './Scenemoji';
import VersionTag from './VersionTag';

const OVERLAY_IG_QUERY_PARAM = 'ig';

const OVERLAY_IG_PRESETS = {
  story: 'story',
  reel: 'reel',
  post: 'post',
};

function getOverlayIgPreset() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const rawPreset = params.get(OVERLAY_IG_QUERY_PARAM);

  if (!rawPreset) return null;

  const normalized = rawPreset.trim().toLowerCase();
  return OVERLAY_IG_PRESETS[normalized] || null;
}

function Overlay() {
  const local = localEnv();
  const overlayIgPreset = getOverlayIgPreset();
  const [showLeva, setShowLeva] = useState(!!local);
  const overlayClasses = [
    'overlay',
    overlayIgPreset ? `overlay-ig-${overlayIgPreset}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDebug = () => {
    setShowLeva((s) => !s);
  };

  /* ---------------- render ---------------- */

  return (
    <div className={overlayClasses}>
      <div
        className={`top-right overlay-panel${showLeva ? ' leva-visible' : ''}`}
      >
        <VersionTag />
        <div className={`leva-panel-wrap${showLeva ? ' is-visible' : ''}`}>
          <LevaPanel visible={showLeva} />
        </div>
      </div>

      <div className="top-left overlay-panel">
        <Scenemoji onDebugToggle={handleDebug} />
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
