import { useEffect, useMemo, useState } from 'react';

import { LAYOUT_KEYS } from '@modules/cables';
import { getPaletteStops } from '@modules/cablesRender';

const COLOUR_KEYS = [
  'colorMode',
  'cableColor',
  'accentColor',
  'accentShare',
  'shadeJitter',
  'paletteName',
  'plugs',
];
const KEYS = [...LAYOUT_KEYS, ...COLOUR_KEYS];
const REBUILD_DELAY_MS = 200;

// The generation for the current controls, laid in a worker; the last one
// stays on screen until the next arrives.
export default function useGeneration(config) {
  const key = KEYS.map((k) => config[k]).join('|');
  const settings = useMemo(
    () => Object.fromEntries(KEYS.map((k) => [k, config[k]])),
    [key]
  );
  const [generation, setGeneration] = useState(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../utils/cables.worker.js', import.meta.url),
      { type: 'module' }
    );
    const timer = setTimeout(() => {
      worker.onmessage = ({ data }) => {
        setGeneration(data);
        worker.terminate();
      };
      worker.postMessage({
        config: settings,
        stops: getPaletteStops(settings.paletteName),
      });
    }, REBUILD_DELAY_MS);
    return () => {
      clearTimeout(timer);
      worker.terminate();
    };
  }, [settings]);

  return generation;
}
