import React, { useMemo } from 'react';

import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from '@materials/webGL/crt/crtBlueScreenMaterial';
import CRTSceneInSceneMaterial from '@materials/webGL/crt/crtSceneInSceneMaterial';
import CRTSceneMaterial from '@materials/webGL/crt/crtSceneMaterial';
import CRTShowMaterial from '@materials/webGL/crt/crtShowMaterial';
import CRTSmtpeStaticMaterial from '@materials/webGL/crt/crtSmtpeStaticMaterial';
import CRTStaticMaterial from '@materials/webGL/crt/crtStaticMaterial';
import CRTBlueScreenWebGPU from '@materials/webGPU/crt/crtBlueScreenMaterial';
import CRTSceneInSceneWebGPU from '@materials/webGPU/crt/crtSceneInSceneMaterial';
import CRTSceneWebGPU from '@materials/webGPU/crt/crtSceneMaterial';
import CRTShowWebGPU from '@materials/webGPU/crt/crtShowMaterial';
import CRTSmtpeStaticWebGPU from '@materials/webGPU/crt/crtSmtpeStaticMaterial';
import CRTStaticWebGPU from '@materials/webGPU/crt/crtStaticMaterial';
import { audioFile } from '@utils/appUtils';
import { STRUDEL_TRACKS } from '@utils/tracks';

import TestScene from './TestScene';
import useInteractiveTvControls from './useInteractiveTvControls';

function createSharedAudio(channelKey) {
  switch (channelKey) {
    case 'static':
    case 'smtpe':
      return {
        type: 'file',
        url: audioFile('tv-static.mp3'),
        loop: true,
      };
    case 'homeVideo':
      return {
        type: 'file',
        url: audioFile('laugh-track.mp3'),
        loop: true,
      };
    case 'tv':
      return {
        type: 'file',
        url: audioFile('ren-and-stimpy.mp3'),
        loop: true,
      };
    case 'threeD':
      return {
        type: 'strudel',
        code: STRUDEL_TRACKS.threeD,
      };
    case 'pip':
      return {
        type: 'strudel',
        code: STRUDEL_TRACKS.weirderStuff,
      };
    default:
      return null;
  }
}

function createOffPanelEntry() {
  return {
    key: 'off',
    video: (
      <meshStandardMaterial
        key="off"
        color="#111111"
        roughness={0}
        metalness={1}
      />
    ),
    audio: null,
  };
}

export function useCrtControls() {
  return useInteractiveTvControls();
}

export function useCrtPanels(channels) {
  return useMemo(() => [createOffPanelEntry(), ...channels], [channels]);
}

export function useWebGLCrtChannels(controls) {
  const {
    ascii,
    homeVideo,
    noSignal,
    pip,
    smtpe,
    terminal,
    threeD,
    tv,
    tvStatic,
  } = controls;

  return useMemo(
    () => [
      {
        key: 'static',
        video: <CRTStaticMaterial key="static" {...tvStatic} />,
        audio: createSharedAudio('static'),
      },
      {
        key: 'smtpe',
        video: <CRTSmtpeStaticMaterial key="smtpe" {...smtpe} />,
        audio: createSharedAudio('smtpe'),
      },
      {
        key: 'vhs',
        video: (
          <CRTBlueScreenMaterial
            key="vhs"
            {...VHSSetting}
            {...noSignal}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        audio: createSharedAudio('vhs'),
      },
      {
        key: 'terminal',
        video: (
          <CRTBlueScreenMaterial
            key="terminal"
            {...TerminalSetting}
            {...terminal}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        audio: createSharedAudio('terminal'),
      },
      {
        key: 'ascii',
        video: <CRTBlueScreenMaterial key="ascii" {...ascii} />,
        audio: createSharedAudio('ascii'),
      },
      {
        key: 'homeVideo',
        video: <CRTShowMaterial key="homeVideo" useWebcam {...homeVideo} />,
        audio: createSharedAudio('homeVideo'),
      },
      {
        key: 'tv',
        video: <CRTShowMaterial key="tv" {...tv} />,
        audio: createSharedAudio('tv'),
      },
      {
        key: 'threeD',
        video: (
          <CRTSceneMaterial key="threeD" scene={<TestScene />} {...threeD} />
        ),
        audio: createSharedAudio('threeD'),
      },
      {
        key: 'pip',
        video: <CRTSceneInSceneMaterial key="pip" {...pip} />,
        audio: createSharedAudio('pip'),
      },
    ],
    [ascii, homeVideo, noSignal, pip, smtpe, terminal, threeD, tv, tvStatic]
  );
}

export function useWebGPUCrtChannels(controls) {
  const {
    ascii,
    homeVideo,
    noSignal,
    pip,
    smtpe,
    terminal,
    threeD,
    tv,
    tvStatic,
  } = controls;

  return useMemo(
    () => [
      {
        key: 'static',
        video: <CRTStaticWebGPU key="static" {...tvStatic} />,
        audio: createSharedAudio('static'),
      },
      {
        key: 'smtpe',
        video: <CRTSmtpeStaticWebGPU key="smtpe" {...smtpe} />,
        audio: createSharedAudio('smtpe'),
      },
      {
        key: 'vhs',
        video: (
          <CRTBlueScreenWebGPU
            key="vhs"
            {...VHSSetting}
            {...noSignal}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        audio: createSharedAudio('vhs'),
      },
      {
        key: 'terminal',
        video: (
          <CRTBlueScreenWebGPU
            key="terminal"
            {...TerminalSetting}
            {...terminal}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        audio: createSharedAudio('terminal'),
      },
      {
        key: 'ascii',
        video: <CRTBlueScreenWebGPU key="ascii" {...ascii} />,
        audio: createSharedAudio('ascii'),
      },
      {
        key: 'homeVideo',
        video: <CRTShowWebGPU key="homeVideo" useWebcam {...homeVideo} />,
        audio: createSharedAudio('homeVideo'),
      },
      {
        key: 'tv',
        video: <CRTShowWebGPU key="tv" {...tv} />,
        audio: createSharedAudio('tv'),
      },
      {
        key: 'threeD',
        video: (
          <CRTSceneWebGPU key="threeD" scene={<TestScene />} {...threeD} />
        ),
        audio: createSharedAudio('threeD'),
      },
      {
        key: 'pip',
        video: <CRTSceneInSceneWebGPU key="pip" {...pip} />,
        audio: createSharedAudio('pip'),
      },
    ],
    [ascii, homeVideo, noSignal, pip, smtpe, terminal, threeD, tv, tvStatic]
  );
}
