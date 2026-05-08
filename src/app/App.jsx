import React, { Suspense, lazy, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import './App.css';
import useAppScenes from './scaffold/hooks/useAppScenes';
import AppStats from './scaffold/leva/AppStats';
import Loader from './scaffold/loader/Loader';
import Overlay from './scaffold/overlay/Overlay';

const LoadersPage = lazy(() => import('./pages/dev/LoadersPage'));
const IconsPage = lazy(() => import('./pages/dev/IconsPage'));

/* ── Scene shell ─────────────────────────────────────────────
   Rendered at /:sceneId. Owns the canvas, overlay, and loader.
   useAppScenes reads sceneId from useParams() internally.
──────────────────────────────────────────────────────────── */
function SceneShell() {
  const { CanvasWrapper, SceneComponent, renderer } = useAppScenes();
  const [loaderVisible, setLoaderVisible] = useState(true);

  return (
    <>
      <Overlay />
      <div className="App">
        <CanvasWrapper key={renderer}>
          <AppStats />
          <Suspense fallback={null}>
            {SceneComponent && <SceneComponent />}
          </Suspense>
        </CanvasWrapper>
        {loaderVisible && <Loader onComplete={() => setLoaderVisible(false)} />}
      </div>
    </>
  );
}

/* ── App root ─────────────────────────────────────────────── */
export default function AppRoot() {
  return (
    <Routes>
      {/* Landing placeholder — swap this for <Landing /> when ready */}
      <Route path="/" element={<Navigate to="/loGlow" replace />} />

      {/* Dev utility pages — lazy-loaded, no app shell */}
      <Route
        path="/dev/loaderpattern"
        element={
          <Suspense fallback={null}>
            <LoadersPage />
          </Suspense>
        }
      />
      <Route
        path="/dev/iconography"
        element={
          <Suspense fallback={null}>
            <IconsPage />
          </Suspense>
        }
      />

      {/* All scenes by ID — showcase routes are clean/shareable,
          other areas work too (Leva is the nav for those) */}
      <Route path="/:sceneId" element={<SceneShell />} />
    </Routes>
  );
}
