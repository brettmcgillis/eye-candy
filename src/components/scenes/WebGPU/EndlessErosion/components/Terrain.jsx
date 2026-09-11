import React, { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';

import usePointerStroke from '../hooks/usePointerStroke';
import {
  animatedErosion,
  animatedWaterHeight,
  scrollOffset,
} from '../utils/animation';
import {
  applyFieldUniforms,
  applyShadingUniforms,
} from '../utils/applyUniforms';
import { DEBUG_VIEWS } from '../utils/debugView';
import createViewUniforms, { syncCamera } from '../utils/viewUniforms';
import MeshView from './MeshView';
import RaymarchView from './RaymarchView';

function Terrain({ config, field, uniforms }) {
  const gl = useThree((state) => state.gl);
  const view = useRef(createViewUniforms()).current;
  const timeRef = useRef(0);
  const detailScrollRef = useRef(null);
  const painting = config.paintEnabled;
  const stroke = usePointerStroke(painting);
  const { paintApiRef } = config;

  useRenderScale(config.renderScale);

  useEffect(() => {
    if (!painting) {
      return undefined;
    }

    field.seedPaint(gl);
    paintApiRef.current = { reset: () => field.seedPaint(gl) };

    return () => {
      paintApiRef.current = null;
    };
  }, [field, gl, painting, paintApiRef]);

  useFrame((state, delta) => {
    timeRef.current += delta * config.timeScale;
    const time = timeRef.current;

    const overrides = config.animateErosion
      ? animatedErosion(config, time)
      : {};

    overrides.waterHeight = config.animateWater
      ? animatedWaterHeight(config.waterHeight, time)
      : config.waterHeight;

    // Painting is done on a terrain that holds still — a scrolling base would
    // slide out from under the stroke that was just laid on it.
    const scroll = painting
      ? { fracX: 0, fracY: 0, intX: 0, intY: 0 }
      : scrollOffset(
          time,
          {
            drift: config.scrollDrift,
            period: config.scrollPeriod,
            radius: config.scrollRadius,
          },
          field.resolution
        );

    uniforms.scrollInt.value.set(scroll.intX, scroll.intY);
    uniforms.scrollFrac.value.set(scroll.fracX, scroll.fracY);

    applyFieldUniforms(uniforms, config, overrides);
    applyShadingUniforms(uniforms, config);

    const scrollKey = `${scroll.intX},${scroll.intY}`;
    if (detailScrollRef.current !== scrollKey) {
      detailScrollRef.current = scrollKey;
      field.bakeDetail(gl);
    }

    if (painting) {
      const { active, lower, u, v } = stroke.current;

      field.setBrush({
        radius: config.brushSize,
        rate: active ? config.brushStrength * delta * (lower ? -1 : 1) : 0,
        u,
        v,
      });

      if (active) {
        field.paint(gl);
      }
    }

    field.bakeHeight(gl, painting ? 'painted' : 'procedural');

    view.debugView.value = Math.max(0, DEBUG_VIEWS.indexOf(config.debugView));
    syncCamera(view, state.camera, state.size);
  });

  return config.viewMode === 'Mesh' ? (
    <MeshView
      config={config}
      field={field}
      resolution={config.meshResolution}
      uniforms={uniforms}
    />
  ) : (
    <RaymarchView
      field={field}
      quality={config.raymarchQuality}
      uniforms={uniforms}
      view={view}
    />
  );
}

export default memo(Terrain);
