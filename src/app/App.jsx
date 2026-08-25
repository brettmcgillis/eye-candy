import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import './App.css';
import useAppScenes from './scaffold/hooks/useAppScenes';
import Loader from './scaffold/loader/Loader';
import SuspenseSignal from './scaffold/loader/SuspenseSignal';
import useLoaderGate from './scaffold/loader/useLoaderGate';
import Overlay from './scaffold/overlay/Overlay';
import {
  DEFAULT_SCENE_PATH,
  getAreaDefaultPath,
  resolveSceneRoute,
} from './sceneRegistry';

const DevApp = import.meta.env.DEV ? lazy(() => import('@dev/DevApp')) : null;

/* ── Scene shell ─────────────────────────────────────────────
   Renders the current scene route and owns the canvas, overlay, and loader.
──────────────────────────────────────────────────────────── */
function SceneShell() {
  const location = useLocation();
  const { CanvasWrapper, SceneComponent, redirectPath, renderer } =
    useAppScenes();
  const { loaderVisible, suspended, handleSuspend, onLoaderComplete } =
    useLoaderGate();

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
          <Loader onComplete={onLoaderComplete} suspended={suspended} />
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

      {DevApp ? <Route path="/dev/*" element={<DevApp />} /> : null}

      <Route path="/testlab" element={<AreaSceneRedirect area="testlab" />} />
      <Route path="/toolbox" element={<AreaSceneRedirect area="toolbox" />} />
      <Route path="/wip" element={<AreaSceneRedirect area="wip" />} />

      <Route path="/:areaSegment/:sceneSlug" element={<SceneRoute />} />
      <Route path="/:sceneSlug" element={<SceneRoute />} />

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}
