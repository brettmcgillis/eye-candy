import * as THREE from 'three';

import React, { useEffect, useMemo } from 'react';

import { audioFile } from '../../../../utils/appUtils';
import { STRUDEL_TRACKS } from '../../../../utils/tracks';
import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from '../../../materials/webGL/crt/crtBlueScreenMaterial';
import CRTSceneInSceneMaterial from '../../../materials/webGL/crt/crtSceneInSceneMaterial';
import CRTSceneMaterial from '../../../materials/webGL/crt/crtSceneMaterial';
import CRTShowMaterial from '../../../materials/webGL/crt/crtShowMaterial';
import CRTSmtpeStaticMaterial from '../../../materials/webGL/crt/crtSmtpeStaticMaterial';
import CRTStaticMaterial from '../../../materials/webGL/crt/crtStaticMaterial';
import TestScene from './TestScene';
import useInteractiveTvControls from './useInteractiveTvControls';

const LABEL_FONT = "700 76px 'VT323', 'Courier New', monospace";
const SUBLABEL_FONT = "600 34px 'Courier New', monospace";

function drawScanlines(ctx, strength = 0.12, spacing = 8) {
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(Math.max(strength, 0), 1) * 0.18})`;
  for (let y = 0; y < ctx.canvas.height; y += spacing) {
    ctx.fillRect(0, y, ctx.canvas.width, Math.max(1, spacing / 2));
  }
  ctx.restore();
}

function drawNoise(ctx, amount = 0.08) {
  const density = Math.floor(1200 + amount * 4200);

  ctx.save();
  for (let i = 0; i < density; i += 1) {
    const x = Math.random() * ctx.canvas.width;
    const y = Math.random() * ctx.canvas.height;
    const size = 1 + Math.random() * 3;
    const shade = Math.floor(100 + Math.random() * 155);
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.08 + Math.random() * 0.3})`;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawFrame(ctx, color = '#ffffff') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 18;
  ctx.strokeRect(22, 22, ctx.canvas.width - 44, ctx.canvas.height - 44);
  ctx.lineWidth = 4;
  ctx.strokeRect(46, 46, ctx.canvas.width - 92, ctx.canvas.height - 92);
  ctx.restore();
}

function firstMeaningfulLine(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const line = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find(Boolean);

  return line || fallback;
}

