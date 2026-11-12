import React, { memo, useEffect, useMemo } from 'react';

import { DoubleSide, PlaneGeometry, SphereGeometry } from 'three';

import useAnimatedPaint from '../../hooks/useAnimatedPaint';
import useAnimationTimeline from '../../hooks/useAnimationTimeline';
import AnimationStatus from './AnimationStatus';
import Comparison from './Comparison';

const DETAILS = {
  washReveal: 'Animated wash reveal',
  washMorph: 'Native watercolor repaints',
  paintSequence: 'Ink + wash choreography',
};
function AnimatedPaintStudy({ config, assets, runtimeRef, actionsRef }) {
  const timeline = useAnimationTimeline(config, actionsRef);
  const data = useAnimatedPaint(
    config,
    assets,
    runtimeRef,
    timeline,
    actionsRef
  );
  const geometry = useMemo(
    () =>
      config.animationSurface === 'sphere'
        ? new SphereGeometry(2.25, 48, 32)
        : new PlaneGeometry(5, 5),
    [config.animationSurface]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <Comparison
        config={config}
        sourceLabel="Finished painting"
        treatmentLabel={
          config.studyView === 'treatment'
            ? 'Animation mechanism'
            : DETAILS[config.experiment]
        }
      >
        {(mode) => (
          <mesh key={geometry.uuid} geometry={geometry}>
            {config.animationSurface === 'paper' ? (
              <meshBasicMaterial
                map={mode === 'original' ? data.sourceTexture : data.texture}
                side={DoubleSide}
                toneMapped={false}
              />
            ) : (
              <meshStandardMaterial
                map={mode === 'original' ? data.sourceTexture : data.texture}
                roughness={0.92}
              />
            )}
          </mesh>
        )}
      </Comparison>
      <AnimationStatus
        timeline={timeline}
        config={config}
        status={data.status}
      />
    </>
  );
}
export default memo(AnimatedPaintStudy);
