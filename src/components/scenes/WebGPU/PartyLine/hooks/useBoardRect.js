import { useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

const MARGIN = 4;

export default function useBoardRect() {
  const { height, width } = useThree((state) => state.size);
  const rectRef = useRef(null);

  const rect = useMemo(() => {
    const room = Math.max(120, Math.min(width, height) - MARGIN * 2);
    const x = (width - room) / 2;
    const y = (height - room) / 2;
    return {
      centerX: x + room / 2 - width / 2,
      centerY: height / 2 - (y + room / 2),
      size: room,
      toWorld: (u, v) => [
        x + u * room - width / 2,
        height / 2 - (y + v * room),
      ],
      x,
      y,
    };
  }, [height, width]);

  rectRef.current = rect;
  return { rect, rectRef };
}
