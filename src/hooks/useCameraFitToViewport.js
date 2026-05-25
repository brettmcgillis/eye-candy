import { useEffect, useMemo, useState } from 'react';

import { useThree } from '@react-three/fiber';

function cloneTuple(value, fallback) {
  return Array.isArray(value) ? [...value] : [...fallback];
}

function getViewportSize(fallbackSize = {}) {
  if (typeof window === 'undefined') {
    return {
      width: fallbackSize.width ?? 0,
      height: fallbackSize.height ?? 0,
    };
  }

  return {
    width:
      window.visualViewport?.width ??
      window.innerWidth ??
      fallbackSize.width ??
      0,
    height:
      window.visualViewport?.height ??
      window.innerHeight ??
      fallbackSize.height ??
      0,
  };
}

export default function useCameraFitToViewport({
  desktopFov,
  desktopPosition,
  desktopTarget,
  mobileFov,
  mobilePosition,
  mobileTarget,
}) {
  const size = useThree((state) => state.size);
  const [viewportSize, setViewportSize] = useState(() => getViewportSize(size));

  useEffect(() => {
    const syncViewportSize = () => {
      setViewportSize((prev) => {
        const next = getViewportSize(size);

        if (prev.width === next.width && prev.height === next.height) {
          return prev;
        }

        return next;
      });
    };

    syncViewportSize();

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('resize', syncViewportSize);
    window.addEventListener('orientationchange', syncViewportSize);
    window.visualViewport?.addEventListener('resize', syncViewportSize);

    return () => {
      window.removeEventListener('resize', syncViewportSize);
      window.removeEventListener('orientationchange', syncViewportSize);
      window.visualViewport?.removeEventListener('resize', syncViewportSize);
    };
  }, [size]);

  const viewportWidth = viewportSize.width || size.width;
  const viewportHeight = viewportSize.height || size.height;
  const isPortrait = viewportWidth < viewportHeight;
  const activePosition = isPortrait
    ? (mobilePosition ?? desktopPosition)
    : desktopPosition;
  const activeTarget = isPortrait
    ? (mobileTarget ?? desktopTarget)
    : desktopTarget;

  const cameraPosition = useMemo(
    () => cloneTuple(activePosition, [0, 0, 5]),
    [activePosition]
  );
  const cameraTarget = useMemo(
    () => cloneTuple(activeTarget, [0, 0, 0]),
    [activeTarget]
  );
  const cameraFov = isPortrait ? (mobileFov ?? desktopFov) : desktopFov;

  return {
    cameraFov,
    cameraPosition,
    cameraTarget,
    isPortrait,
  };
}
