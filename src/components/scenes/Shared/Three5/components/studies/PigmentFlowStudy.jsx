import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  BufferAttribute,
  CanvasTexture,
  DoubleSide,
  DynamicDrawUsage,
  MultiplyBlending,
  PlaneGeometry,
  SRGBColorSpace,
  SphereGeometry,
} from 'three';

import useAnimationTimeline from '../../hooks/useAnimationTimeline';
import updateFlowUV from '../../utils/flowUV';
import paperGrain from '../../utils/paperGrain';
import AnimationStatus from './AnimationStatus';
import Comparison from './Comparison';

function flowGrid() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fbf4e5';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 16; y += 1)
    for (let x = 0; x < 16; x += 1) {
      ctx.fillStyle = (x + y) % 2 ? '#b9d4cb' : '#d6929d';
      ctx.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
    }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
function FlowSample({ config, assets, mode, timeline }) {
  const seen = useRef(NaN);
  const data = useMemo(() => {
    const geometry =
      config.animationSurface === 'sphere'
        ? new SphereGeometry(2.25, 64, 40)
        : new PlaneGeometry(5, 5, 64, 64);
    const base = geometry.attributes.uv.array.slice();
    geometry.attributes.uv.setUsage(DynamicDrawUsage);
    geometry.setAttribute(
      'uv1',
      new BufferAttribute(
        base.map((v) => v * 4),
        2
      )
    );
    return {
      geometry,
      base,
      grid: flowGrid(),
    };
  }, [config.animationSurface]);
  const grain = useMemo(
    () => paperGrain(config.seed, config.flowPaper),
    [config.seed, config.flowPaper]
  );
  useEffect(() => () => grain.texture.dispose(), [grain]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.grid.dispose();
    },
    [data]
  );
  useEffect(() => {
    seen.current = NaN;
  }, [config, data]);
  useFrame(() => {
    if (mode === 'original' || seen.current === timeline.phase) return;
    updateFlowUV(data.geometry, data.base, timeline.phase, config);
    seen.current = timeline.phase;
  });
  const map = mode === 'treatment' ? data.grid : assets.mainTexture;
  return (
    <>
      <mesh key={data.geometry.uuid} geometry={data.geometry}>
        {config.animationSurface === 'paper' ? (
          <meshBasicMaterial map={map} side={DoubleSide} toneMapped={false} />
        ) : (
          <meshStandardMaterial map={map} roughness={0.92} />
        )}
      </mesh>
      {mode !== 'original' && config.flowPaper > 0 && (
        <mesh geometry={data.geometry}>
          <meshBasicMaterial
            map={grain.texture}
            transparent
            premultipliedAlpha
            blending={MultiplyBlending}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  );
}
const Sample = memo(FlowSample);
function PigmentFlowStudy({ config, assets, actionsRef }) {
  const timeline = useAnimationTimeline(config, actionsRef);
  return (
    <>
      <Comparison
        config={config}
        sourceLabel="Baked watercolor"
        treatmentLabel={
          config.studyView === 'treatment'
            ? 'Animated UV grid'
            : 'Moving pigment / fixed paper'
        }
      >
        {(mode) => (
          <Sample
            config={config}
            assets={assets}
            mode={mode}
            timeline={timeline}
          />
        )}
      </Comparison>
      <AnimationStatus timeline={timeline} config={config} />
    </>
  );
}
export default memo(PigmentFlowStudy);
