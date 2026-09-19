import { useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import selectMounted, { ensureAhead } from '../utils/mounting';

const CHECK_EVERY = 0.2;

export default function useMounted(walker, world, config) {
  const [mounted, setMounted] = useState([]);
  const keyRef = useRef('');
  const clock = useRef(0);

  useFrame((_, dt) => {
    clock.current += dt;
    if (clock.current < CHECK_EVERY) return;
    clock.current = 0;
    if (!walker.zone) return;
    ensureAhead(walker, world, config.mountMargin);
    const next = selectMounted(walker, world, config.mountMargin);
    const key = next.map((z) => z.id).join('|');
    if (key !== keyRef.current) {
      keyRef.current = key;
      setMounted(next);
    }
  });

  return mounted;
}