function createPlaceholderTexture({
  accentColor = '#38bdf8',
  backgroundColor = '#050505',
  bars,
  label,
  noiseAmount = 0.04,
  overlayColor = '#ffffff',
  scanlineStrength = 0.12,
  subLabel,
  variant = 'text',
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (variant === 'bars' && Array.isArray(bars) && bars.length) {
    const barHeight = canvas.height * 0.56;
    const barWidth = canvas.width / bars.length;
    bars.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(index * barWidth, 88, barWidth + 2, barHeight);
    });
    ctx.fillStyle = '#111111';
    ctx.fillRect(
      0,
      88 + barHeight,
      canvas.width,
      canvas.height - barHeight - 88
    );
    ctx.fillStyle = '#d4d4d4';
    ctx.fillRect(88, canvas.height - 230, 180, 76);
  }

  if (variant === 'feedback') {
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    for (let i = 0; i < 6; i += 1) {
      const inset = 120 + i * 56;
      ctx.globalAlpha = 0.85 - i * 0.12;
      ctx.strokeRect(
        inset,
        inset,
        canvas.width - inset * 2,
        canvas.height - inset * 2
      );
    }
    ctx.restore();
  }

  if (variant === 'radial') {
    ctx.save();
    for (let i = 0; i < 14; i += 1) {
      const alpha = 0.08 + i * 0.03;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3 + i;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 90 + i * 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawNoise(ctx, noiseAmount);
  drawScanlines(ctx, scanlineStrength);
  drawFrame(ctx, accentColor);

  ctx.save();
  ctx.fillStyle = overlayColor;
  ctx.textAlign = 'center';
  ctx.font = LABEL_FONT;
  ctx.fillText(label, canvas.width / 2, canvas.height * 0.66);

  if (subLabel) {
    ctx.font = SUBLABEL_FONT;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillText(subLabel, canvas.width / 2, canvas.height * 0.76);
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function CrtPlaceholderMaterial(props) {
  const texture = useMemo(() => createPlaceholderTexture(props), [props]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

function getWebGPUPlaceholderConfig(channelKey, controls) {
  switch (channelKey) {
    case 'static':
      return {
        accentColor: '#f5f5f5',
        backgroundColor: '#050505',
        label: 'STATIC',
        noiseAmount: controls.tvStatic.snowAmount,
        overlayColor: '#f5f5f5',
        scanlineStrength: controls.tvStatic.bandStrength,
      };
    case 'smtpe':
      return {
        accentColor: '#f8fafc',
        backgroundColor: '#050505',
        bars: [
          '#f8fafc',
          '#facc15',
          '#22d3ee',
          '#22c55e',
          '#f43f5e',
          '#2563eb',
        ],
        label: 'SMPTE',
        noiseAmount: controls.smtpe.staticAmount * 0.35,
        scanlineStrength: controls.smtpe.scanlineStrength,
        subLabel: 'webgpu placeholder',
        variant: 'bars',
      };
    case 'vhs':
      return {
        accentColor: controls.noSignal.fontColor,
        backgroundColor: controls.noSignal.screenColor,
        label: 'INSERT VHS',
        noiseAmount: controls.noSignal.noiseStrength,
        overlayColor: controls.noSignal.fontColor,
        scanlineStrength: controls.noSignal.scanlineStrength,
        subLabel: firstMeaningfulLine(
          controls.noSignal.screenText,
          'no signal'
        ),
      };
    case 'terminal':
      return {
        accentColor: controls.terminal.fontColor,
        backgroundColor: controls.terminal.screenColor,
        label: 'TERMINAL',
        noiseAmount: controls.terminal.noiseStrength,
        overlayColor: controls.terminal.fontColor,
        scanlineStrength: controls.terminal.scanlineStrength,
        subLabel: firstMeaningfulLine(
          controls.terminal.screenText,
          'boot error'
        ),
      };
    case 'ascii':
      return {
        accentColor: controls.ascii.fontColor,
        backgroundColor: controls.ascii.screenColor,
        label: 'ASCII',
        noiseAmount: controls.ascii.noiseStrength,
        overlayColor: controls.ascii.fontColor,
        scanlineStrength: controls.ascii.scanlineStrength,
        subLabel: 'skull feed',
      };
    case 'homeVideo':
      return {
        accentColor: '#f59e0b',
        backgroundColor: '#28150f',
        label: 'HOME VIDEO',
        noiseAmount: controls.homeVideo.staticAmount * 0.6,
        overlayColor: '#fde68a',
        scanlineStrength: controls.homeVideo.scanlineStrength,
        subLabel: 'webcam placeholder',
      };
    case 'tv':
      return {
        accentColor: '#38bdf8',
        backgroundColor: '#0f172a',
        label: 'TV FEED',
        noiseAmount: controls.tv.staticAmount * 0.6,
        overlayColor: '#e0f2fe',
        scanlineStrength: controls.tv.scanlineStrength,
        subLabel: 'show placeholder',
      };
    case 'threeD':
      return {
        accentColor: '#f472b6',
        backgroundColor: '#120916',
        label: '3D TEST',
        noiseAmount: controls.threeD.staticAmount,
        overlayColor: '#f5d0fe',
        scanlineStrength: controls.threeD.scanlineStrength,
        subLabel: 'scene placeholder',
        variant: 'radial',
      };
    case 'pip':
    default:
      return {
        accentColor: '#67e8f9',
        backgroundColor: '#082f49',
        label: 'PIP',
        noiseAmount: controls.pip.staticAmount,
        overlayColor: '#cffafe',
        scanlineStrength: controls.pip.scanlineStrength,
        subLabel: 'feedback placeholder',
        variant: 'feedback',
      };
  }
}

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
  return useMemo(
    () =>
      [
        'static',
        'smtpe',
        'vhs',
        'terminal',
        'ascii',
        'homeVideo',
        'tv',
        'threeD',
        'pip',
      ].map((channelKey) => ({
        key: channelKey,
        video: (
          <CrtPlaceholderMaterial
            key={channelKey}
            {...getWebGPUPlaceholderConfig(channelKey, controls)}
          />
        ),
        audio: createSharedAudio(channelKey),
      })),
    [controls]
  );
}
