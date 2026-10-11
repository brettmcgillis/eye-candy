import { useMemo } from 'react';

import { useThree } from '@react-three/fiber';

export const WORLD_HEIGHT = 100;

export default function useStage() {
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  return useMemo(
    () => ({ height: WORLD_HEIGHT, width: (WORLD_HEIGHT * width) / height }),
    [width, height]
  );
}
