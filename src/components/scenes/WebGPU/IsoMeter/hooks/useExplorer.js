import { useCallback, useEffect, useRef, useState } from 'react';

const ORIGIN = { i: 0, j: 0, k: 0 };

export default function useExplorer({
  exploreAxis,
  exploreStep,
  holdSeconds,
  motion,
}) {
  const [offset, setOffset] = useState(ORIGIN);
  const timerRef = useRef(null);
  const exploring = motion === 'explore';

  useEffect(() => {
    if (!exploring) setOffset(ORIGIN);
  }, [exploring]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onBuilt = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!exploring) return;
    timerRef.current = setTimeout(() => {
      setOffset((current) => ({
        ...current,
        [exploreAxis]: current[exploreAxis] + exploreStep,
      }));
    }, holdSeconds * 1000);
  }, [exploreAxis, exploreStep, exploring, holdSeconds]);

  return { offset, onBuilt };
}
