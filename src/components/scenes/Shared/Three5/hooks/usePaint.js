import { useEffect, useRef, useState } from 'react';

import {
  CanvasTexture,
  LinearFilter,
  NoColorSpace,
  SRGBColorSpace,
} from 'three';

import createBrushRuntime from '../utils/brushRuntime';
import paintAssets from '../utils/paintAssets';
import { PAINT_KEYS } from '../utils/settings';

export default function usePaint(config, strokes, revision) {
  const runtimeRef = useRef(null);
  const configRef = useRef(config);
  configRef.current = config;
  const [result, setResult] = useState({ assets: null, busy: true, error: '' });
  const [engineVersion, setEngineVersion] = useState(0);
  const paintKey = JSON.stringify(PAINT_KEYS.map((key) => config[key]));
  const requestKey = JSON.stringify([engineVersion, paintKey, revision]);

  useEffect(() => {
    let active = true;
    let runtime;
    createBrushRuntime(config.backend)
      .then((next) => {
        runtime = next;
        if (!active) next.dispose();
        else {
          runtimeRef.current = next;
          setEngineVersion((value) => value + 1);
        }
      })
      .catch((error) => {
        if (active)
          setResult((value) => ({
            ...value,
            busy: false,
            error: error.message,
          }));
      });
    return () => {
      active = false;
      runtimeRef.current = null;
      runtime?.dispose();
    };
  }, [config.backend]);

  useEffect(() => {
    if (!runtimeRef.current) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      setResult((value) => ({ ...value, busy: true, error: '' }));
      try {
        const requested = configRef.current;
        const paintedStrokes = strokes.current;
        const painted = await paintAssets(
          runtimeRef.current,
          requested,
          paintedStrokes
        );
        if (!active || !painted) return;
        const assets = {
          ...painted,
          experiment: requested.experiment,
          lastStrokeId: paintedStrokes.at(-1)?.id || 0,
        };
        Object.keys(painted)
          .filter((key) => painted[key]?.getContext)
          .forEach((key) => {
            const texture = new CanvasTexture(painted[key]);
            texture.colorSpace = ['height', 'coverage'].includes(key)
              ? NoColorSpace
              : SRGBColorSpace;
            if (key === 'stroke') {
              texture.minFilter = LinearFilter;
              texture.generateMipmaps = false;
            }
            assets[`${key}Texture`] = texture;
          });
        setResult({ assets, busy: false, error: '', requestKey });
      } catch (error) {
        if (active)
          setResult((value) => ({
            ...value,
            busy: false,
            error: error.message,
          }));
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [requestKey, strokes]);

  useEffect(
    () => () => {
      if (result.assets)
        Object.entries(result.assets).forEach(([key, value]) => {
          if (key.endsWith('Texture')) value.dispose();
        });
    },
    [result.assets]
  );

  return {
    ...result,
    busy: result.busy || (!result.error && result.requestKey !== requestKey),
    runtimeRef,
    engineVersion,
  };
}
