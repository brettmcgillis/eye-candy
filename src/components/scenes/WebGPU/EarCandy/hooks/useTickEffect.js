import { useEffect, useRef } from 'react';

export default function useTickEffect(tick, effect) {
  const seen = useRef(tick);

  useEffect(() => {
    if (seen.current === tick) return;
    seen.current = tick;
    effect();
  }, [tick, effect]);
}
