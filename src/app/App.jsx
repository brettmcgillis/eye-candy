import React, { Suspense } from 'react';

import './App.css';
import useAppScenes from './scaffold/hooks/useAppScenes';
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
