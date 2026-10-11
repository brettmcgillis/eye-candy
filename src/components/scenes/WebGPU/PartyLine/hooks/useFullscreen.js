import { useCallback, useEffect, useState } from 'react';

const fullscreenElement = () =>
  document.fullscreenElement ?? document.webkitFullscreenElement ?? null;

export const fullscreenSupported = () =>
  Boolean(document.fullscreenEnabled ?? document.webkitFullscreenEnabled);

export const isStandaloneApp = () =>
  window.navigator.standalone === true ||
  window.matchMedia?.('(display-mode: standalone)').matches;

export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function useFullscreen() {
  const [active, setActive] = useState(() => Boolean(fullscreenElement()));

  useEffect(() => {
    const update = () => setActive(Boolean(fullscreenElement()));
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update);
    };
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    if (fullscreenElement()) {
      (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(
        document
      );
    } else {
      (root.requestFullscreen ?? root.webkitRequestFullscreen)?.call(root);
    }
  }, []);

  return { active, toggle };
}
