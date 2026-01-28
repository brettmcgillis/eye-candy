import { useControls } from 'leva';

import React, { Suspense, useEffect, useMemo } from 'react';

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
import isLocalHost from '../utils/appUtils';
import './App.css';
import WebGLCanvas from './scaffold/canvas/WebGLCanvas';
import WebGPUCanvas from './scaffold/canvas/WebGPUCanvas';
import Loader from './scaffold/loader/Loader';

const SCENES = {
  None: {
    renderer: 'webgl',
    Component: () => (
      <Html>
        <p>💀</p>
      </Html>
    ),
  },

  PixelHater: { renderer: 'webgl', Component: PixelHater },
  DumpsterFire: { renderer: 'webgl', Component: DumpsterFire },
  FoldedFrame: { renderer: 'webgl', Component: FoldedFrame },
  LoGlow: { renderer: 'webgl', Component: LoGlow },
  NewScene: { renderer: 'webgl', Component: NewScene },
  PaperStack: { renderer: 'webgl', Component: PaperStack },
  HandStuff: { renderer: 'webgl', Component: HandStuff },
  NetworkTest: { renderer: 'webgpu', Component: NetworkTest },
  CrtTest: { renderer: 'webgl', Component: CRTTest },
  StrudelDoodle: { renderer: 'webgl', Component: StrudelDoodle },

  // 👇 when you start porting
  // CrtTest: { renderer: 'webgpu', Component: CRTTest },
};

/* ---------------------------------------------
   Query param helpers
---------------------------------------------- */

function getInitialScene() {
  const params = new URLSearchParams(window.location.search);
  const scene = params.get('scene');
  return scene && SCENES[scene] ? scene : 'None';
}

/* ---------------------------------------------
   App
---------------------------------------------- */

function App() {
  const initialScene = useMemo(getInitialScene, []);

  const { scene } = useControls(
    'Scene Selection',
    {
      scene: {
        options: Object.keys(SCENES),
        value: initialScene,
      },
    },
    { render: () => isLocalHost() }
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('scene', scene);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [scene]);

  const sceneDef = SCENES[scene];
  const SceneComponent = sceneDef?.Component;
  const renderer = sceneDef?.renderer ?? 'webgl';

  const CanvasWrapper = renderer === 'webgpu' ? WebGPUCanvas : WebGLCanvas;

  return (
    <div className="App">
      <CanvasWrapper key={renderer}>
        <Suspense fallback={<Loader />}>
          {SceneComponent && <SceneComponent />}
        </Suspense>
      </CanvasWrapper>
    </div>
  );
}

export default App;
