import { useMemo } from 'react';

import { useThree } from '@react-three/fiber';

export default function useResponsiveCamera({
  desktopFov,
  desktopPosition,
  desktopTarget,
  mobileFov,
  mobilePosition,
  mobileTarget,
}) {
  const size = useThree((state) => state.size);
  const isPortrait = size.width < size.height;

  const cameraPosition = useMemo(() => {
    const position = isPortrait ? mobilePosition : desktopPosition;

    return [position.x, position.y, position.z];
  }, [
    desktopPosition.x,
    desktopPosition.y,
    desktopPosition.z,
    isPortrait,
    mobilePosition.x,
    mobilePosition.y,
    mobilePosition.z,
  ]);

  const cameraTarget = useMemo(() => {
    const target = isPortrait ? mobileTarget : desktopTarget;

    return [target.x, target.y, target.z];
  }, [
    desktopTarget.x,
    desktopTarget.y,
    desktopTarget.z,
    isPortrait,
    mobileTarget.x,
    mobileTarget.y,
    mobileTarget.z,
  ]);

  const cameraFov = isPortrait ? mobileFov : desktopFov;

  return { cameraFov, cameraPosition, cameraTarget, isPortrait };
}
