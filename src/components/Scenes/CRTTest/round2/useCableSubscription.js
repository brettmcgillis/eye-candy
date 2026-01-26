import React, { useMemo } from 'react';

/* --- Materials --- */
import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from 'components/scenes/CRTTest/CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from 'components/scenes/CRTTest/CRTSceneInSceneMaterial';
import CRTSceneMaterial from 'components/scenes/CRTTest/CRTSceneMaterial';
import CRTShowMaterial from 'components/scenes/CRTTest/CRTShowMaterial';
import CRTSnowMaterial from 'components/scenes/CRTTest/CRTSnowMaterial';
import CRTStaticMaterial from 'components/scenes/CRTTest/CRTStaticMaterial';
import TestScene from 'components/scenes/CRTTest/TestScene';

import { STRUDEL_TRACKS } from 'utils/tracks';

function audioFile(name) {
  return `${process.env.PUBLIC_URL}/audio/${name}`;
}

export default function useCableSubscription() {
  const channels = useMemo(
    () => [
      {
        key: 'snow',
        video: <CRTSnowMaterial />,
        audio: {
          type: 'file',
          url: audioFile('tv-static.mp3'),
          loop: true,
        },
      },
      {
        key: 'static',
        video: <CRTStaticMaterial />,
        audio: {
          type: 'file',
          url: audioFile('tv-static.mp3'),
          loop: true,
        },
      },
      {
        key: 'vhs',
        video: (
          <CRTBlueScreenMaterial
            {...VHSSetting}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        audio: null,
      },
      {
        key: 'terminal',
        video: (
          <CRTBlueScreenMaterial
            {...TerminalSetting}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        audio: null,
      },
      {
        key: 'homeVideo',
        video: <CRTShowMaterial useWebcam />,
        audio: {
          type: 'file',
          url: audioFile('laugh-track.mp3'),
          loop: true,
        },
      },
      {
        key: 'tv',
        video: <CRTShowMaterial />,
        audio: {
          type: 'file',
          url: audioFile('ren-and-stimpy.mp3'),
          loop: true,
        },
      },
      {
        key: 'threeD',
        video: <CRTSceneMaterial scene={<TestScene />} />,
        audio: {
          type: 'strudel',
          code: STRUDEL_TRACKS.threeD,
        },
      },

      {
        key: 'pip',
        video: <CRTSceneInSceneMaterial />,
        audio: {
          type: 'strudel',
          code: STRUDEL_TRACKS.weirderStuff,
        },
      },
    ],
    []
  );

  return { channels };
}
