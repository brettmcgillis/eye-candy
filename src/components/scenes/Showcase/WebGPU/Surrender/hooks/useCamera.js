import { useMemo } from 'react';

import { useThree } from '@react-three/fiber';

export default function useCamera({ posX, posY }) {
  const size = useThree((state) => state.size);
  const isPortrait = size.width < size.height;

  const cameraPosition = useMemo(() => {
    if (isPortrait) {
      return [-0.5, 0.0, 3.8];
    }

    return [-0.5, 0.0, 2.5];
  }, [isPortrait]);

  const orbitTarget = useMemo(
    () =>
      isPortrait ? [posX + 0.1, posY + 0.5, 0] : [posX + 0.25, posY + 0.3, 0],
    [isPortrait, posX, posY]
  );

  return { cameraPosition, orbitTarget };
}
