import { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import {
  fog,
  positionView,
  smoothstep,
  color as tslColor,
  uniform,
} from 'three/tsl';

// Plain distance fog, not the scene's raymarched volume — enough to judge how
// far down a corridor reads before it dissolves.
function ToolboxFog({ config }) {
  const scene = useThree((state) => state.scene);

  const uniforms = useMemo(
    () => ({
      color: uniform(tslColor(config.fogColor)),
      near: uniform(config.fogNear),
      far: uniform(config.fogFar),
    }),
    []
  );

  useEffect(() => {
    uniforms.color.value.set(config.fogColor);
    uniforms.near.value = config.fogNear;
    uniforms.far.value = config.fogFar;
  }, [config.fogColor, config.fogFar, config.fogNear, uniforms]);

  const fogNode = useMemo(
    () =>
      fog(
        uniforms.color,
        smoothstep(
          uniforms.near,
          uniforms.far.max(uniforms.near.add(0.01)),
          positionView.z.negate()
        )
      ),
    [uniforms]
  );

  useEffect(() => {
    if (!scene) return undefined;
    const previous = scene.fogNode;
    scene.fogNode = config.fogEnabled ? fogNode : null;
    return () => {
      scene.fogNode = previous ?? null;
    };
  }, [config.fogEnabled, fogNode, scene]);

  return null;
}

export default memo(ToolboxFog);
