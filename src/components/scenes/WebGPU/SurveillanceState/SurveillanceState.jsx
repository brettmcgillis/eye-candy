import React, { memo, useMemo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import Cables from './components/Cables';
import CameraArray from './components/CameraArray';
import FeedRenderer from './components/FeedRenderer';
import Floor from './components/Floor';
import Plugs from './components/Plugs';
import Television from './components/Television';
import useCables from './hooks/useCables';
import useChannelSwitcher from './hooks/useChannelSwitcher';
import useFeed from './hooks/useFeed';
import useSceneControls from './hooks/useSceneControls';
import { RIG_KEYS } from './utils/cableClient';
import { buildRig } from './utils/rig';

function SurveillanceState() {
  const config = useSceneControls();
  useSceneBackdrop({
    color: config.backgroundColor,
    fogFar: config.fogFar,
    fogNear: config.fogNear,
  });

  const rigKey = RIG_KEYS.map((key) => config[key]).join('|');
  const rig = useMemo(() => buildRig(config), [rigKey]);
  const labels = useMemo(() => rig.cameras.map((c) => c.label), [rig]);
  const cables = useCables(config);
  const feed = useFeed(config.feedResolution);

  const channelCount = rig.cameras.length;
  const channel = Math.min(config.channel, channelCount);
  const stepChannel = useChannelSwitcher({
    autoCycle: config.autoCycle,
    channel,
    channelCount,
    cycleSeconds: config.cycleSeconds,
    setControls: config.setControls,
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Floor floorColor={config.floorColor} />
      <Television
        config={config}
        feed={feed}
        labels={labels}
        onChannelStep={stepChannel}
      />
      <CameraArray
        cameras={rig.cameras}
        feed={feed}
        standColor={config.standColor}
        sway={config.rigSway}
      />
      <Cables cables={cables} />
      <Plugs cables={cables} />
      <FeedRenderer
        channel={channel}
        feed={feed}
        fov={config.feedFov}
        fps={config.feedFps}
      />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(SurveillanceState);
