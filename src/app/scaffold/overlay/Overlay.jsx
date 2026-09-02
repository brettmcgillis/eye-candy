import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { localEnv } from '@utils/appUtils';

import './Overlay.css';
import Date from './components/DateDisplay';
import ExternalLinks from './components/ExternalLinks';
import LevaPanel from './components/LevaPanel';
import Scenemoji from './components/Scenemoji';
import VersionTag from './components/VersionTag';
import useHideUI from './hooks/useHideUI';
import useOverlayIgPreset from './hooks/useOverlayIgPreset';
import { getNoLevaFromQueryParam } from './overlayParams';

function Overlay() {
  const location = useLocation();
  const local = localEnv();

  const overlayIgPreset = useOverlayIgPreset();
  const [hideUI] = useHideUI();
  const [showLeva, setShowLeva] = useState(
    () => !!local && !getNoLevaFromQueryParam()
  );

  const overlayClasses = [
    'overlay',
    overlayIgPreset ? `overlay-ig-${overlayIgPreset}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDebug = () => setShowLeva((s) => !s);

  useEffect(() => {
    if (getNoLevaFromQueryParam()) setShowLeva(false);
  }, [location.search]);

  useEffect(() => {
    if (hideUI && showLeva) setShowLeva(false);
  }, [hideUI, showLeva]);

  return (
    <div className={overlayClasses}>
      <div
        className={`top-right overlay-panel${showLeva ? ' leva-visible' : ''}`}
      >
        {!hideUI && <VersionTag />}
        <div className={`leva-panel-wrap${showLeva ? ' is-visible' : ''}`}>
          <LevaPanel visible={!hideUI && showLeva} />
        </div>
      </div>

      {!hideUI && (
        <div className="top-left overlay-panel">
          <Scenemoji onDebugToggle={handleDebug} />
        </div>
      )}

      {!hideUI && (
        <div className="bottom-left overlay-panel">
          <ExternalLinks />
        </div>
      )}

      {!hideUI && (
        <div className="bottom-right overlay-panel">
          <Date />
        </div>
      )}
    </div>
  );
}

export default Overlay;
