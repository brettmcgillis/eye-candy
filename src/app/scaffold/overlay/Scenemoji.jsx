import { levaStore } from 'leva';
import React from 'react';

import useScenes from '../../useScenes';

const SCENE_CONTROL_PATH = 'Scene Selection.scene';
const FALLBACK_EMOJI = '💀';

export default function Scenemoji({ onDebugToggle }) {
  const { scenes } = useScenes();

  const sceneId = levaStore.useStore(
    (state) => state.data?.[SCENE_CONTROL_PATH]?.value
  );

  const scene = scenes.find((s) => s.id === sceneId);
  const emoji = scene?.icon || FALLBACK_EMOJI;

  return (
    <>
      <span className="debug" onClick={onDebugToggle}>
        🔥{' '}
      </span>
      — {emoji}
    </>
  );
}
