/* --- Materials --- */
import React, { useMemo } from 'react';

import { audioFile } from '../../../../../../utils/appUtils';
import { STRUDEL_TRACKS } from '../../../../../../utils/tracks';
import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from '../../../../../materials/webGL/crt/crtBlueScreenMaterial';
import CRTSceneInSceneMaterial from '../../../../../materials/webGL/crt/crtSceneInSceneMaterial';
import CRTSceneMaterial from '../../../../../materials/webGL/crt/crtSceneMaterial';
import CRTShowMaterial from '../../../../../materials/webGL/crt/crtShowMaterial';
import CRTSmtpeStaticMaterial from '../../../../../materials/webGL/crt/crtSmtpeStaticMaterial';
// eslint-disable-next-line import/no-unresolved, import/extensions
import CRTStaticMaterial from '../../../../../materials/webGL/crt/crtStaticMaterial';
import TestScene from '../TestScene';

export default function useCableSubscription() {
  const channels = useMemo(
    () => [
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
        key: 'smtpe',
        video: <CRTSmtpeStaticMaterial />,
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
