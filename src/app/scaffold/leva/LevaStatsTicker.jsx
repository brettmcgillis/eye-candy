import { useFrame } from '@react-three/fiber';

import { tickLevaStatsPlugin } from './levaStatsPlugin';

export default function LevaStatsTicker() {
  useFrame(() => {
    tickLevaStatsPlugin();
  });

  return null;
}
