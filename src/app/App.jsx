import React, { Suspense } from 'react';

import './App.css';
import useAppScenes from './scaffold/hooks/useAppScenes';
import AppStats from './scaffold/leva/AppStats';
import Loader from './scaffold/loader/Loader';
import Overlay from './scaffold/overlay/Overlay';

/* ---------------------------------------------
   App
---------------------------------------------- */
function App() {
  const { CanvasWrapper, SceneComponent, renderer } = useAppScenes();

  return (
    <div className="App">
      <CanvasWrapper key={renderer}>
        <AppStats />
        <Suspense fallback={<Loader />}>
          {SceneComponent && <SceneComponent />}
        </Suspense>
      </CanvasWrapper>
    </div>
  );
}

export default function AppRoot() {
  return (
    <>
      <Overlay />
      <App />
    </>
  );
}
