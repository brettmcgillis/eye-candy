import { levaStore } from 'leva';

import React, { useEffect, useState } from 'react';

import { localEnv } from '../../../utils/appUtils';
import './Overlay.css';
import Date from './components/DateDisplay';
import ExternalLinks from './components/ExternalLinks';
import LevaPanel from './components/LevaPanel';
import Scenemoji from './components/Scenemoji';
import VersionTag from './components/VersionTag';

const OVERLAY_IG_QUERY_PARAM = 'ig';
const OVERLAY_HIDE_UI_QUERY_PARAM = 'hideUI';

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

function normalizeOverlayIgPreset(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return OVERLAY_IG_PRESETS[normalized] || null;
}

function getHideUIFromQueryParam() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.has(OVERLAY_HIDE_UI_QUERY_PARAM);
}

function isTypingTarget(target) {
  if (!target) return false;

  const tagName = target.tagName?.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

function Overlay() {
  const local = localEnv();
  const readLevaValue = (state, keys) => {
    const values = keys.map((key) => state.data?.[key]?.value);
    return values.find((value) => value !== undefined);
  };

  const levaIgPreset = levaStore.useStore((state) =>
    readLevaValue(state, ['App.Overlay.ig', 'App.ig', 'Scene Select.ig'])
  );
  const overlayIgPreset =
    levaIgPreset === undefined
      ? getOverlayIgPreset()
      : normalizeOverlayIgPreset(levaIgPreset);
  const [showLeva, setShowLeva] = useState(!!local);
  const [hideUI, setHideUI] = useState(() => getHideUIFromQueryParam());

  const overlayClasses = [
    'overlay',
    overlayIgPreset ? `overlay-ig-${overlayIgPreset}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDebug = () => {
    setShowLeva((s) => !s);
  };

  // Auto-hide Leva when UI is hidden
  useEffect(() => {
    if (hideUI && showLeva) {
      setShowLeva(false);
    }
  }, [hideUI, showLeva]);

  // Hotkey to toggle UI visibility (Shift+H)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (isTypingTarget(e.target) || isTypingTarget(active)) {
        return;
      }

      if (e.shiftKey && e.key?.toLowerCase() === 'h') {
        e.preventDefault();
        setHideUI((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---------------- render ---------------- */

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
