import React, { Suspense, useState } from 'react';

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
  const [loaderVisible, setLoaderVisible] = useState(true);

  return (
    <div className="App">
      <CanvasWrapper key={renderer}>
        <AppStats />
        <Suspense fallback={null}>
          {SceneComponent && <SceneComponent />}
        </Suspense>
      </CanvasWrapper>
      {loaderVisible && (
        <Loader onComplete={() => setLoaderVisible(false)} />
      )}
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
