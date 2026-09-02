import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { writeQueryParam } from '@utils/queryParams';

import {
  OVERLAY_HIDE_UI_QUERY_PARAM,
  getHideUIFromQueryParam,
} from '../overlayParams';

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

export default function useHideUI() {
  const location = useLocation();
  const [hideUI, setHideUI] = useState(getHideUIFromQueryParam);

  useEffect(() => {
    const hideUIFromQuery = getHideUIFromQueryParam();
    setHideUI((prev) => (prev === hideUIFromQuery ? prev : hideUIFromQuery));
  }, [location.search]);

  useEffect(() => {
    writeQueryParam(OVERLAY_HIDE_UI_QUERY_PARAM, hideUI ? '1' : null);
  }, [hideUI]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (isTypingTarget(e.target) || isTypingTarget(active)) return;

      if (e.shiftKey && e.key?.toLowerCase() === 'h') {
        e.preventDefault();
        setHideUI((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return [hideUI, setHideUI];
}
