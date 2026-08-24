import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import './App.css';
import useAppScenes from './scaffold/hooks/useAppScenes';
import Loader from './scaffold/loader/Loader';
import Overlay from './scaffold/overlay/Overlay';
import {
  DEFAULT_SCENE_PATH,
  getAreaDefaultPath,
  resolveSceneRoute,
} from './sceneRegistry';

const DevLandingPage = lazy(() => import('./pages/dev/DevLandingPage'));
const LoadersPage = lazy(() => import('./pages/dev/LoadersPage'));
const IconsPage = lazy(() => import('./pages/dev/IconsPage'));
const GradientsPage = lazy(() => import('./pages/dev/GradientsPage'));
const GltfJsxPage = lazy(() => import('./pages/dev/GltfJsxPage'));
const RorschachWorkbenchPage = lazy(
  () => import('./pages/dev/RorschachWorkbenchPage')
);

// Renders as the Suspense fallback inside the Canvas. Signals to the parent
// that the scene is suspended so the Loader overlay stays visible.
function SuspenseSignal({ onSuspend }) {
  useEffect(() => {
    onSuspend(true);
    return () => onSuspend(false);
  }, [onSuspend]);
  return null;
}

/* ── Scene shell ─────────────────────────────────────────────
   Renders the current scene route and owns the canvas, overlay, and loader.
──────────────────────────────────────────────────────────── */
function SceneShell() {
  const location = useLocation();
  const { CanvasWrapper, SceneComponent, redirectPath, renderer } =
    useAppScenes();
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [suspended, setSuspended] = useState(false);
  const handleSuspend = useCallback((val) => {
    setSuspended(val);
    if (val) setLoaderVisible(true);
  }, []);

  if (redirectPath) {
    return (
      <Navigate
        to={{ pathname: redirectPath, search: location.search }}
        replace
      />
    );
  }

  return (
    <>
      <Overlay />
      <div className="App">
        <CanvasWrapper key={renderer}>
          {/* <AppStats /> */}
          <Suspense fallback={<SuspenseSignal onSuspend={handleSuspend} />}>
            {SceneComponent && <SceneComponent />}
          </Suspense>
        </CanvasWrapper>
        {loaderVisible && (
          <Loader
            onComplete={() => setLoaderVisible(false)}
            suspended={suspended}
          />
        )}
      </div>
    </>
  );
}

function AreaSceneRedirect({ area }) {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: getAreaDefaultPath(area), search: location.search }}
      replace
    />
  );
}

function FallbackRedirect() {
  const location = useLocation();
  const { redirectPath } = resolveSceneRoute(location.pathname);
  return (
    <Navigate
      to={{ pathname: redirectPath, search: location.search }}
      replace
    />
  );
}

// Redirects (legacy scene-id paths, wrong-area paths) carry the query string
// along — deep links like ?preset=<name> must survive the hop to the
// canonical scene path.
function SceneRoute() {
  const location = useLocation();
  const { scene, redirectPath } = resolveSceneRoute(location.pathname);

  if (!scene) {
    return (
      <Navigate
        to={{ pathname: redirectPath, search: location.search }}
        replace
      />
    );
  }

  return <SceneShell />;
}

/* ── App root ─────────────────────────────────────────────── */
export default function AppRoot() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={DEFAULT_SCENE_PATH} replace />} />

      {/* Dev utility pages — lazy-loaded, no app shell */}
      <Route
        path="/dev"
        element={
          <Suspense fallback={null}>
            <DevLandingPage />
          </Suspense>
        }
      />
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
      <Route
        path="/dev/color"
        element={
          <Suspense fallback={null}>
            <GradientsPage />
          </Suspense>
        }
      />
      <Route
        path="/dev/colors"
        element={
          <Suspense fallback={null}>
            <GradientsPage />
          </Suspense>
        }
      />
      <Route
        path="/dev/gltfjsx"
        element={
          <Suspense fallback={null}>
            <GltfJsxPage />
          </Suspense>
        }
      />
      <Route
        path="/dev/rorschach"
        element={
          <Suspense fallback={null}>
            <RorschachWorkbenchPage />
          </Suspense>
        }
      />

      <Route path="/testlab" element={<AreaSceneRedirect area="testlab" />} />
      <Route path="/toolbox" element={<AreaSceneRedirect area="toolbox" />} />
      <Route path="/wip" element={<AreaSceneRedirect area="wip" />} />

      <Route path="/:areaSegment/:sceneSlug" element={<SceneRoute />} />
      <Route path="/:sceneSlug" element={<SceneRoute />} />

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}
