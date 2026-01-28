import React from 'react';

import { Html } from '@react-three/drei';

import CRTTest from '../components/scenes/CRTTest/CrtTest';
import DumpsterFire from '../components/scenes/DumpsterFire/DumpsterFire';
import FoldedFrame from '../components/scenes/FoldedFrame/FoldedFrame';
import HandStuff from '../components/scenes/HandStuff/HandStuff';
import LoGlow from '../components/scenes/Loglow';
import NetworkTest from '../components/scenes/NetworkTest/NetworkTest';
import NewScene from '../components/scenes/NewScene';
import PaperStack from '../components/scenes/PaperStack/PaperStack';
import PixelHater from '../components/scenes/PixelHater/PixelHater';
import StrudelDoodle from '../components/scenes/StrudelDoodle/StrudelDoodle';

const noScene = {
  id: 'noScene',
  renderer: 'webgl',
  Component: () => (
    <Html>
      <p>💀</p>
    </Html>
  ),
  icon: '💀',
  public: true,
  linkable: true,
};

const pixelHater = {
  id: 'pixelHater',
  renderer: 'webgl',
  Component: PixelHater,
  label: 'PixelHater',
  icon: '👾',
  public: false,
  linkable: true,
};

const dumpsterFire = {
  id: 'dumpsterFire',
  renderer: 'webgl',
  Component: DumpsterFire,
  label: 'Dumpster Fire',
  icon: '👾',
  public: true,
  linkable: true,
};

const foldedFrame = {
  id: 'foldedFrame',
  renderer: 'webgl',
  Component: FoldedFrame,
  label: 'Folded Frame',
  icon: '👾',
  public: true,
  linkable: true,
};

const loGlow = {
  id: 'loGlow',
  renderer: 'webgl',
  Component: LoGlow,
  label: 'LoGlow',
  icon: '👾',
  public: true,
  linkable: true,
};

const newScene = {
  id: 'newScene',
  renderer: 'webgl',
  Component: NewScene,
  label: 'New Scene',
  icon: '👾',
  public: true,
  linkable: true,
};

const paperStack = {
  id: 'paperStack',
  renderer: 'webgl',
  Component: PaperStack,
  label: 'Paper Stack',
  icon: '👾',
  public: true,
  linkable: true,
};

const handStuff = {
  id: 'handStuff',
  renderer: 'webgl',
  Component: HandStuff,
  label: 'HandS tuff',
  icon: '👾',
  public: true,
  linkable: true,
};

const networkTest = {
  id: 'networkTest',
  renderer: 'webgpu',
  Component: NetworkTest,
  label: 'Network Test',
  icon: '👾',
  public: true,
  linkable: true,
};

const crtTest = {
  id: 'crtTest',
  renderer: 'webgl',
  Component: CRTTest,
  label: 'CRT Test',
  icon: '👾',
  public: true,
  linkable: true,
};

const strudelDoodle = {
  id: 'strudelDoodle',
  renderer: 'webgl',
  Component: StrudelDoodle,
  label: 'StrudelDoodle',
  icon: '👾',
  public: true,
  linkable: true,
};

const scenes = [
  noScene,
  pixelHater,
  dumpsterFire,
  foldedFrame,
  loGlow,
  newScene,
  paperStack,
  handStuff,
  networkTest,
  crtTest,
  strudelDoodle,
];

export default function useScenes() {
  return { scenes };
}
